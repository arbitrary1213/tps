FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:22-slim AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN NODE_OPTIONS="--max-old-space-size=256" npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache wget
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=3 CMD wget -qO- http://localhost:3000 || exit 1
CMD ["node", "server.js"]
