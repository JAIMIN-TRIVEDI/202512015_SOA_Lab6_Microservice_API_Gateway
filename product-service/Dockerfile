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

# Expose Product Service Port
EXPOSE 3002

# Default environment variables
ENV NODE_ENV=production
ENV PRODUCT_SERVICE_PORT=3002
ENV MONGO_URI=mongodb://mongodb:27017/product_db

# Start microservice
CMD ["npm", "start"]
