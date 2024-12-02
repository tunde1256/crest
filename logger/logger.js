const winston = require('winston')

// Create a Winston logger instance
const logger = winston.createLogger({
    level: 'info', // Default log level
    format: winston.format.combine(
        winston.format.timestamp(), // Add a timestamp
        winston.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        // Log to a file
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }), // Only 'error' logs
        new winston.transports.File({ filename: 'logs/combined.log' }) // All logs
    ]
});

// Add a console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(), // Add colors for console output
            winston.format.simple()   // Simplified output for console
        )
    }));
}

// Export the logger instance
module.exports = logger;
