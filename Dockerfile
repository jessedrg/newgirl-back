# Use Node.js 20 LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy source code
COPY . .

# Build the application using npx to ensure CLI is available
RUN npx nest build

# Remove dev dependencies AFTER build
RUN npm prune --production

# Expose port
EXPOSE 3003

# Start the application
CMD ["node", "dist/main"]
