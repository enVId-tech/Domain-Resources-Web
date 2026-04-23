export default {
  async fetch(request: any, env: any) {
    const url = new URL(request.url);

    if (url.pathname.includes('.') || url.pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(request);
    }

    let statusCode = 200;
    let diagnostic = 'nominal';

    try {
      const check = await fetch("https://etran.dev/ping", {
        method: "GET",
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(1500)
      });

      statusCode = check.status;
      
      if (!check.ok) {
        diagnostic = 'service_issue';
      }
    } catch (e: any) {
      statusCode = e.name === 'TimeoutError' ? 504 : 503; 
      diagnostic = 'connection_failure';
    }

    if (url.pathname === '/api/health-check') {
      return new Response(JSON.stringify({
        status: statusCode === 200 ? 'online' : 'degraded',
        code: statusCode, 
        diagnostic: diagnostic,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }

    const response = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
    const modded = new Response(response.body, response);
    modded.headers.set("x-lab-status-code", statusCode.toString());
    return modded;
  }
};