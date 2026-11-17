
# Use Node.js 22 as the base image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy the remaining application files
COPY . .

# Tell Docker which port the application uses
EXPOSE 5000

# Start the backend application
CMD ["npm", "start"]
