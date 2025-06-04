import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

const createLogger = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
  ];

  // Add file transport in production
  if (nodeEnv === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
      })
    );
  }

  return winston.createLogger({
    level: nodeEnv === 'development' ? 'debug' : 'info',
    format: logFormat,
    transports,
    // Don't exit on handled exceptions
    exitOnError: false,
  });
};

export const logger = createLogger();

export default logger;
