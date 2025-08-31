# ---------- 1) BUILD ---------- #
FROM node:20-alpine AS build
WORKDIR /app

# Herramientas para compilar dependencias nativas si hiciera falta (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

# Sube npm para evitar bugs (p.ej. "Exit handler never called!")
RUN npm i -g npm@latest

# Instala deps según lockfile (incluye dev deps)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copia el código y compila (usa tu script de build)
COPY . .
# Asegúrate de tener "build": "tsc -p tsconfig.build.json" o similar en package.json
RUN npm run build

# ---------- 2) RUNTIME ---------- #
FROM node:20-alpine AS runner
WORKDIR /app

# init para señales limpias (opcional pero recomendado)
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
# App Platform inyecta $PORT; tu app debe leer process.env.PORT
ENV PORT=3000

# Copiamos solo lo necesario
COPY package.json package-lock.json ./

# Si hay deps nativas, instala toolchain solo durante la instalación y luego elimínalo
RUN apk add --no-cache --virtual .gyp python3 make g++ \
 && npm i -g npm@latest \
 && npm ci --omit=dev --no-audit --no-fund \
 && npm cache clean --force \
 && apk del .gyp

# Binarios compilados
COPY --from=build /app/dist ./dist

# Seguridad: usa el usuario "node" ya existente en la imagen oficial
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "process.exit(0)"

ENTRYPOINT ["dumb-init","--"]
CMD ["node","dist/main.js"]
