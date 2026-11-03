import Joi from 'joi';
import { openRequestSchema } from '../../utils/request-schema.util';

export const loginSchema = openRequestSchema({
  emailAddress: Joi.string().trim().email().optional().messages({
    'string.email': 'Email Address must be a valid email address',
    'string.empty': 'Email Address is required',
  }),
  email: Joi.string().trim().email().optional(),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password is required',
  }),
})
  .or('emailAddress', 'email')
  .messages({
    'object.missing': 'Email Address is required',
  })
  .custom((value, helpers) => {
    if (!value.emailAddress && value.email) {
      value.emailAddress = value.email;
    }
    return value;
  });
