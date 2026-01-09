const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Generar token JWT
const generateToken = (user, role = 'user') => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: role
    },
    JWT_SECRET,
    { expiresIn: '7d' } // El token expira en 7 días
  );
};

// Verificar token JWT
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
