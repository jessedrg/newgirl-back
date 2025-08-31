# ---------- BUILD ----------
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++

# Update npm to latest version
RUN npm install -g npm@11.5.2

# Copy package files
COPY package.json package-lock.json ./

# Clean install with fallback to regular install
RUN npm ci --no-audit --no-fund || (rm -rf node_modules package-lock.json && npm install --no-audit --no-fund)

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Clean up dev dependencies
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
  