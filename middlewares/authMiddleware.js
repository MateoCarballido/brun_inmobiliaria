function requireAuth(req, res, next) {
  if (!req.currentUser) {
    return res.redirect('/users/login');
  }

  return next();
}

function requireAdmin(req, res, next) {
  if (!req.currentUser) {
    return res.redirect('/users/login');
  }

  if (req.currentUser.rol !== 'admin') {
    return res.status(403).render('error', {
      message: 'Acceso denegado. Solo administradores.',
      error: {}
    });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
