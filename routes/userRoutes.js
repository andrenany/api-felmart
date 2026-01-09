const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyResetToken
} = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Rutas públicas (sin autenticación)
router.post('/register', register);
router.post('/login', login);

// Recuperación de contraseña (públicas)
router.post('/password-reset/request', requestPasswordReset);
router.get('/password-reset/verify/:token', verifyResetToken);
router.post('/password-reset/:token', resetPassword);

// Rutas protegidas (requieren autenticación)
router.get('/users', authMiddleware, getAllUsers);
router.get('/users/:id', authMiddleware, getUserById);
router.put('/users/:id', authMiddleware, updateUser);
router.delete('/users/:id', authMiddleware, deleteUser);

// Cambio de contraseña (protegida)
router.put('/change-password/:id', authMiddleware, changePassword);

module.exports = router;

