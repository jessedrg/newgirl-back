# ---------- BUILD ----------
  FROM node:20-alpine AS build
  WORKDIR /app
  RUN apk add --no-cache python3 make g++
  RUN npm i -g npm@11.5.2
  COPY package.json package-lock.json ./
  RUN npm ci --no-audit --no-fund
  COPY . .
  RUN npm run build
  RUN npm prune --omit=dev && npm cache clean --force
  
  # ---------- RUNTIME ----------
  FROM node:20-alpine AS runner
  WORKDIR /app
  RUN apk add --no-cache dumb-init
  ENV NODE_ENV=production
  ENV PORT=3000
  COPY --from=build /app/package.json ./package.json
  COPY --from=build /app/node_modules ./node_modules
  COPY --from=build /app/dist ./dist
  USER node
  EXPOSE 3000
  ENTRYPOINT ["dumb-init","--"]
  CMD ["node","dist/main.js"]
  