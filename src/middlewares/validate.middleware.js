const { validationResult } = require('express-validator');
const AppError = require('../utils/app-error');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Transform to the envelope error format
    const formatted = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      code: err.msg // simple code, could be refined
    }));
    return next(new AppError('Validation failed', 400, formatted));
  }
  next();
};
