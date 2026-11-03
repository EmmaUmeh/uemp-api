import Joi from 'joi';
import { openRequestSchema } from '../../utils/request-schema.util';

export const loginSchema = openRequestSchema({
  emailAddress: Joi.string().trim().email().required().messages({
    'any.required': 'Email Address is required',
    'string.email': 'Email Address must be a valid email address',
    'string.empty': 'Email Address is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password is required',
  }),
});
