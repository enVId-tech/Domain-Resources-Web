// Cloudflare Worker that sits in front of the real site (on a Route) and shows the
// "origin is down" page when the server stops answering. When the origin is healthy
// every request passes straight through untouched.
//
// Minimal local types so the Worker needs no extra dependency; the root tsconfig excludes ./worker.

interface Fetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface Env {
  /** The static export in ./out (see "assets" in wrangler.jsonc). */
  ASSETS: Fetcher;
}

/** Shown when the origin gave no response at all (connection refused, timeout, ...). */
const DEFAULT_CODE = 521;

/** Statuses that mean "the server behind this domain is down" rather than "the app returned an error". */
function isDown(status: number): boolean {
  return status === 502 || status === 503 || status === 504 || (status >= 520 && status <= 526);
}

const DOWN_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Retry-After": "120",
  "X-Robots-Tag": "noindex",
};

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let code = DEFAULT_CODE;

    // *.workers.dev has no origin behind it, so it always previews the down page.
    if (!url.hostname.endsWith(".workers.dev")) {
      try {
        const origin = await fetch(request);
        if (!isDown(origin.status)) return origin;
        code = origin.status;
      } catch {
        // No response at all: treat the origin as down.
      }
    }

    return downResponse(request, env, code);
  },
};

export default worker;

async function downResponse(request: Request, env: Env, code: number): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Service Unavailable", { status: 503, headers: { ...DOWN_HEADERS, "Content-Type": "text/plain" } });
  }

  const { pathname } = new URL(request.url);
  const isRoot = pathname === "/" || pathname === "/index.html";
  const asset = await env.ASSETS.fetch(request);

  // Scripts, styles, images, links.json and secondary pages such as /links are served as they are.
  // That also covers redirects and conditional-request replies (anything below 400).
  if (asset.status < 400 && !isRoot) return asset;

  // Anything else is someone visiting the site, which is down: serve the error page with a 5xx
  // so uptime monitors and search engines see an outage instead of a normal page.
  const html = (await asset.text()).replace("<head>", `<head><meta name="error-code" content="${code}">`);
  return new Response(request.method === "HEAD" ? null : html, { status: 503, headers: DOWN_HEADERS });
}
