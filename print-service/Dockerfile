FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache wget
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "index.js"]
