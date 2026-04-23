export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.includes('.') || url.pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(request);
    }

    try {
        // literally just ping anything on the domain
      const heartbeat = await fetch("https://etran.dev/heartbeat.txt", { 
        method: "HEAD", 
        signal: AbortSignal.timeout(2000) 
      });

      if (!heartbeat.ok) throw new Error("Lab Offline");

      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));

    } catch (e) {
        // create an offline.html page later
      return env.ASSETS.fetch(new Request(new URL('/offline.html', request.url)));
    }
  }
};