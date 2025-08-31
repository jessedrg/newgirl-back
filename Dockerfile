# Use Node.js 20 LTS (latest LTS for better compatibility)
FROM node:20-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Configure npm to ignore engine warnings and install dependencies
RUN npm config set engine-strict false && \
    npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npx nest build

# Remove dev dependencies after build to reduce image size
RUN npm prune --production

# Expose port (use default NestJS port)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "run", "start:prod"]
