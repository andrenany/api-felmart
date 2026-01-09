const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const adminMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Formato: "Bearer token"

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar si el usuario tiene rol de administrador
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador' });
    }

    req.admin = decoded; // Guardar info del admin en la request
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = { adminMiddleware };

