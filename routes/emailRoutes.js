const express = require('express');
const router = express.Router();
const { verificarConexionIMAP, obtenerCorreosEndpoint, obtenerCorreosNoLeidosEndpoint, marcarComoLeidoEndpoint, eliminarCorreoEndpoint } = require('../controllers/emailController');
const { adminMiddleware } = require('../middleware/adminMiddleware');

// Todas las rutas requieren autenticación de administrador
router.get('/verificar', adminMiddleware, verificarConexionIMAP);
router.get('/correos', adminMiddleware, obtenerCorreosEndpoint);
router.get('/correos/no-leidos', adminMiddleware, obtenerCorreosNoLeidosEndpoint);
router.post('/correos/:uid/marcar-leido', adminMiddleware, marcarComoLeidoEndpoint);
router.delete('/correos/:uid', adminMiddleware, eliminarCorreoEndpoint);

module.exports = router;
