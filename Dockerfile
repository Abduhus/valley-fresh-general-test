# Use Node.js official image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install TypeScript globally
RUN npm install -g typescript

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start"]