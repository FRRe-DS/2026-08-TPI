# -------------------------------------------------------------
# Stage 1: Compilación de TypeScript
# -------------------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
COPY openapi.yaml ./
COPY sql ./sql

RUN npm run build

# -------------------------------------------------------------
# Stage 2: Imagen de Producción liviana
# -------------------------------------------------------------
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8089

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/openapi.yaml ./
COPY --from=builder /app/sql ./sql

EXPOSE 8089

USER node

CMD ["node", "dist/index.js"]
