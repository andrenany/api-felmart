const db = require('../config/db');

const Visita = {
  // Crear tabla de visitas (ejecutar una sola vez)
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS visitas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        empresa_id INT,
        cotizacion_id INT,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        motivo ENUM('retiro', 'evaluacion') NOT NULL,
        estado ENUM('pendiente', 'aceptada', 'reprogramar', 'rechazada') DEFAULT 'pendiente',
        observaciones TEXT,
        admin_id INT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
        FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE SET NULL,
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
      )
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Crear una nueva visita
  create: (visitaData) => {
    const { usuario_id, empresa_id, cotizacion_id, fecha, hora, motivo, observaciones, admin_id } = visitaData;
    const sql = `
      INSERT INTO visitas 
      (usuario_id, empresa_id, cotizacion_id, fecha, hora, motivo, observaciones, admin_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        sql, 
        [usuario_id, empresa_id, cotizacion_id, fecha, hora, motivo, observaciones, admin_id], 
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Buscar visita por ID con detalles
  findById: (id) => {
    const sql = `
      SELECT 
        v.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        c.numero_cotizacion,
        c.total_clp as cotizacion_total,
        c.estado as cotizacion_estado,
        a.email as admin_email
      FROM visitas v
      LEFT JOIN users u ON v.usuario_id = u.id
      LEFT JOIN empresas e ON v.empresa_id = e.id
      LEFT JOIN cotizaciones c ON v.cotizacion_id = c.id
      LEFT JOIN admins a ON v.admin_id = a.id
      WHERE v.id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Obtener todas las visitas con detalles
  findAll: () => {
    const sql = `
      SELECT 
        v.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        c.numero_cotizacion,
        c.total_clp as cotizacion_total,
        c.estado as cotizacion_estado,
        a.email as admin_email
      FROM visitas v
      LEFT JOIN users u ON v.usuario_id = u.id
      LEFT JOIN empresas e ON v.empresa_id = e.id
      LEFT JOIN cotizaciones c ON v.cotizacion_id = c.id
      LEFT JOIN admins a ON v.admin_id = a.id
      ORDER BY v.fecha DESC, v.hora DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar visitas por usuario
  findByUsuario: (usuario_id) => {
    const sql = `
      SELECT 
        v.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        c.numero_cotizacion,
        c.total_clp as cotizacion_total,
        c.estado as cotizacion_estado,
        a.email as admin_email
      FROM visitas v
      LEFT JOIN users u ON v.usuario_id = u.id
      LEFT JOIN empresas e ON v.empresa_id = e.id
      LEFT JOIN cotizaciones c ON v.cotizacion_id = c.id
      LEFT JOIN admins a ON v.admin_id = a.id
      WHERE v.usuario_id = ?
      ORDER BY v.fecha DESC, v.hora DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [usuario_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar visitas por empresa
  findByEmpresa: (empresa_id) => {
    const sql = `
      SELECT 
        v.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        c.numero_cotizacion,
        c.total_clp as cotizacion_total,
        c.estado as cotizacion_estado,
        a.email as admin_email
      FROM visitas v
      LEFT JOIN users u ON v.usuario_id = u.id
      LEFT JOIN empresas e ON v.empresa_id = e.id
      LEFT JOIN cotizaciones c ON v.cotizacion_id = c.id
      LEFT JOIN admins a ON v.admin_id = a.id
      WHERE v.empresa_id = ?
      ORDER BY v.fecha DESC, v.hora DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [empresa_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar visitas por estado
  findByEstado: (estado) => {
    const sql = `
      SELECT 
        v.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        c.numero_cotizacion,
        c.total_clp as cotizacion_total,
        c.estado as cotizacion_estado,
        a.email as admin_email
      FROM visitas v
      LEFT JOIN users u ON v.usuario_id = u.id
      LEFT JOIN empresas e ON v.empresa_id = e.id
      LEFT JOIN cotizaciones c ON v.cotizacion_id = c.id
      LEFT JOIN admins a ON v.admin_id = a.id
      WHERE v.estado = ?
      ORDER BY v.fecha DESC, v.hora DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [estado], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar visitas por motivo
  findByMotivo: (motivo) => {
    const sql = `
      SELECT 
        v.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        c.numero_cotizacion,
        c.total_clp as cotizacion_total,
        c.estado as cotizacion_estado,
        a.email as admin_email
      FROM visitas v
      LEFT JOIN users u ON v.usuario_id = u.id
      LEFT JOIN empresas e ON v.empresa_id = e.id
      LEFT JOIN cotizaciones c ON v.cotizacion_id = c.id
      LEFT JOIN admins a ON v.admin_id = a.id
      WHERE v.motivo = ?
      ORDER BY v.fecha DESC, v.hora DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [motivo], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar visitas por fecha
  findByFecha: (fecha) => {
    const sql = `
      SELECT 
        v.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        c.numero_cotizacion,
        c.total_clp as cotizacion_total,
        c.estado as cotizacion_estado,
        a.email as admin_email
      FROM visitas v
      LEFT JOIN users u ON v.usuario_id = u.id
      LEFT JOIN empresas e ON v.empresa_id = e.id
      LEFT JOIN cotizaciones c ON v.cotizacion_id = c.id
      LEFT JOIN admins a ON v.admin_id = a.id
      WHERE v.fecha = ?
      ORDER BY v.hora ASC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [fecha], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar visita por fecha y hora (para validar duplicados)
  findByFechaHora: (fecha, hora) => {
    const sql = `
      SELECT 
        v.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        c.numero_cotizacion,
        c.total_clp as cotizacion_total,
        c.estado as cotizacion_estado,
        a.email as admin_email
      FROM visitas v
      LEFT JOIN users u ON v.usuario_id = u.id
      LEFT JOIN empresas e ON v.empresa_id = e.id
      LEFT JOIN cotizaciones c ON v.cotizacion_id = c.id
      LEFT JOIN admins a ON v.admin_id = a.id
      WHERE v.fecha = ? AND v.hora = ?
      LIMIT 1
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [fecha, hora], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || null);
      });
    });
  },

  // Buscar visitas por cotización
  findByCotizacion: (cotizacion_id) => {
    const sql = `
      SELECT 
        v.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        c.numero_cotizacion,
        c.total_clp as cotizacion_total,
        c.estado as cotizacion_estado,
        a.email as admin_email
      FROM visitas v
      LEFT JOIN users u ON v.usuario_id = u.id
      LEFT JOIN empresas e ON v.empresa_id = e.id
      LEFT JOIN cotizaciones c ON v.cotizacion_id = c.id
      LEFT JOIN admins a ON v.admin_id = a.id
      WHERE v.cotizacion_id = ?
      ORDER BY v.fecha DESC, v.hora DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [cotizacion_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar visitas sin cotización
  findSinCotizacion: () => {
    const sql = `
      SELECT 
        v.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        a.email as admin_email
      FROM visitas v
      LEFT JOIN users u ON v.usuario_id = u.id
      LEFT JOIN empresas e ON v.empresa_id = e.id
      LEFT JOIN admins a ON v.admin_id = a.id
      WHERE v.cotizacion_id IS NULL
      ORDER BY v.fecha DESC, v.hora DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar visitas con cotización
  findConCotizacion: () => {
    const sql = `
      SELECT 
        v.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        c.numero_cotizacion,
        c.total_clp as cotizacion_total,
        c.estado as cotizacion_estado,
        a.email as admin_email
      FROM visitas v
      LEFT JOIN users u ON v.usuario_id = u.id
      LEFT JOIN empresas e ON v.empresa_id = e.id
      LEFT JOIN cotizaciones c ON v.cotizacion_id = c.id
      LEFT JOIN admins a ON v.admin_id = a.id
      WHERE v.cotizacion_id IS NOT NULL
      ORDER BY v.fecha DESC, v.hora DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Actualizar visita
  update: (id, visitaData) => {
    const { fecha, hora, motivo, observaciones, estado, cotizacion_id } = visitaData;
    const sql = `
      UPDATE visitas 
      SET fecha = ?, hora = ?, motivo = ?, observaciones = ?, estado = ?, cotizacion_id = ?
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [fecha, hora, motivo, observaciones, estado, cotizacion_id, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Asignar cotización a una visita
  asignarCotizacion: (id, cotizacion_id) => {
    const sql = 'UPDATE visitas SET cotizacion_id = ? WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [cotizacion_id, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Desasignar cotización de una visita
  desasignarCotizacion: (id) => {
    const sql = 'UPDATE visitas SET cotizacion_id = NULL WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Actualizar estado de visita
  updateEstado: (id, estado) => {
    const sql = 'UPDATE visitas SET estado = ? WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [estado, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Aceptar visita
  aceptar: (id) => {
    return Visita.updateEstado(id, 'aceptada');
  },

  // Rechazar visita
  rechazar: (id) => {
    return Visita.updateEstado(id, 'rechazada');
  },

  // Solicitar reprogramación
  reprogramar: (id) => {
    return Visita.updateEstado(id, 'reprogramar');
  },

  // Eliminar visita
  delete: (id) => {
    const sql = 'DELETE FROM visitas WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
};

module.exports = Visita;


