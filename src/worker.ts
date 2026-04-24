export default {
  async fetch(request: any, env: any) {
    const url = new URL(request.url);

    console.log(`[Worker] Incoming request: ${request.method} ${url.pathname}`);

    if (url.pathname.includes('.') || url.pathname.startsWith('/assets/')) {
      console.log(`[Worker] Serving static asset: ${url.pathname}`);
      return env.ASSETS.fetch(request);
    }

    let statusCode = 200;
    let diagnostic = 'nominal';
    let errorDetails = '';

    try {
      console.log(`[Worker] Performing health check...`);
      
      const check = await fetch("https://etran.dev/ping", {
        method: "GET",
        headers: { 'Cache-Control': 'no-cache' }
      } as any);

      statusCode = check.status;
      console.log(`[Worker] Health check fetch completed with status: ${statusCode}`);
      
      if (!check.ok) {
        diagnostic = 'service_issue';
        console.log(`[Worker] Status ${statusCode} is not OK, setting diagnostic to service_issue`);
      } else {
        console.log(`[Worker] Status ${statusCode} is OK`);
      }
    } catch (e: any) {
      const errorName = e?.name || 'Unknown';
      const errorMsg = e?.message || String(e);
      
      console.error(`[Worker] Health check failed!`);
      console.error(`[Worker] Error name: ${errorName}`);
      console.error(`[Worker] Error message: ${errorMsg}`);
      
      errorDetails = `${errorName}: ${errorMsg}`;
      statusCode = errorName === 'TimeoutError' ? 504 : 503; 
      diagnostic = 'connection_failure';
      
      console.log(`[Worker] Setting status to ${statusCode}, diagnostic to ${diagnostic}`);
    }

    if (url.pathname === '/api/health-check') {
      const response = {
        status: statusCode === 200 ? 'online' : 'degraded',
        code: statusCode, 
        diagnostic: diagnostic,
        timestamp: new Date().toISOString(),
        ...(errorDetails && { errorDetails })
      };
      console.log(`[Worker] Returning health check response:`, response);
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }

    console.log(`[Worker] Serving index.html for SPA routing`);
    
    // If status is 200, serve the requested page normally
    if (statusCode === 200) {
      console.log(`[Worker] Status is 200 (OK) - serving requested resource normally`);
      const response = await env.ASSETS.fetch(new Request(new URL(url.pathname, request.url)));
      return response;
    }
    
    // If status is not 200, serve the status page to show the error
    console.log(`[Worker] Status is ${statusCode} (NOT OK) - serving status page`);
    const response = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
    const modded = new Response(response.body, response);
    modded.headers.set("x-lab-status-code", statusCode.toString());
    return modded;
  }
};