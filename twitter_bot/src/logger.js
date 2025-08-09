const winston = require('winston');
const config = require('./config');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'grey',
  debug: 'white',
  silly: 'grey'
};

winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define which transports to use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for error logs only
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for bot activity
  new winston.transports.File({
    filename: 'logs/bot-activity.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Create the logger
const logger = winston.createLogger({
  level: config.analytics.logLevel || 'info',
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Helper functions for specific bot activities
logger.botActivity = (action, details = {}) => {
  logger.info(`🤖 BOT ACTION: ${action}`, {
    action,
    details,
    timestamp: new Date().toISOString(),
    environment: config.bot.environment
  });
};

logger.twitterAPI = (endpoint, method, status = 'success', details = {}) => {
  const level = status === 'success' ? 'info' : 'error';
  logger[level](`🐦 TWITTER API: ${method} ${endpoint} - ${status}`, {
    endpoint,
    method,
    status,
    details,
    timestamp: new Date().toISOString()
  });
};

logger.engagement = (type, target, result = 'success', details = {}) => {
  logger.info(`👥 ENGAGEMENT: ${type} with ${target} - ${result}`, {
    engagement_type: type,
    target,
    result,
    details,
    timestamp: new Date().toISOString()
  });
};

logger.contentGeneration = (type, success = true, details = {}) => {
  const level = success ? 'info' : 'warn';
  logger[level](`📝 CONTENT: Generated ${type} - ${success ? 'success' : 'failed'}`, {
    content_type: type,
    success,
    details,
    timestamp: new Date().toISOString()
  });
};

logger.rateLimit = (action, count, limit, status = 'within_limits') => {
  const level = status === 'exceeded' ? 'warn' : 'info';
  logger[level](`⏱️ RATE LIMIT: ${action} - ${count}/${limit} - ${status}`, {
    action,
    count,
    limit,
    status,
    timestamp: new Date().toISOString()
  });
};

logger.analytics = (metric, value, period = 'current') => {
  logger.info(`📊 ANALYTICS: ${metric} = ${value} (${period})`, {
    metric,
    value,
    period,
    timestamp: new Date().toISOString()
  });
};

logger.safety = (check, status, details = {}) => {
  const level = status === 'passed' ? 'info' : 'warn';
  logger[level](`🛡️ SAFETY: ${check} - ${status}`, {
    safety_check: check,
    status,
    details,
    timestamp: new Date().toISOString()
  });
};

logger.performance = (operation, duration, success = true) => {
  logger.info(`⚡ PERFORMANCE: ${operation} completed in ${duration}ms - ${success ? 'success' : 'failed'}`, {
    operation,
    duration_ms: duration,
    success,
    timestamp: new Date().toISOString()
  });
};

logger.integration = (service, action, status, details = {}) => {
  const level = status === 'success' ? 'info' : 'error';
  logger[level](`🔗 INTEGRATION: ${service} ${action} - ${status}`, {
    service,
    action,
    status,
    details,
    timestamp: new Date().toISOString()
  });
};

// Error handling for logger itself
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Export the logger
module.exports = logger; 