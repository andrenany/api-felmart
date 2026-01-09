const {
  obtenerCorreos,
  obtenerCorreosNoLeidos,
  marcarComoLeido,
  eliminarCorreo,
  verificarIMAP
} = require('../config/email');

// Verificar conexión IMAP
const verificarConexionIMAP = async (req, res) => {
  try {
    const resultado = await verificarIMAP();
    
    if (resultado.success) {
      res.json({
        success: true,
        message: 'Conexión IMAP verificada correctamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al verificar conexión IMAP',
        error: resultado.error
      });
    }
  } catch (error) {
    console.error('Error al verificar IMAP:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar conexión IMAP',
      error: error.message
    });
  }
};

// Obtener correos
const obtenerCorreosEndpoint = async (req, res) => {
  try {
    const {
      carpeta = 'INBOX',
      cantidad = 10,
      noLeidos = false,
      desdeFecha = null,
      hastaFecha = null
    } = req.query;

    const opciones = {
      carpeta,
      cantidad: parseInt(cantidad),
      noLeidos: noLeidos === 'true',
      desdeFecha: desdeFecha || null,
      hastaFecha: hastaFecha || null
    };

    const resultado = await obtenerCorreos(opciones);

    if (resultado.success) {
      res.json({
        success: true,
        total: resultado.total,
        procesados: resultado.procesados,
        correos: resultado.correos
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al obtener correos',
        error: resultado.error
      });
    }
  } catch (error) {
    console.error('Error al obtener correos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener correos',
      error: error.message
    });
  }
};

// Obtener correos no leídos
const obtenerCorreosNoLeidosEndpoint = async (req, res) => {
  try {
    const cantidad = parseInt(req.query.cantidad) || 10;

    const resultado = await obtenerCorreosNoLeidos(cantidad);

    if (resultado.success) {
      res.json({
        success: true,
        total: resultado.total,
        procesados: resultado.procesados,
        correos: resultado.correos
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al obtener correos no leídos',
        error: resultado.error
      });
    }
  } catch (error) {
    console.error('Error al obtener correos no leídos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener correos no leídos',
      error: error.message
    });
  }
};

// Marcar correo como leído
const marcarComoLeidoEndpoint = async (req, res) => {
  try {
    const { uid } = req.params;
    const { carpeta = 'INBOX' } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'UID del correo es requerido'
      });
    }

    const resultado = await marcarComoLeido(parseInt(uid), carpeta);

    if (resultado.success) {
      res.json({
        success: true,
        message: 'Correo marcado como leído'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al marcar correo como leído',
        error: resultado.error
      });
    }
  } catch (error) {
    console.error('Error al marcar correo como leído:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar correo como leído',
      error: error.message
    });
  }
};

// Eliminar correo
const eliminarCorreoEndpoint = async (req, res) => {
  try {
    const { uid } = req.params;
    const { carpeta = 'INBOX' } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'UID del correo es requerido'
      });
    }

    const resultado = await eliminarCorreo(parseInt(uid), carpeta);

    if (resultado.success) {
      res.json({
        success: true,
        message: 'Correo eliminado exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar correo',
        error: resultado.error
      });
    }
  } catch (error) {
    console.error('Error al eliminar correo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar correo',
      error: error.message
    });
  }
};

module.exports = {
  verificarConexionIMAP,
  obtenerCorreosEndpoint,
  obtenerCorreosNoLeidosEndpoint,
  marcarComoLeidoEndpoint,
  eliminarCorreoEndpoint
};
