FROM node:24-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/videoreview-build.db
RUN npx prisma generate && npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates gosu && rm -rf /var/lib/apt/lists/*
COPY --from=builder --chown=node:node /app /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV VIDEOREVIEW_AUTH_DIR=/var/data/auth
ENV VIDEOREVIEW_DATA_DIR=/var/data
ENV DATABASE_URL=file:/var/data/dev.db
EXPOSE 3000
CMD ["sh", "scripts/start-container.sh"]
