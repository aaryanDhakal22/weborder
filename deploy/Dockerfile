# Example only. Build once, run anywhere Node 22+ runs.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
COPY --from=build /app/build ./build
COPY --from=build /app/fixtures ./fixtures
COPY --from=build /app/package.json ./
VOLUME /data
EXPOSE 3000
USER node
CMD ["node", "build"]
