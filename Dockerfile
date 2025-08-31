# ---------- BUILD ----------
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++

# Install Yarn for more reliable dependency management
RUN npm install -g yarn

# Copy package files
COPY package.json ./

# Install all dependencies with yarn (more reliable than npm)
RUN yarn install --production=false

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Install only production dependencies
RUN rm -rf node_modules
RUN yarn install --production=true
  
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
  