const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const upload = require('../config/upload');
const {
  crearCertificado,
  reenviarCertificado,
  obtenerCertificados,
  obtenerCertificadoPorId,
  descargarCertificado,
  obtenerMisCertificados,
  obtenerCertificadosPorEmpresa,
  obtenerCertificadosPorVisita,
  actualizarCertificado,
  eliminarCertificado
} = require('../controllers/certificadoController');

// Rutas protegidas (usuario autenticado)
router.get('/mis-certificados', authMiddleware, obtenerMisCertificados); // Mis certificados
router.get('/certificados/:id', authMiddleware, obtenerCertificadoPorId); // Ver detalle (usuario asignado o admin)
router.get('/certificados/:id/descargar', authMiddleware, descargarCertificado); // Descargar PDF

// Rutas de administrador (requieren autenticación de admin)
router.post('/admin/certificados', adminMiddleware, upload.single('archivo'), crearCertificado); // Crear y enviar certificado
router.post('/admin/certificados/:id/reenviar', adminMiddleware, reenviarCertificado); // Reenviar por email
router.get('/admin/certificados', adminMiddleware, obtenerCertificados); // Listar todos
router.get('/admin/certificados/empresa/:empresa_id', adminMiddleware, obtenerCertificadosPorEmpresa); // Por empresa
router.get('/admin/certificados/visita/:visita_id', adminMiddleware, obtenerCertificadosPorVisita); // Por visita
router.put('/admin/certificados/:id', adminMiddleware, actualizarCertificado); // Actualizar descripción
router.delete('/admin/certificados/:id', adminMiddleware, eliminarCertificado); // Eliminar certificado

module.exports = router;








