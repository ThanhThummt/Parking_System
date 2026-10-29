module.exports = function requireAuth(req, res, next) {
  if (req.session && req.session.user && req.session.user.id) {
    return next();
  }
  if (req.path && req.path.startsWith('/api')) {
    return res.status(401).json({ success: false, message: 'Unauthorized', data: {}, errors: [] });
  }
  return res.redirect('/login');
};
