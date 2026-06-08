# ============================================
# Base
# ============================================
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ============================================
# Development
# ============================================

FROM base AS development
ENV NODE_ENV=development
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8003
CMD ["npm", "run", "dev"]

# ============================================
# Test Stage
# ============================================
FROM base AS test
ENV NODE_ENV=test
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8001
CMD ["npm", "run", "test"]

# ============================================
# Production
# ============================================
FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# Security
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
CMD node src/server/health.route.js

CMD ["npm", "start"]