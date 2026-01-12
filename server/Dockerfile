FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

FROM base AS dev
CMD ["npm", "run", "start:dev"]






