const express = require('express');
const router = express.Router();
const {
  crearSolicitudPublica,
  obtenerSolicitudes,
  obtenerSolicitudPorId,
  obtenerSolicitudPorNumero,
  asignarSolicitud,
  actualizarEstado,
  rechazarSolicitud,
  convertirACotizacion,
  actualizarSolicitud,
  eliminarSolicitud,
  obtenerEstadisticas
} = require('../controllers/solicitudCotizacionController');

const { adminMiddleware } = require('../middleware/adminMiddleware');

// ========== RUTAS PÚBLICAS (sin autenticación) ==========

// Crear solicitud de cotización (formulario público)
router.post('/solicitudes-cotizacion/publica', crearSolicitudPublica);

// Seguimiento de solicitud por número (público)
router.get('/solicitudes-cotizacion/seguimiento/:numero', obtenerSolicitudPorNumero);

// ========== RUTAS DE ADMINISTRACIÓN (requieren autenticación admin) ==========

// Obtener todas las solicitudes
router.get('/solicitudes-cotizacion', adminMiddleware, obtenerSolicitudes);

// Obtener solicitud por ID
router.get('/solicitudes-cotizacion/:id', adminMiddleware, obtenerSolicitudPorId);

// Obtener estadísticas
router.get('/solicitudes-cotizacion/admin/estadisticas', adminMiddleware, obtenerEstadisticas);

// Asignar solicitud a admin
router.post('/solicitudes-cotizacion/:id/asignar', adminMiddleware, asignarSolicitud);

// Actualizar estado de solicitud
router.put('/solicitudes-cotizacion/:id/estado', adminMiddleware, actualizarEstado);

// Rechazar solicitud
router.put('/solicitudes-cotizacion/:id/rechazar', adminMiddleware, rechazarSolicitud);

// Convertir solicitud a cotización
router.post('/solicitudes-cotizacion/:id/convertir-cotizacion', adminMiddleware, convertirACotizacion);

// Actualizar solicitud
router.put('/solicitudes-cotizacion/:id', adminMiddleware, actualizarSolicitud);

// Eliminar solicitud
router.delete('/solicitudes-cotizacion/:id', adminMiddleware, eliminarSolicitud);

module.exports = router;
