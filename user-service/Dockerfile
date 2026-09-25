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

# Expose User Service Port
EXPOSE 3001

# Default environment variables
ENV NODE_ENV=production
ENV USER_SERVICE_PORT=3001
ENV MONGO_URI=mongodb://mongodb:27017/user_db

# Start microservice
CMD ["npm", "start"]
