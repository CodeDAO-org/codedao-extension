FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S twitter-bot -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY env.example ./

# Create logs directory and set permissions
RUN mkdir -p logs && chown -R twitter-bot:nodejs /app

# Switch to non-root user
USER twitter-bot

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "src/index.js"] 