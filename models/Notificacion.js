const db = require('../config/db');

const Notificacion = {
  // Crear tabla de notificaciones
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS notificaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        tipo ENUM('solicitud_pendiente', 'visita_proxima', 'empresa_pendiente', 'cotizacion_vencida', 'sistema') NOT NULL,
        titulo VARCHAR(200) NOT NULL,
        mensaje TEXT NOT NULL,
        datos_adicionales JSON NULL,
        prioridad ENUM('baja', 'media', 'alta', 'critica') DEFAULT 'media',
        leida BOOLEAN DEFAULT FALSE,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_lectura DATETIME NULL,
        fecha_expiracion DATETIME NULL,
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
        INDEX idx_admin_fecha (admin_id, fecha_creacion),
        INDEX idx_tipo_prioridad (tipo, prioridad),
        INDEX idx_leida (leida)
      )
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Crear una nueva notificación
  create: (notificacionData) => {
    const { 
      admin_id, 
      tipo, 
      titulo, 
      mensaje, 
      datos_adicionales, 
      prioridad = 'media',
      fecha_expiracion 
    } = notificacionData;

    const sql = `
      INSERT INTO notificaciones 
      (admin_id, tipo, titulo, mensaje, datos_adicionales, prioridad, fecha_expiracion) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const datosJson = datos_adicionales ? JSON.stringify(datos_adicionales) : null;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [admin_id, tipo, titulo, mensaje, datosJson, prioridad, fecha_expiracion], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Crear notificación para todos los admins
  createParaTodos: (notificacionData) => {
    const { 
      tipo, 
      titulo, 
      mensaje, 
      datos_adicionales, 
      prioridad = 'media',
      fecha_expiracion 
    } = notificacionData;

    const sql = `
      INSERT INTO notificaciones 
      (admin_id, tipo, titulo, mensaje, datos_adicionales, prioridad, fecha_expiracion)
      SELECT id, ?, ?, ?, ?, ?, ?
      FROM admins
    `;
    
    const datosJson = datos_adicionales ? JSON.stringify(datos_adicionales) : null;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [tipo, titulo, mensaje, datosJson, prioridad, fecha_expiracion], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Obtener notificaciones de un admin
  findByAdmin: (admin_id, options = {}) => {
    const { 
      solo_no_leidas = false, 
      limite = 50, 
      tipo = null,
      prioridad = null 
    } = options;

    let sql = `
      SELECT 
        n.*,
        a.email as admin_email
      FROM notificaciones n
      INNER JOIN admins a ON n.admin_id = a.id
      WHERE n.admin_id = ?
    `;
    
    const params = [admin_id];

    if (solo_no_leidas) {
      sql += ' AND n.leida = FALSE';
    }

    if (tipo) {
      sql += ' AND n.tipo = ?';
      params.push(tipo);
    }

    if (prioridad) {
      sql += ' AND n.prioridad = ?';
      params.push(prioridad);
    }

    sql += ' AND (n.fecha_expiracion IS NULL OR n.fecha_expiracion > NOW())';
    sql += ' ORDER BY n.prioridad DESC, n.fecha_creacion DESC';
    sql += ' LIMIT ?';
    params.push(limite);

    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) reject(err);
        else {
          // Parsear JSON de datos adicionales con manejo de errores
          const notificaciones = results.map(notif => {
            let datosAdicionales = null;

            if (notif.datos_adicionales) {
              if (typeof notif.datos_adicionales === 'string') {
                try {
                  datosAdicionales = JSON.parse(notif.datos_adicionales);
                } catch (parseError) {
                  console.error(
                    'Error al parsear datos_adicionales en Notificacion.findByAdmin:',
                    parseError,
                    'Valor recibido:',
                    notif.datos_adicionales
                  );
                  datosAdicionales = null;
                }
              } else if (typeof notif.datos_adicionales === 'object') {
                datosAdicionales = notif.datos_adicionales;
              }
            }

            return {
              ...notif,
              datos_adicionales: datosAdicionales
            };
          });
          resolve(notificaciones);
        }
      });
    });
  },

  // Marcar notificación como leída
  marcarComoLeida: (id, admin_id) => {
    const sql = `
      UPDATE notificaciones 
      SET leida = TRUE, fecha_lectura = CURRENT_TIMESTAMP 
      WHERE id = ? AND admin_id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id, admin_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Marcar todas las notificaciones como leídas
  marcarTodasComoLeidas: (admin_id) => {
    const sql = `
      UPDATE notificaciones 
      SET leida = TRUE, fecha_lectura = CURRENT_TIMESTAMP 
      WHERE admin_id = ? AND leida = FALSE
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [admin_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Eliminar notificación
  delete: (id, admin_id) => {
    const sql = 'DELETE FROM notificaciones WHERE id = ? AND admin_id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id, admin_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Eliminar notificaciones expiradas
  eliminarExpiradas: () => {
    const sql = 'DELETE FROM notificaciones WHERE fecha_expiracion < NOW()';
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Obtener estadísticas de notificaciones
  getEstadisticas: (admin_id) => {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN leida = FALSE THEN 1 ELSE 0 END) as no_leidas,
        SUM(CASE WHEN prioridad = 'critica' AND leida = FALSE THEN 1 ELSE 0 END) as criticas_no_leidas,
        SUM(CASE WHEN prioridad = 'alta' AND leida = FALSE THEN 1 ELSE 0 END) as altas_no_leidas,
        SUM(CASE WHEN tipo = 'solicitud_pendiente' AND leida = FALSE THEN 1 ELSE 0 END) as solicitudes_pendientes,
        SUM(CASE WHEN tipo = 'visita_proxima' AND leida = FALSE THEN 1 ELSE 0 END) as visitas_proximas,
        SUM(CASE WHEN tipo = 'empresa_pendiente' AND leida = FALSE THEN 1 ELSE 0 END) as empresas_pendientes
      FROM notificaciones 
      WHERE admin_id = ? 
      AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [admin_id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Generar notificaciones automáticas
  generarNotificacionesAutomaticas: async () => {
    try {
      const SolicitudCotizacion = require('./SolicitudCotizacion');
      const Visita = require('./Visita');
      const Empresa = require('./Empresa');
      const Cotizacion = require('./Cotizacion');

      // 1. Solicitudes de cotización pendientes
      const solicitudesPendientes = await SolicitudCotizacion.findByEstado('pendiente');
      if (solicitudesPendientes.length > 0) {
        await Notificacion.createParaTodos({
          tipo: 'solicitud_pendiente',
          titulo: `${solicitudesPendientes.length} Solicitud(es) de Cotización Pendiente(s)`,
          mensaje: `Hay ${solicitudesPendientes.length} solicitud(es) de cotización esperando revisión.`,
          datos_adicionales: {
            cantidad: solicitudesPendientes.length,
            solicitudes: solicitudesPendientes.map(s => ({
              id: s.id,
              numero_solicitud: s.numero_solicitud,
              nombre_solicitante: s.nombre_solicitante,
              tipo_solicitud: s.tipo_solicitud,
              fecha_solicitud: s.fecha_solicitud
            }))
          },
          prioridad: solicitudesPendientes.length > 5 ? 'alta' : 'media'
        });
      }

      // 2. Visitas próximas (próximas 24 horas)
      const hoy = new Date();
      const mañana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000);
      
      const visitasProximas = await Visita.findByFecha(hoy.toISOString().split('T')[0]);
      const visitasMañana = await Visita.findByFecha(mañana.toISOString().split('T')[0]);
      
      const visitasProximasTotal = [...visitasProximas, ...visitasMañana].filter(v => 
        v.estado === 'aceptada' || v.estado === 'pendiente'
      );

      if (visitasProximasTotal.length > 0) {
        await Notificacion.createParaTodos({
          tipo: 'visita_proxima',
          titulo: `${visitasProximasTotal.length} Visita(s) Programada(s)`,
          mensaje: `Tienes ${visitasProximasTotal.length} visita(s) programada(s) para hoy y mañana.`,
          datos_adicionales: {
            cantidad: visitasProximasTotal.length,
            visitas: visitasProximasTotal.map(v => ({
              id: v.id,
              fecha: v.fecha,
              hora: v.hora,
              motivo: v.motivo,
              usuario_nombre: v.usuario_nombre,
              empresa_nombre: v.empresa_nombre,
              estado: v.estado
            }))
          },
          prioridad: 'media'
        });
      }

      // 3. Empresas pendientes de aprobación
      const empresasPendientes = await Empresa.findByEstado('pendiente');
      if (empresasPendientes.length > 0) {
        await Notificacion.createParaTodos({
          tipo: 'empresa_pendiente',
          titulo: `${empresasPendientes.length} Empresa(s) Pendiente(s) de Aprobación`,
          mensaje: `Hay ${empresasPendientes.length} empresa(s) esperando aprobación.`,
          datos_adicionales: {
            cantidad: empresasPendientes.length,
            empresas: empresasPendientes.map(e => ({
              id: e.id,
              nombre: e.nombre,
              rut: e.rut,
              fecha_creacion: e.fecha_creacion
            }))
          },
          prioridad: 'media'
        });
      }

      // 4. Cotizaciones pendientes (más de 3 días)
      const tresDiasAtras = new Date(hoy.getTime() - 3 * 24 * 60 * 60 * 1000);
      const cotizacionesPendientes = await Cotizacion.findByEstado('pendiente');
      const cotizacionesVencidas = cotizacionesPendientes.filter(c => 
        new Date(c.fecha_cotizacion) < tresDiasAtras
      );

      if (cotizacionesVencidas.length > 0) {
        await Notificacion.createParaTodos({
          tipo: 'cotizacion_vencida',
          titulo: `${cotizacionesVencidas.length} Cotización(es) Pendiente(s) por Más de 3 Días`,
          mensaje: `Hay ${cotizacionesVencidas.length} cotización(es) que requieren seguimiento urgente.`,
          datos_adicionales: {
            cantidad: cotizacionesVencidas.length,
            cotizaciones: cotizacionesVencidas.map(c => ({
              id: c.id,
              numero_cotizacion: c.numero_cotizacion,
              usuario_nombre: c.usuario_nombre,
              empresa_nombre: c.empresa_nombre,
              total_clp: c.total_clp,
              fecha_cotizacion: c.fecha_cotizacion
            }))
          },
          prioridad: 'alta'
        });
      }

      return {
        solicitudes_generadas: solicitudesPendientes.length,
        visitas_generadas: visitasProximasTotal.length,
        empresas_generadas: empresasPendientes.length,
        cotizaciones_generadas: cotizacionesVencidas.length
      };
    } catch (error) {
      console.error('Error generando notificaciones automáticas:', error);
      throw error;
    }
  }
};

module.exports = Notificacion;
