# Use Node.js 20 LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install

# Expose port
EXPOSE 3003

# Start the application directly with ts-node
CMD ["node_modules/.bin/ts-node", "src/main.ts"]
