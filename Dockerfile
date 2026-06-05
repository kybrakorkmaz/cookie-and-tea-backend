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
EXPOSE 8000
CMD ["npm", "run", "dev"]

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
CMD node src/server/healthgallery.route.js

CMD ["npm", "start"]