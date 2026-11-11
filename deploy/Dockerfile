# The storefront: one Node process serving every store's website from main's /channel/v1.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 OUTBOX_PATH=/app/data/outbox.db
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
# The order outbox (DURABILITY-PLAN.md) lives in /app/data: mount a volume there so orders main
# hasn't answered yet survive a restart or a new image.
RUN mkdir -p /app/data && chown node:node /app/data
VOLUME /app/data
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "build"]
