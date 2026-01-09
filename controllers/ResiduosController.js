const Residuo = require('../models/Residuo');

// Crear un nuevo residuo
const createResiduo = async (req, res) => {
  try {
    const { descripcion, precio, unidad, moneda } = req.body;

    // Validar campos obligatorios
    if (!descripcion || !precio || !unidad) {
      return res.status(400).json({ message: 'Descripción, precio y unidad son requeridos' });
    }

    // Validar que el precio sea un número positivo
    if (precio <= 0) {
      return res.status(400).json({ message: 'El precio debe ser mayor a 0' });
    }

    // Validar que la unidad sea un valor permitido
    const unidadesPermitidas = ['IBC', 'UNIDAD', 'TONELADA', 'TAMBOR', 'KL', 'LT', 'M3'];
    if (!unidadesPermitidas.includes(unidad.toUpperCase())) {
      return res.status(400).json({ 
        message: `Unidad no válida. Valores permitidos: ${unidadesPermitidas.join(', ')}`,
        unidadRecibida: unidad
      });
    }

    // Crear residuo (normalizar unidad a mayúsculas)
    const result = await Residuo.create({
      descripcion,
      precio,
      unidad: unidad.toUpperCase(),
      moneda: moneda || 'CLP'
    });

    res.status(201).json({
      message: 'Residuo creado exitosamente',
      residuoId: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear residuo', error: error.message });
  }
};

// Obtener todos los residuos
const getAllResiduos = async (req, res) => {
  try {
    const residuos = await Residuo.findAll();
    res.status(200).json(residuos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener residuos', error: error.message });
  }
};

// Obtener un residuo por ID
const getResiduoById = async (req, res) => {
  try {
    const { id } = req.params;
    const residuo = await Residuo.findById(id);

    if (!residuo) {
      return res.status(404).json({ message: 'Residuo no encontrado' });
    }

    res.status(200).json(residuo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener residuo', error: error.message });
  }
};

// Buscar residuos por descripción
const searchResiduos = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Parámetro de búsqueda "q" es requerido' });
    }

    const residuos = await Residuo.findByDescripcion(q);
    res.status(200).json(residuos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al buscar residuos', error: error.message });
  }
};

// Actualizar residuo
const updateResiduo = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, precio, unidad, moneda } = req.body;

    // Verificar si el residuo existe
    const residuo = await Residuo.findById(id);
    if (!residuo) {
      return res.status(404).json({ message: 'Residuo no encontrado' });
    }

    // Validar campos obligatorios
    if (!descripcion || !precio || !unidad) {
      return res.status(400).json({ message: 'Descripción, precio y unidad son requeridos' });
    }

    // Validar que el precio sea un número positivo
    if (precio <= 0) {
      return res.status(400).json({ message: 'El precio debe ser mayor a 0' });
    }

    // Validar que la unidad sea un valor permitido
    const unidadesPermitidas = ['IBC', 'UNIDAD', 'TONELADA', 'TAMBOR', 'KL', 'LT', 'M3'];
    if (!unidadesPermitidas.includes(unidad.toUpperCase())) {
      return res.status(400).json({ 
        message: `Unidad no válida. Valores permitidos: ${unidadesPermitidas.join(', ')}`,
        unidadRecibida: unidad
      });
    }

    // Actualizar residuo (normalizar unidad a mayúsculas)
    await Residuo.update(id, {
      descripcion,
      precio,
      unidad: unidad.toUpperCase(),
      moneda: moneda || residuo.moneda || 'CLP'
    });

    res.status(200).json({ message: 'Residuo actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar residuo', error: error.message });
  }
};

// Eliminar residuo
const deleteResiduo = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el residuo existe
    const residuo = await Residuo.findById(id);
    if (!residuo) {
      return res.status(404).json({ message: 'Residuo no encontrado' });
    }

    // Eliminar residuo
    await Residuo.delete(id);

    res.status(200).json({ message: 'Residuo eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar residuo', error: error.message });
  }
};

module.exports = {
  createResiduo,
  getAllResiduos,
  getResiduoById,
  searchResiduos,
  updateResiduo,
  deleteResiduo
};

