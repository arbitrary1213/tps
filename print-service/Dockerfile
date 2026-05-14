FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache wget

COPY print-service/package*.json ./print-service/
WORKDIR /app/print-service
RUN npm install --omit=dev

COPY print-service/ ./
COPY frontend/public/print-api /app/frontend/public/print-api

EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "index.js"]
