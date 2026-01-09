const db = require('../config/db');

const SolicitudCotizacion = {
  // Crear tabla de solicitudes de cotización públicas
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS solicitudes_cotizacion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_solicitud VARCHAR(50) UNIQUE NOT NULL,
        tipo_solicitud ENUM('usuario', 'empresa') NOT NULL DEFAULT 'usuario',
        
        -- Datos de contacto
        nombre_solicitante VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        telefono VARCHAR(20),
        
        -- Datos de empresa (opcional)
        empresa_nombre VARCHAR(200),
        empresa_rut VARCHAR(20),
        empresa_giro VARCHAR(200),
        
        -- Ubicación
        direccion VARCHAR(255) NOT NULL,
        region_id INT,
        comuna_id INT,
        
        -- Detalles de la solicitud
        descripcion_residuos TEXT NOT NULL,
        cantidad_estimada VARCHAR(100),
        frecuencia_retiro ENUM('una_vez', 'semanal', 'quincenal', 'mensual', 'otro') DEFAULT 'una_vez',
        frecuencia_detalle VARCHAR(100),
        
        -- Información adicional
        observaciones TEXT,
        urgencia ENUM('baja', 'media', 'alta') DEFAULT 'media',
        
        -- Estado y gestión
        estado ENUM('pendiente', 'en_revision', 'cotizada', 'rechazada', 'completada') DEFAULT 'pendiente',
        admin_id INT,
        fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_revision DATETIME NULL,
        fecha_cotizacion DATETIME NULL,
        
        -- Relación con cotización final
        cotizacion_id INT NULL,
        
        FOREIGN KEY (region_id) REFERENCES regiones(id) ON DELETE SET NULL,
        FOREIGN KEY (comuna_id) REFERENCES comunas(id) ON DELETE SET NULL,
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL,
        FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE SET NULL
      )
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Generar número de solicitud automático
  generarNumeroSolicitud: async () => {
    const sql = 'SELECT numero_solicitud FROM solicitudes_cotizacion ORDER BY id DESC LIMIT 1';
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) {
          reject(err);
        } else {
          let numero = 1;
          if (results.length > 0) {
            const ultimoNumero = results[0].numero_solicitud;
            const match = ultimoNumero.match(/SOL-(\d+)/);
            if (match) {
              numero = parseInt(match[1]) + 1;
            }
          }
          resolve(`SOL-${numero.toString().padStart(6, '0')}`);
        }
      });
    });
  },

  // Crear una nueva solicitud pública
  create: async (solicitudData) => {
    const { 
      tipo_solicitud,
      nombre_solicitante,
      email,
      telefono,
      empresa_nombre,
      empresa_rut,
      empresa_giro,
      direccion,
      region_id,
      comuna_id,
      descripcion_residuos,
      cantidad_estimada,
      frecuencia_retiro,
      frecuencia_detalle,
      observaciones,
      urgencia
    } = solicitudData;

    // Validaciones básicas
    if (!nombre_solicitante || !email || !direccion || !descripcion_residuos) {
      throw new Error('Los campos obligatorios son: nombre, email, dirección y descripción de residuos');
    }

    // Validar región y comuna (requeridos)
    if (!region_id || !comuna_id) {
      throw new Error('Los campos región y comuna son obligatorios');
    }

    if (tipo_solicitud === 'empresa' && (!empresa_nombre || !empresa_rut)) {
      throw new Error('Para solicitudes de empresa se requiere nombre y RUT de la empresa');
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Generar número de solicitud
        const numero_solicitud = await SolicitudCotizacion.generarNumeroSolicitud();

        const sql = `
          INSERT INTO solicitudes_cotizacion 
          (numero_solicitud, tipo_solicitud, nombre_solicitante, email, telefono,
           empresa_nombre, empresa_rut, empresa_giro, direccion, region_id, comuna_id,
           descripcion_residuos, cantidad_estimada, frecuencia_retiro, frecuencia_detalle,
           observaciones, urgencia) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          numero_solicitud, tipo_solicitud, nombre_solicitante, email, telefono,
          empresa_nombre, empresa_rut, empresa_giro, direccion, region_id, comuna_id,
          descripcion_residuos, cantidad_estimada, frecuencia_retiro, frecuencia_detalle,
          observaciones, urgencia
        ];

        db.query(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve({ id: result.insertId, numero_solicitud });
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  // Buscar solicitud por ID
  findById: (id) => {
    const sql = `
      SELECT 
        s.*,
        r.nombre as region_nombre,
        c.nombre as comuna_nombre,
        a.email as admin_email,
        cot.numero_cotizacion
      FROM solicitudes_cotizacion s
      LEFT JOIN regiones r ON s.region_id = r.id
      LEFT JOIN comunas c ON s.comuna_id = c.id
      LEFT JOIN admins a ON s.admin_id = a.id
      LEFT JOIN cotizaciones cot ON s.cotizacion_id = cot.id
      WHERE s.id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Buscar solicitud por número
  findByNumero: (numero_solicitud) => {
    const sql = `
      SELECT 
        s.*,
        r.nombre as region_nombre,
        c.nombre as comuna_nombre,
        a.email as admin_email,
        cot.numero_cotizacion
      FROM solicitudes_cotizacion s
      LEFT JOIN regiones r ON s.region_id = r.id
      LEFT JOIN comunas c ON s.comuna_id = c.id
      LEFT JOIN admins a ON s.admin_id = a.id
      LEFT JOIN cotizaciones cot ON s.cotizacion_id = cot.id
      WHERE s.numero_solicitud = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [numero_solicitud], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Obtener todas las solicitudes (para admin)
  findAll: () => {
    const sql = `
      SELECT 
        s.*,
        r.nombre as region_nombre,
        c.nombre as comuna_nombre,
        a.email as admin_email,
        cot.numero_cotizacion
      FROM solicitudes_cotizacion s
      LEFT JOIN regiones r ON s.region_id = r.id
      LEFT JOIN comunas c ON s.comuna_id = c.id
      LEFT JOIN admins a ON s.admin_id = a.id
      LEFT JOIN cotizaciones cot ON s.cotizacion_id = cot.id
      ORDER BY s.fecha_solicitud DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar solicitudes por estado
  findByEstado: (estado) => {
    const sql = `
      SELECT 
        s.*,
        r.nombre as region_nombre,
        c.nombre as comuna_nombre,
        a.email as admin_email,
        cot.numero_cotizacion
      FROM solicitudes_cotizacion s
      LEFT JOIN regiones r ON s.region_id = r.id
      LEFT JOIN comunas c ON s.comuna_id = c.id
      LEFT JOIN admins a ON s.admin_id = a.id
      LEFT JOIN cotizaciones cot ON s.cotizacion_id = cot.id
      WHERE s.estado = ?
      ORDER BY s.fecha_solicitud DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [estado], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar solicitudes por tipo
  findByTipo: (tipo_solicitud) => {
    const sql = `
      SELECT 
        s.*,
        r.nombre as region_nombre,
        c.nombre as comuna_nombre,
        a.email as admin_email,
        cot.numero_cotizacion
      FROM solicitudes_cotizacion s
      LEFT JOIN regiones r ON s.region_id = r.id
      LEFT JOIN comunas c ON s.comuna_id = c.id
      LEFT JOIN admins a ON s.admin_id = a.id
      LEFT JOIN cotizaciones cot ON s.cotizacion_id = cot.id
      WHERE s.tipo_solicitud = ?
      ORDER BY s.fecha_solicitud DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [tipo_solicitud], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Actualizar estado de solicitud
  updateEstado: (id, estado, admin_id = null) => {
    const sql = `
      UPDATE solicitudes_cotizacion 
      SET estado = ?, admin_id = ?, fecha_revision = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [estado, admin_id, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Asignar solicitud a admin
  asignarAdmin: (id, admin_id) => {
    const sql = `
      UPDATE solicitudes_cotizacion 
      SET admin_id = ?, estado = 'en_revision', fecha_revision = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [admin_id, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Marcar como cotizada
  marcarComoCotizada: (id, cotizacion_id, admin_id) => {
    const sql = `
      UPDATE solicitudes_cotizacion 
      SET estado = 'cotizada', cotizacion_id = ?, admin_id = ?, 
          fecha_cotizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [cotizacion_id, admin_id, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Rechazar solicitud
  rechazar: (id, admin_id, motivo = null) => {
    const sql = `
      UPDATE solicitudes_cotizacion 
      SET estado = 'rechazada', admin_id = ?, fecha_revision = CURRENT_TIMESTAMP,
          observaciones = CONCAT(IFNULL(observaciones, ''), 
          IF(observaciones IS NOT NULL, '\n\nMotivo de rechazo: ', 'Motivo de rechazo: '), ?)
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [admin_id, motivo || 'No especificado', id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Actualizar solicitud
  update: (id, solicitudData) => {
    const { 
      nombre_solicitante, email, telefono, empresa_nombre, empresa_rut, empresa_giro,
      direccion, region_id, comuna_id, descripcion_residuos, cantidad_estimada,
      frecuencia_retiro, frecuencia_detalle, observaciones, urgencia
    } = solicitudData;

    const sql = `
      UPDATE solicitudes_cotizacion 
      SET nombre_solicitante = ?, email = ?, telefono = ?, empresa_nombre = ?, 
          empresa_rut = ?, empresa_giro = ?, direccion = ?, region_id = ?, 
          comuna_id = ?, descripcion_residuos = ?, cantidad_estimada = ?,
          frecuencia_retiro = ?, frecuencia_detalle = ?, observaciones = ?, urgencia = ?
      WHERE id = ?
    `;
    
    const params = [
      nombre_solicitante, email, telefono, empresa_nombre, empresa_rut, empresa_giro,
      direccion, region_id, comuna_id, descripcion_residuos, cantidad_estimada,
      frecuencia_retiro, frecuencia_detalle, observaciones, urgencia, id
    ];

    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Eliminar solicitud
  delete: (id) => {
    const sql = 'DELETE FROM solicitudes_cotizacion WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Obtener estadísticas
  getEstadisticas: () => {
    const sql = `
      SELECT 
        estado,
        COUNT(*) as cantidad,
        tipo_solicitud,
        urgencia
      FROM solicitudes_cotizacion 
      GROUP BY estado, tipo_solicitud, urgencia
      ORDER BY estado, tipo_solicitud
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
};

module.exports = SolicitudCotizacion;
