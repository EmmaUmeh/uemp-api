import Joi from 'joi';

export function openRequestSchema<T extends Joi.SchemaMap>(schema: T): Joi.ObjectSchema {
  return Joi.object(schema).unknown(true);
}
