# CodeDAO Telegram Bot Dockerfile
# Multi-stage build for production deployment

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Create production build (if build script exists)
RUN npm run build 2>/dev/null || echo "No build script found, skipping..."

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S codedao -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code from builder stage
COPY --from=builder --chown=codedao:nodejs /app/bot.js ./
COPY --from=builder --chown=codedao:nodejs /app/src ./src/
COPY --from=builder --chown=codedao:nodejs /app/config ./config/
COPY --from=builder --chown=codedao:nodejs /app/contracts ./contracts/

# Create necessary directories
RUN mkdir -p logs && \
    chown -R codedao:nodejs logs

# Switch to non-root user
USER codedao

# Expose port (if using webhook mode)
EXPOSE 8443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8443/health', (res) => { \
        process.exit(res.statusCode === 200 ? 0 : 1) \
    }).on('error', () => process.exit(1))"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "bot.js"]

# Metadata
LABEL maintainer="CodeDAO Team <team@codedao.org>" \
      version="1.0.0" \
      description="CodeDAO Telegram Bot - Earn cryptocurrency for coding" \
      repository="https://github.com/CodeDAO-org/codedao-extension" 