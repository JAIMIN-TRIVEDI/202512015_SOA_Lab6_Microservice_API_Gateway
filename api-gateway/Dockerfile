# Official Node.js 20 LTS Alpine base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package descriptors first for layer caching
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose API Gateway Port (Default 8080)
EXPOSE 8080

# Default environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV USER_SERVICE_URL=http://user-service:3001
ENV PRODUCT_SERVICE_URL=http://product-service:3002
ENV ORDER_SERVICE_URL=http://order-service:3003

# Start API Gateway
CMD ["npm", "start"]
