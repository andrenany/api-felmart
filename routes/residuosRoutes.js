const express = require('express');
const router = express.Router();
const {
  createResiduo,
  getAllResiduos,
  getResiduoById,
  searchResiduos,
  updateResiduo,
  deleteResiduo
} = require('../controllers/ResiduosController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Rutas públicas (sin autenticación) - Solo lectura
router.get('/residuos', getAllResiduos);
router.get('/residuos/search', searchResiduos);
router.get('/residuos/:id', getResiduoById);

// Rutas protegidas (requieren autenticación) - Administradores
router.post('/residuos', authMiddleware, createResiduo);
router.put('/residuos/:id', authMiddleware, updateResiduo);
router.delete('/residuos/:id', authMiddleware, deleteResiduo);

// Rutas de admin (compatibilidad con frontend)
router.get('/admin/residuos', authMiddleware, getAllResiduos);
router.post('/admin/residuos/crear', authMiddleware, createResiduo);
router.post('/admin/residuos/editar/:id', authMiddleware, updateResiduo);
router.post('/admin/residuos/eliminar', authMiddleware, (req, res) => {
  // Extraer id del body para compatibilidad con frontend
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'ID es requerido' });
  }
  req.params.id = id;
  deleteResiduo(req, res);
});

module.exports = router;

