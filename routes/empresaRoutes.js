const express = require('express');
const router = express.Router();
const {
  createEmpresa,
  getAllEmpresas,
  getEmpresaById,
  getEmpresaByRut,
  getEmpresasByRegion,
  getEmpresasByComuna,
  getEmpresasPendientes,
  aprobarEmpresa,
  rechazarEmpresa,
  updateEmpresa,
  deleteEmpresa,
  agregarUsuario,
  removerUsuario,
  obtenerUsuarios
} = require('../controllers/empresaController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Rutas protegidas solo para admin
router.get('/empresas', authMiddleware, getAllEmpresas);

// Ruta de creación: permitida públicamente (queda pendiente) o por admin (aprobada inmediatamente)
// El middleware authMiddleware se aplica, pero si falla (público), el controlador lo detecta con req.user
router.post('/empresas', async (req, res, next) => {
  // Intentar autenticar, pero no fallar si no hay token
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      // Token inválido, continuar como usuario público
    }
  }
  next();
}, createEmpresa);
router.get('/empresas/pendientes', authMiddleware, getEmpresasPendientes);
router.get('/empresas/rut/:rut', authMiddleware, getEmpresaByRut);
router.get('/empresas/region/:region_id', authMiddleware, getEmpresasByRegion);
router.get('/empresas/comuna/:comuna_id', authMiddleware, getEmpresasByComuna);
router.get('/empresas/:id', authMiddleware, getEmpresaById);
router.put('/empresas/:id/aprobar', authMiddleware, aprobarEmpresa);
router.put('/empresas/:id/rechazar', authMiddleware, rechazarEmpresa);
router.put('/empresas/:id', authMiddleware, updateEmpresa);
router.delete('/empresas/:id', authMiddleware, deleteEmpresa);

// Rutas para gestión de usuarios en empresas (solo admin)
router.get('/empresas/:id/usuarios', authMiddleware, obtenerUsuarios);
router.post('/empresas/:id/usuarios', authMiddleware, agregarUsuario);
router.delete('/empresas/:id/usuarios/:usuario_id', authMiddleware, removerUsuario);

module.exports = router;

