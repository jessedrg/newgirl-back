# Use Node.js 20 LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install

# Build with local TypeScript compiler
RUN node_modules/.bin/tsc

# Remove dev dependencies
RUN npm prune --production

# Expose port
EXPOSE 3003

# Start the application
CMD ["node", "dist/main"]
