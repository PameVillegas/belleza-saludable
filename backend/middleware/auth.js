// Middleware de autenticación simple
// Verifica que el header x-admin-username esté presente
function authMiddleware(req, res, next) {
  const username = req.headers['x-admin-username'];
  if (!username) {
    return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión.' });
  }
  req.adminUsername = username;
  next();
}

module.exports = authMiddleware;
