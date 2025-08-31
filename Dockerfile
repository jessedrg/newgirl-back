# ---------- BUILD ----------
FROM node:20.16.0-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++

# Install TypeScript globally to ensure tsc is available
RUN npm install -g typescript@5.1.3

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with fallback
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev && npm cache clean --force
  
# ---------- RUNTIME ----------
FROM node:20.16.0-alpine AS runner
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
  