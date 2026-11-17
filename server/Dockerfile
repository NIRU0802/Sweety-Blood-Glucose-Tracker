# Debian-based image: bcrypt's native binary installs without compiling
FROM node:20-slim

WORKDIR /app

# Copy package files first so Docker caches the install layer
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

# Create/update tables, then start the API
CMD ["sh", "-c", "npm run migrate && npm start"]