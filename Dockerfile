# ── Etapa build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Copiar solo los manifiestos primero para cachear la capa de npm ci
# mientras no cambien las dependencias.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Etapa runtime ────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# 8080 en vez de 3000: evita chocar con el puerto que usa el dashboard
# de Dokploy en el host. El valor real lo controla la variable PORT.
ENV PORT=8080

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Solo el JS compilado — sin código fuente, sin devDependencies.
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/main"]
