class AppError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors; // array of {field, message, code}
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
