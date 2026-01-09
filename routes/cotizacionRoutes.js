const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const {
  crearCotizacion,
  solicitarCotizacion,
  obtenerCotizaciones,
  obtenerCotizacionPorId,
  obtenerCotizacionPorNumero,
  obtenerMisCotizaciones,
  obtenerCotizacionesPorEstado,
  aceptarCotizacion,
  rechazarCotizacion,
  eliminarCotizacion,
  obtenerSolicitudes,
  descargarPDF
} = require('../controllers/cotizacionController');

// Rutas públicas (sin autenticación)
router.post('/cotizaciones/solicitar', solicitarCotizacion); // Cualquiera puede solicitar cotización

// Rutas protegidas (requieren autenticación de usuario o admin)
router.get('/mis-cotizaciones', authMiddleware, obtenerMisCotizaciones); // Mis cotizaciones
router.put('/cotizaciones/:id/aceptar', authMiddleware, aceptarCotizacion); // Aceptar cotización
router.put('/cotizaciones/:id/rechazar', authMiddleware, rechazarCotizacion); // Rechazar cotización
router.get('/cotizaciones/:id/pdf', authMiddleware, descargarPDF); // Descargar PDF cotización

// Rutas de administrador (requieren autenticación de admin)
router.get('/cotizaciones', adminMiddleware, obtenerCotizaciones); // Listar todas (solo admin)
router.get('/cotizaciones/numero/:numero', adminMiddleware, obtenerCotizacionPorNumero); // Ver por número (solo admin)
router.get('/cotizaciones/estado/:estado', adminMiddleware, obtenerCotizacionesPorEstado); // Filtrar por estado (solo admin)
router.post('/admin/cotizaciones', adminMiddleware, crearCotizacion); // Crear cotización
router.delete('/admin/cotizaciones/:id', adminMiddleware, eliminarCotizacion); // Eliminar cotización
router.get('/admin/solicitudes-cotizacion', adminMiddleware, obtenerSolicitudes); // Ver solicitudes

// Ruta especial: Ver detalle de cotización (usuario propietario o admin)
// Esta va al final para que no interfiera con /cotizaciones/numero/:numero y /cotizaciones/estado/:estado
router.get('/cotizaciones/:id', authMiddleware, obtenerCotizacionPorId); // Ver detalle (usuario asignado o admin)

module.exports = router;

