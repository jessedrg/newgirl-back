# Use Node.js 20 LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3003

# Expose port (matching the PORT env var)
EXPOSE 3003

# Start the application directly with ts-node and error handling
CMD ["sh", "-c", "node_modules/.bin/ts-node src/main.ts || (echo 'Application failed to start' && exit 1)"]
