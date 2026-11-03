import type { RequestHandler } from 'express';
import type Joi from 'joi';
import HTTPException from '../utils/error.utils';
import { HTTPStatus } from '../utils/http.utils';

export function validateRequest(schema: Joi.ObjectSchema): RequestHandler {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      next(new HTTPException(HTTPStatus.BAD_REQUEST, message));
      return;
    }

    req.body = value;
    next();
  };
}
