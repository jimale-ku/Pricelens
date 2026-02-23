# Production Dockerfile for PriceLens Backend (default for Render)
FROM node:20-alpine AS base

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Suppress npm deprecation warnings so CI (e.g. Render) doesn't treat them as failures
ENV npm_config_loglevel=error

# Install all deps (build needs devDependencies); skip postinstall
RUN npm ci --legacy-peer-deps --ignore-scripts && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma Client and build (needs more heap)
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npx prisma generate && npm run build

# Production stage
FROM node:20-alpine AS production

# openssl for Prisma; build deps for bcrypt native module (removed after install)
RUN apk add --no-cache openssl && \
    apk add --no-cache --virtual .build-deps python3 make g++

WORKDIR /usr/src/app

# Copy package files, lockfile, built output, and prisma
COPY --from=base /usr/src/app/package*.json ./
COPY --from=base /usr/src/app/package-lock.json ./
COPY --from=base /usr/src/app/dist ./dist
COPY --from=base /usr/src/app/prisma ./prisma

# Copy scripts so postinstall (patch-nest-treekill.js) can run; script no-ops on Linux, needed so npm ci doesn't fail
COPY --from=base /usr/src/app/scripts ./scripts
# Production deps; allow scripts so bcrypt can compile its native binding, then remove build deps
RUN npm ci --legacy-peer-deps --only=production && npm cache clean --force && \
    apk del .build-deps
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /usr/src/app

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application (Nest outputs to dist/src/main.js)
CMD ["node", "dist/src/main.js"]
