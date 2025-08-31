# ---------- BUILD ----------
  FROM node:20-alpine AS build
  WORKDIR /app
  
  # Toolchain para deps nativas
  RUN apk add --no-cache python3 make g++
  
  # Evita el bug de npm 10.x
  RUN npm i -g npm@11.5.2
  
  # Instala deps (incluye dev)
  COPY package.json package-lock.json ./
  RUN npm ci --no-audit --no-fund
  
  # Copia código y compila
  COPY . .
  # Tu package.json debe tener:  "build": "tsc -p tsconfig.build.json"  (o "nest build")
  RUN npm run build
  
  # ---------- RUNTIME ----------
  FROM node:20-alpine AS runner
  WORKDIR /app
  RUN apk add --no-cache dumb-init
  
  ENV NODE_ENV=production
  ENV PORT=3000
  
  # Evita el bug también aquí antes de instalar prod deps
  COPY package.json package-lock.json ./
  RUN apk add --no-cache --virtual .gyp python3 make g++ \
   && npm i -g npm@11.5.2 \
   && npm ci --omit=dev --no-audit --no-fund \
   && npm cache clean --force \
   && apk del .gyp
  
  # Solo el build final
  COPY --from=build /app/dist ./dist
  
  # Seguridad
  USER node
  
  EXPOSE 3000
  HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "process.exit(0)"
  
  ENTRYPOINT ["dumb-init","--"]
  CMD ["node","dist/main.js"]
  