const AppError = require('../utils/app-error');

module.exports = (err, req, res, next) => {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine status code
  const status = err.status || err.statusCode || 500;

  // Decide JSON vs HTML based on request path or Accept header
  const wantsJson = req.path && req.path.startsWith('/api') || (req.headers['accept'] && req.headers['accept'].includes('application/json'));

  if (wantsJson) {
    const response = {
      success: false,
      message: err.message || 'Internal Server Error',
      data: {},
      errors: err.errors || []
    };
    return res.status(status).json(response);
  }

  // Render an EJS error page (fallback to generic error view)
  const view = err.status === 404 ? 'errors/404' : err.status === 403 ? 'errors/403' : 'errors/500';
  return res.status(status).render(view, { message: err.message, error: err });
};
