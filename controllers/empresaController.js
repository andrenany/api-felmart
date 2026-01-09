const Empresa = require('../models/Empresa');

// Crear empresa (admin: aprobada inmediatamente | público: pendiente)
const createEmpresa = async (req, res) => {
  try {
    const { rut, nombre, giro, direccion, kilometraje, comuna_id, region_id, usuarios } = req.body;

    // Validar campos obligatorios
    if (!rut || !nombre) {
      return res.status(400).json({ message: 'RUT y nombre son requeridos' });
    }

    // Verificar si el RUT ya existe
    const existingEmpresa = await Empresa.findByRut(rut);
    if (existingEmpresa) {
      return res.status(400).json({ 
        message: 'El RUT ya está registrado',
        estado: existingEmpresa.estado
      });
    }

    // Determinar el estado según si es admin o usuario público
    // Si req.user existe (está autenticado como admin), crear como aprobada
    const estado = req.user ? 'aprobada' : 'pendiente';

    // Crear empresa
    const result = await Empresa.create({
      rut,
      nombre,
      giro,
      direccion,
      kilometraje,
      comuna_id,
      region_id,
      estado: estado,
      usuarios: usuarios || []
    });

    // Respuesta diferente según quién la crea
    if (req.user) {
      res.status(201).json({
        message: 'Empresa creada y aprobada exitosamente',
        empresaId: result.id,
        estado: 'aprobada'
      });
    } else {
      res.status(201).json({
        message: 'Solicitud de empresa enviada exitosamente. Pendiente de aprobación por administrador.',
        empresaId: result.id,
        estado: 'pendiente'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear solicitud de empresa', error: error.message });
  }
};

// Listar empresas pendientes (solo admin)
const getEmpresasPendientes = async (req, res) => {
  try {
    const empresas = await Empresa.findByEstado('pendiente');
    res.status(200).json(empresas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener empresas pendientes', error: error.message });
  }
};

// Aprobar empresa (solo admin)
const aprobarEmpresa = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la empresa existe
    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    if (empresa.estado !== 'pendiente') {
      return res.status(400).json({ 
        message: `La empresa ya está ${empresa.estado}`,
        estadoActual: empresa.estado
      });
    }

    // Aprobar empresa
    await Empresa.aprobar(id);

    res.status(200).json({ 
      message: 'Empresa aprobada exitosamente',
      empresaId: id,
      estado: 'aprobada'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al aprobar empresa', error: error.message });
  }
};

// Rechazar empresa (solo admin)
const rechazarEmpresa = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la empresa existe
    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    if (empresa.estado !== 'pendiente') {
      return res.status(400).json({ 
        message: `La empresa ya está ${empresa.estado}`,
        estadoActual: empresa.estado
      });
    }

    // Rechazar empresa
    await Empresa.rechazar(id);

    res.status(200).json({ 
      message: 'Empresa rechazada',
      empresaId: id,
      estado: 'rechazada'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al rechazar empresa', error: error.message });
  }
};

// Obtener todas las empresas
const getAllEmpresas = async (req, res) => {
  try {
    const empresas = await Empresa.findAll();
    res.status(200).json(empresas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener empresas', error: error.message });
  }
};

// Obtener una empresa por ID
const getEmpresaById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByIdWithUsuarios(id);

    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    res.status(200).json(empresa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener empresa', error: error.message });
  }
};

// Obtener empresa por RUT
const getEmpresaByRut = async (req, res) => {
  try {
    const { rut } = req.params;
    const empresa = await Empresa.findByRut(rut);

    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    res.status(200).json(empresa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener empresa', error: error.message });
  }
};

// Obtener empresas por región
const getEmpresasByRegion = async (req, res) => {
  try {
    const { region_id } = req.params;
    const empresas = await Empresa.findByRegion(region_id);
    res.status(200).json(empresas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener empresas', error: error.message });
  }
};

// Obtener empresas por comuna
const getEmpresasByComuna = async (req, res) => {
  try {
    const { comuna_id } = req.params;
    const empresas = await Empresa.findByComuna(comuna_id);
    res.status(200).json(empresas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener empresas', error: error.message });
  }
};

// Actualizar empresa
const updateEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const { rut, nombre, giro, direccion, kilometraje, comuna_id, region_id, usuarios } = req.body;

    // Verificar si la empresa existe
    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    // Si se está actualizando el RUT, verificar que no exista
    if (rut && rut !== empresa.rut) {
      const existingEmpresa = await Empresa.findByRut(rut);
      if (existingEmpresa) {
        return res.status(400).json({ message: 'El RUT ya está registrado' });
      }
    }

    // Actualizar empresa
    await Empresa.update(id, {
      rut,
      nombre,
      giro,
      direccion,
      kilometraje,
      comuna_id,
      region_id,
      usuarios
    });

    res.status(200).json({ message: 'Empresa actualizada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar empresa', error: error.message });
  }
};

// ========== ENDPOINTS PARA GESTIÓN DE USUARIOS ==========

// Agregar usuario a empresa
const agregarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ message: 'usuario_id es requerido' });
    }

    // Verificar si la empresa existe
    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    // Agregar usuario a la empresa
    await Empresa.agregarUsuario(id, usuario_id);

    res.status(200).json({ 
      message: 'Usuario agregado a la empresa exitosamente',
      empresaId: id,
      usuarioId: usuario_id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al agregar usuario a empresa', error: error.message });
  }
};

// Remover usuario de empresa
const removerUsuario = async (req, res) => {
  try {
    const { id, usuario_id } = req.params;

    // Validar que usuario_id esté presente y sea un número válido
    if (!usuario_id || isNaN(Number(usuario_id))) {
      return res.status(400).json({ message: 'usuario_id es requerido y debe ser un número válido' });
    }

    // Verificar si la empresa existe
    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    // Remover usuario de la empresa
    await Empresa.removerUsuario(id, usuario_id);

    res.status(200).json({ 
      message: 'Usuario removido de la empresa exitosamente',
      empresaId: id,
      usuarioId: usuario_id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al remover usuario de empresa', error: error.message });
  }
};

// Obtener usuarios de una empresa
const obtenerUsuarios = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la empresa existe
    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    // Obtener usuarios de la empresa
    const usuarios = await Empresa.obtenerUsuarios(id);

    // Transformar la respuesta para que coincida con UsuarioResumen
    const usuariosTransformados = usuarios.map(usuario => ({
      id: usuario.usuario_id,
      nombre: usuario.usuario_nombre,
      email: usuario.usuario_email,
      role: usuario.role || undefined
    }));

    res.status(200).json(usuariosTransformados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuarios de empresa', error: error.message });
  }
};

// Eliminar empresa
const deleteEmpresa = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la empresa existe
    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    // Eliminar empresa
    await Empresa.delete(id);

    res.status(200).json({ message: 'Empresa eliminada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar empresa', error: error.message });
  }
};

module.exports = {
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
};

