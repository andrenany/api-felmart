const express = require('express');
const router = express.Router();
const {
  obtenerNotificaciones,
  obtenerEstadisticas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  crearNotificacion,
  generarNotificacionesAutomaticas,
  limpiarNotificacionesExpiradas,
  obtenerNotificacionesCriticas,
  obtenerResumenLogin
} = require('../controllers/notificacionController');

const { adminMiddleware } = require('../middleware/adminMiddleware');

// ========== RUTAS DE NOTIFICACIONES (requieren autenticación admin) ==========

// Obtener resumen de notificaciones para login (endpoint principal)
router.get('/resumen-login', adminMiddleware, obtenerResumenLogin);

// Obtener todas las notificaciones del admin
router.get('/', adminMiddleware, obtenerNotificaciones);

// Obtener solo estadísticas
router.get('/estadisticas', adminMiddleware, obtenerEstadisticas);

// Obtener notificaciones críticas para dashboard
router.get('/criticas', adminMiddleware, obtenerNotificacionesCriticas);

// Marcar notificación como leída
router.put('/:id/leer', adminMiddleware, marcarComoLeida);

// Marcar todas las notificaciones como leídas
router.put('/marcar-todas-leidas', adminMiddleware, marcarTodasComoLeidas);

// Eliminar notificación
router.delete('/:id', adminMiddleware, eliminarNotificacion);

// Crear notificación manual
router.post('/', adminMiddleware, crearNotificacion);

// Generar notificaciones automáticas (para cron jobs o manual)
router.post('/generar-automaticas', adminMiddleware, generarNotificacionesAutomaticas);

// Limpiar notificaciones expiradas
router.delete('/limpiar-expiradas', adminMiddleware, limpiarNotificacionesExpiradas);

module.exports = router;
