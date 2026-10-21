FROM node:18-alpine

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .


EXPOSE 80

# Start production server on port 80
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "80"]