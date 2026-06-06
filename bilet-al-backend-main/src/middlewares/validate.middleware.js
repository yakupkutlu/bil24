import { ApiError } from '../utils/ApiError.js';

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) {
    return next(new ApiError(400, 'Validation error', result.error.flatten()));
  }
  req.body = result.data.body ?? req.body;
  req.query = result.data.query ?? req.query;
  req.params = result.data.params ?? req.params;
  return next();
};

export default validate;
