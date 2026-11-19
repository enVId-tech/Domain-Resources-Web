# Domain Resources

Next.js (App Router, React, TypeScript, SCSS modules) compiled to **fully static files**. `next build` writes plain HTML/JS/CSS to `out/`, and that folder is all you deploy. No Node server, database or API is needed at runtime.

| Route | Output | What it is |
| --- | --- | --- |
| `/` | `out/index.html` | Links directory, loaded from `/data/links.json` |
| any missing path | `out/404.html` | Error page, from `app/not-found.tsx` |
| `/error` | `out/error.html` | Same error page with a 200 status (for testing/linking) |
| `/404.html?code=502` | | Same page for another status (400-599) |

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

## Cloudflare Workers

```bash
npm run build
npx wrangler login
npx wrangler deploy      # or: npm run deploy
```

`wrangler.jsonc` serves `out/` as static assets with `not_found_handling: "404-page"`, so every unknown URL returns `404.html` with a 404 status. With Cloudflare Workers Builds, set the build command to `npm run build` and the deploy command to `npx wrangler deploy`.

## Notes

- `typescript` is pinned to `~6.0.3` because `typescript-eslint` (used by `eslint-config-next`) doesn't support TypeScript 7 yet, which breaks `npm run lint`. The build works on either.
- No external fonts or network assets: the page uses a system monospace stack, so builds work offline and the error page stays self-contained.
- Colors are CSS variables at the top of `styles/globals.scss`. The background rain and animations are disabled for `prefers-reduced-motion`.
