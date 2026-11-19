# ---- build: compile the Next.js app to static files in /app/out ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- run: tiny dependency-free server for the static output ----
FROM node:22-alpine
WORKDIR /app
COPY server.js ./
COPY --from=build /app/out ./out

ENV PORT=3090
EXPOSE 3090
USER node

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:${PORT}/ || exit 1

CMD ["node", "server.js"]
