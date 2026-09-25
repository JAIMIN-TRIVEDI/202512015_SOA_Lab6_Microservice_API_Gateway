# Official Node.js 20 LTS Alpine base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose Order Service Port
EXPOSE 3003

# Default environment variables
ENV NODE_ENV=production
ENV ORDER_SERVICE_PORT=3003
ENV MONGO_URI=mongodb://mongodb:27017/order_db
ENV USER_SERVICE_URL=http://user-service:3001
ENV PRODUCT_SERVICE_URL=http://product-service:3002

# Start microservice
CMD ["npm", "start"]
