FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Ensure permissions for the pptruser
RUN chown -R pptruser:pptruser /app

# Run as non-privileged user
USER pptruser

EXPOSE 5000
CMD ["npm", "start"]
