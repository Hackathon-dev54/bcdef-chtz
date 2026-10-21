# Multi-Stage Universal Dockerfile for Chatze Sovereign Node
# Deployable to DigitalOcean Droplets, Hetzner, Oracle Cloud Free Tier, or Coolify

# --- Stage 1: Build Frontend Assets ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build production bundle
COPY . .
RUN npm run build

# --- Stage 2: Production Server ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/server ./src/server

# Persistent SQLite Storage Volume
RUN mkdir -p /data && chown -R node:node /data
VOLUME ["/data"]

USER node
EXPOSE 3000

# Start production server using Node runtime
CMD ["npm", "run", "preview"]
