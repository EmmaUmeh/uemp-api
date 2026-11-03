import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import winston from 'winston';

mkdirSync(join(process.cwd(), 'logs'), { recursive: true });

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({
      filename: join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({ filename: join(process.cwd(), 'logs', 'combined.log') }),
  ],
});

export default logger;
