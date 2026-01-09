const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const {
  crearVisita,
  obtenerVisitas,
  obtenerVisitaPorId,
  obtenerMisVisitas,
  obtenerVisitasPorEmpresa,
  obtenerVisitasPorCliente,
  obtenerVisitasPorEstado,
  obtenerVisitasPorMotivo,
  obtenerVisitasPorFecha,
  actualizarVisita,
  aceptarVisita,
  rechazarVisita,
  solicitarReprogramacion,
  eliminarVisita
} = require('../controllers/visitaController');

// Rutas protegidas (usuario autenticado)
router.get('/mis-visitas', authMiddleware, obtenerMisVisitas); // Mis visitas
router.get('/visitas/:id', authMiddleware, obtenerVisitaPorId); // Ver detalle (usuario asignado o admin)
router.put('/visitas/:id/aceptar', authMiddleware, aceptarVisita); // Aceptar visita
router.put('/visitas/:id/rechazar', authMiddleware, rechazarVisita); // Rechazar visita
router.put('/visitas/:id/reprogramar', authMiddleware, solicitarReprogramacion); // Solicitar reprogramación

// Rutas de administrador (requieren autenticación de admin)
router.post('/admin/visitas', adminMiddleware, crearVisita); // Crear visita
router.get('/admin/visitas', adminMiddleware, obtenerVisitas); // Listar todas
router.get('/admin/visitas/empresa/:empresa_id', adminMiddleware, obtenerVisitasPorEmpresa); // Por empresa
router.get('/visitas-por-cliente/:cliente_id', adminMiddleware, obtenerVisitasPorCliente); // Por cliente/usuario
router.get('/admin/visitas/estado/:estado', adminMiddleware, obtenerVisitasPorEstado); // Por estado
router.get('/admin/visitas/motivo/:motivo', adminMiddleware, obtenerVisitasPorMotivo); // Por motivo
router.get('/admin/visitas/fecha/:fecha', adminMiddleware, obtenerVisitasPorFecha); // Por fecha
router.put('/admin/visitas/:id', adminMiddleware, actualizarVisita); // Actualizar visita
router.delete('/admin/visitas/:id', adminMiddleware, eliminarVisita); // Eliminar visita

module.exports = router;








