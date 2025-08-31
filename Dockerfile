# ---------- BUILD (dev deps + compile) ----------
  FROM node:20-alpine AS build
  WORKDIR /app
  
  # Toolchain for native deps (only in build)
  RUN apk add --no-cache python3 make g++
  
  # (Optional but recommended) newer npm to dodge CI bugs
  RUN npm i -g npm@11.5.2
  
  # Install with dev deps using lockfile
  COPY package.json package-lock.json ./
  RUN npm ci --no-audit --no-fund
  
  # Copy sources and build (use your existing script, e.g. "nest build")
  COPY . .
  RUN npm run build
  
  # Prune to production deps IN PLACE (no second install later)
  RUN npm prune --omit=dev \
   && npm cache clean --force
  
  # ---------- RUNTIME (no npm install here) ----------
  FROM node:20-alpine AS runner
  WORKDIR /app
  
  # Lightweight init for clean signals
  RUN apk add --no-cache dumb-init
  
  ENV NODE_ENV=production
  ENV PORT=3000
  
  # Only what's needed to run:
  COPY --from=build /app/package.json ./package.json
  COPY --from=build /app/node_modules ./node_modules
  COPY --from=build /app/dist ./dist
  
  # Drop privileges (node user exists in Node images)
  USER node
  
  EXPOSE 3000
  HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "process.exit(0)"
  
  ENTRYPOINT ["dumb-init","--"]
  CMD ["node","dist/main.js"]
  