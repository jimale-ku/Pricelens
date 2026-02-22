# Development Dockerfile
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
# Suppress npm deprecation warnings so CI (e.g. Render) doesn't treat them as failures
ENV npm_config_loglevel=error
RUN npm install --legacy-peer-deps
COPY . .

FROM base AS dev
CMD ["npm", "run", "start:dev"]

# Production Dockerfile is in Dockerfile.production






