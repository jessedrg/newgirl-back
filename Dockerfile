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

# Start the application using npx to ensure nest CLI is found
CMD ["npx", "nest", "start", "--watch"]
