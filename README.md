# Domain Resources

Next.js (App Router, React, TypeScript, SCSS modules) compiled to **fully static files**. `next build` writes plain HTML/JS/CSS to `out/`, and that folder is all you deploy. No Node server, database or API is needed at runtime.

| Route | Output | What it is |
| --- | --- | --- |
| `/` | `out/index.html` | The "origin is down" error page: SYSTEM ERROR plus a Browser, Cloudflare and Host trace where the host fails |
| `/links` | `out/links.html` | Links directory, loaded from `/data/links.json` |
| `/error` | `out/error.html` | Alias of `/`, kept for existing links and proxy error-page settings |
| any missing path | `out/404.html` | Same error page (from `app/not-found.tsx`), served with a 404 status |
| `/?code=502` | | Same page for another status (400-599). The default is 521, "Web Server Is Down". Behind the Worker, the real origin status is used |

The page is meant to be what Cloudflare shows when your server is offline, so the first two trace stages pass and the host always fails. When the page really is served through Cloudflare, the Cloudflare stage also shows the edge location (read from `/cdn-cgi/trace`).

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in ./out
npm run lint
```

## Editing links

Edit `public/data/links.json`:

```json
[
  { "title": "GitHub", "url": "https://github.com/you", "description": "Source code", "icon": "🌐" }
]
```

- `icon` is optional: a character/emoji, or an image path/URL (`/icons/x.png`). Without one, the first letter of the title is used.
- `check: false` skips the online/offline check for that link.
- The file is fetched at runtime (not bundled), so it can change without rebuilding. In Docker, mount your own copy (below). On Cloudflare, edit it and redeploy.
- The online/offline dot only detects unreachable sites (DNS, connection or TLS failures, 7s timeout). A browser can't read another site's HTTP status, so a 404 or 500 still shows as online. Plain `http://` links on an `https://` page are blocked by the browser and show as offline.

## Docker

The Dockerfile builds the site in one stage and serves `out/` in a second stage with `server.js`, a dependency-free Node static server (no nginx). It returns `404.html` with a real 404 status for any miss and serves `/error`.

```bash
docker build -t domain-resources .
docker run -d --name domain-resources -p 3090:3090 domain-resources
```

Change links without rebuilding by mounting your own file over the built one:

```bash
docker run -d --name domain-resources -p 3090:3090 \
  -v /path/to/links.json:/app/out/data/links.json:ro \
  domain-resources
```

The container runs as the unprivileged `node` user, so the mounted file must be world-readable. Set `PORT` to change the port. To run the built site without Docker: `npm run build && npm start`.

## Cloudflare Workers: show this page when the domain is down

`worker/index.ts` is a small Worker that sits in front of your real site. For every request it asks your origin first:

- **Origin healthy:** the response passes straight through, untouched.
- **Origin down** (no response at all, or a 502, 503, 504 or 520-526 from Cloudflare's origin leg): it serves this error page with a real `503` and `Retry-After`, so monitors and search engines see an outage. The page shows the status the origin actually produced, such as `522`, and `521` when there was no response at all.
- **While it is down**, `/links` and the page's own scripts and styles still load, so the LINKS button works.
- Other app errors (404, 500, ...) pass through, because they mean the server is up. Edit `isDown()` to change what counts as down.

```bash
npm run build
npx wrangler login
npx wrangler deploy      # or: npm run deploy
```

With no routes configured this only deploys to `<name>.<account>.workers.dev`, which always previews the down page and touches no real traffic. To put it in front of your domain, uncomment `routes` in `wrangler.jsonc` and deploy again.

- **Use Routes, not a Custom Domain.** A Worker on a Custom Domain can't fetch its own hostname as the origin; Cloudflare returns a 522.
- The Worker now runs for every request on those routes (`run_worker_first`), so Workers request limits apply to that traffic. Consider each route's failure mode (fail open) so a problem with the Worker never takes the site down.
- It can only tell when the origin answers with a failure. A site that is up but broken, returning 200 with an error page, still passes through.
- The `ASSETS` binding serves `out/` with `not_found_handling: "404-page"`. With Cloudflare Workers Builds, set the build command to `npm run build` and the deploy command to `npx wrangler deploy`.
- On a Cloudflare paid plan, the dashboard's Custom Error Rules or Error Pages can also serve a page for 5xx errors without a Worker. They are not available on the Free plan, which is why the Worker is the default here.

## Notes

- `typescript` is pinned to `~6.0.3` because `typescript-eslint` (used by `eslint-config-next`) doesn't support TypeScript 7 yet, which breaks `npm run lint`. The build works on either.
- No external fonts or network assets: the page uses a system monospace stack, so builds work offline and the error page stays self-contained.
- Colors are CSS variables at the top of `styles/globals.scss`. The background rain and animations are disabled for `prefers-reduced-motion`.
