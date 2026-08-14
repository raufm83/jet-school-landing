# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL and build dependencies for Prisma
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    libc6-compat \
    ca-certificates \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    openssl \
    libc6-compat \
    ca-certificates

# Copy package files
COPY package*.json ./

# Install production dependencies only with build tools temporarily
RUN apk add --no-cache --virtual .gyp python3 make g++ && \
    npm ci --only=production && \
    apk del .gyp

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Generate Prisma client in production
RUN npx prisma generate

# Konteynerdə API_PORT/PORT (default 3002) — compose: "3001:3002"
EXPOSE 3002

# npm run start:prod cross-env istifadə edir; production image-də yalnız
# `npm ci --only=production` olduğu üçün cross-env yoxdur — birbaşa node işlədirik.
ENV NODE_ENV=production
CMD ["node", "dist/main"]