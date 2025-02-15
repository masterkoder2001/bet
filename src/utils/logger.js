const winston = require('winston');
const config = require('../config');

// Skapa anpassat format för bättre läsbarhet
const customFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(metadata).length > 0) {
            msg += `\nMetadata: ${JSON.stringify(metadata, null, 2)}`;
        }
        if (stack) {
            msg += `\nStack: ${stack}`;
        }
        return msg;
    })
);

const logger = winston.createLogger({
    level: config.LOG_LEVEL || 'info',
    format: customFormat,
    transports: [
        new winston.transports.File({ 
            filename: 'error.log', 
            level: 'error',
            handleExceptions: true,
            handleRejections: true,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({ 
            filename: 'combined.log',
            handleExceptions: true,
            handleRejections: true,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
            handleExceptions: true,
            handleRejections: true
        })
    ],
    exitOnError: false
});

// Lägg till en metod för att logga strukturerad data
logger.logData = (level, message, data) => {
    logger.log(level, message, { data });
};

module.exports = logger;