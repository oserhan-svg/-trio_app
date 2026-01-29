# Dockerfile for Backend Service
FROM node:18-alpine

# Install dependencies for Puppeteer (Stealth browser needs these on Linux)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    git

# Set Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Grant execute permissions to start.sh
RUN chmod +x ./start.sh

# Generate Prisma Client
RUN npx prisma generate

# Expose API port
EXPOSE 5000

# Start command: Run DB push in background and start Node server instantly
CMD sh -c "npx prisma db push --accept-data-loss & npm start"
