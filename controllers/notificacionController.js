const Notificacion = require('../models/Notificacion');

// Obtener notificaciones del admin logueado
const obtenerNotificaciones = async (req, res) => {
  try {
    const { 
      solo_no_leidas = false, 
      limite = 50, 
      tipo = null,
      prioridad = null 
    } = req.query;

    const admin_id = req.user.id;
    
    const notificaciones = await Notificacion.findByAdmin(admin_id, {
      solo_no_leidas: solo_no_leidas === 'true',
      limite: parseInt(limite),
      tipo,
      prioridad
    });

    // Obtener estadísticas
    const estadisticas = await Notificacion.getEstadisticas(admin_id);

    res.status(200).json({
      notificaciones,
      estadisticas,
      total: notificaciones.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
};

// Obtener solo estadísticas de notificaciones
const obtenerEstadisticas = async (req, res) => {
  try {
    const admin_id = req.user.id;
    const estadisticas = await Notificacion.getEstadisticas(admin_id);

    res.status(200).json(estadisticas);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// Marcar notificación como leída
const marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const admin_id = req.user.id;

    const result = await Notificacion.marcarComoLeida(id, admin_id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Notificación no encontrada o no tienes permisos'
      });
    }

    res.status(200).json({
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al marcar notificación como leída',
      error: error.message
    });
  }
};

// Marcar todas las notificaciones como leídas
const marcarTodasComoLeidas = async (req, res) => {
  try {
    const admin_id = req.user.id;
    
    const result = await Notificacion.marcarTodasComoLeidas(admin_id);

    res.status(200).json({
      message: 'Todas las notificaciones marcadas como leídas',
      notificaciones_actualizadas: result.affectedRows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al marcar notificaciones como leídas',
      error: error.message
    });
  }
};

// Eliminar notificación
const eliminarNotificacion = async (req, res) => {
  try {
    const { id } = req.params;
    const admin_id = req.user.id;

    const result = await Notificacion.delete(id, admin_id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Notificación no encontrada o no tienes permisos'
      });
    }

    res.status(200).json({
      message: 'Notificación eliminada exitosamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al eliminar notificación',
      error: error.message
    });
  }
};

// Crear notificación manual
const crearNotificacion = async (req, res) => {
  try {
    const { 
      admin_id, 
      tipo, 
      titulo, 
      mensaje, 
      datos_adicionales, 
      prioridad = 'media',
      fecha_expiracion 
    } = req.body;

    // Validaciones
    if (!tipo || !titulo || !mensaje) {
      return res.status(400).json({
        message: 'Tipo, título y mensaje son requeridos'
      });
    }

    const tiposValidos = ['solicitud_pendiente', 'visita_proxima', 'empresa_pendiente', 'cotizacion_vencida', 'sistema'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        message: 'Tipo de notificación no válido'
      });
    }

    const prioridadesValidas = ['baja', 'media', 'alta', 'critica'];
    if (!prioridadesValidas.includes(prioridad)) {
      return res.status(400).json({
        message: 'Prioridad no válida'
      });
    }

    const notificacionData = {
      admin_id: admin_id || req.user.id,
      tipo,
      titulo,
      mensaje,
      datos_adicionales,
      prioridad,
      fecha_expiracion
    };

    const result = await Notificacion.create(notificacionData);

    res.status(201).json({
      message: 'Notificación creada exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al crear notificación',
      error: error.message
    });
  }
};

// Generar notificaciones automáticas
const generarNotificacionesAutomaticas = async (req, res) => {
  try {
    const resultado = await Notificacion.generarNotificacionesAutomaticas();

    res.status(200).json({
      message: 'Notificaciones automáticas generadas exitosamente',
      resultado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al generar notificaciones automáticas',
      error: error.message
    });
  }
};

// Limpiar notificaciones expiradas
const limpiarNotificacionesExpiradas = async (req, res) => {
  try {
    const result = await Notificacion.eliminarExpiradas();

    res.status(200).json({
      message: 'Notificaciones expiradas eliminadas exitosamente',
      notificaciones_eliminadas: result.affectedRows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al limpiar notificaciones expiradas',
      error: error.message
    });
  }
};

// Obtener notificaciones críticas (para dashboard)
const obtenerNotificacionesCriticas = async (req, res) => {
  try {
    const admin_id = req.user.id;
    
    const notificacionesCriticas = await Notificacion.findByAdmin(admin_id, {
      solo_no_leidas: true,
      prioridad: 'critica',
      limite: 10
    });

    const notificacionesAltas = await Notificacion.findByAdmin(admin_id, {
      solo_no_leidas: true,
      prioridad: 'alta',
      limite: 5
    });

    res.status(200).json({
      criticas: notificacionesCriticas,
      altas: notificacionesAltas,
      total_criticas: notificacionesCriticas.length,
      total_altas: notificacionesAltas.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al obtener notificaciones críticas',
      error: error.message
    });
  }
};

// Obtener resumen de notificaciones para login
const obtenerResumenLogin = async (req, res) => {
  try {
    const admin_id = req.user.id;
    
    // Generar notificaciones automáticas primero
    await Notificacion.generarNotificacionesAutomaticas();
    
    // Obtener estadísticas
    const estadisticas = await Notificacion.getEstadisticas(admin_id);
    
    // Obtener notificaciones críticas y altas
    const criticas = await Notificacion.findByAdmin(admin_id, {
      solo_no_leidas: true,
      prioridad: 'critica',
      limite: 5
    });

    const altas = await Notificacion.findByAdmin(admin_id, {
      solo_no_leidas: true,
      prioridad: 'alta',
      limite: 5
    });

    // Obtener últimas notificaciones
    const ultimas = await Notificacion.findByAdmin(admin_id, {
      solo_no_leidas: true,
      limite: 10
    });

    res.status(200).json({
      estadisticas,
      criticas,
      altas,
      ultimas,
      resumen: {
        total_no_leidas: estadisticas.no_leidas,
        criticas_no_leidas: estadisticas.criticas_no_leidas,
        altas_no_leidas: estadisticas.altas_no_leidas,
        solicitudes_pendientes: estadisticas.solicitudes_pendientes,
        visitas_proximas: estadisticas.visitas_proximas,
        empresas_pendientes: estadisticas.empresas_pendientes
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al obtener resumen de notificaciones',
      error: error.message
    });
  }
};

module.exports = {
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
};
