# Use Node.js LTS (Long Term Support) as base image
FROM node:lts-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose the API port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
