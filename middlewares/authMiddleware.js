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

function requireAuthForConsultation(req, res, next) {
  if (req.currentUser) {
    return next();
  }

  const fallbackPath = req.originalUrl && req.originalUrl.includes('/propiedades/')
    ? req.originalUrl.replace(/\/contacto$/, '')
    : '/contacto';
  const nextPath = encodeURIComponent(fallbackPath);
  return res.redirect(`/users/register?next=${nextPath}&required=consulta`);
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireAuthForConsultation
};
