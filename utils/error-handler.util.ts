import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { MongoServerError } from 'mongodb';
import { HTTPStatus } from './http.utils';
import HTTPException from './error.utils';
import logger from './logger.utils';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HTTPException) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  if (error instanceof mongoose.Error.CastError) {
    res.status(HTTPStatus.BAD_REQUEST).json({ success: false, message: 'Invalid data format.' });
    return;
  }
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(HTTPStatus.BAD_REQUEST).json({ success: false, message: 'Validation failed.' });
    return;
  }
  if (error instanceof MongoServerError && error.code === 11000) {
    res.status(HTTPStatus.CONFLICT).json({
      success: false,
      message: 'A record with that value already exists.',
    });
    return;
  }

  logger.error('Unhandled request error', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  res.status(HTTPStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Something went wrong. Please try again.',
  });
};
