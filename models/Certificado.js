const db = require('../config/db');

const Certificado = {
  // Crear tabla de certificados (ejecutar una sola vez)
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS certificados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        empresa_id INT,
        visita_id INT,
        nombre_archivo VARCHAR(255) NOT NULL,
        ruta_archivo VARCHAR(500) NOT NULL,
        tipo_archivo VARCHAR(100) DEFAULT 'application/pdf',
        tamano_archivo INT,
        descripcion TEXT,
        admin_id INT,
        enviado_email BOOLEAN DEFAULT FALSE,
        fecha_envio_email DATETIME,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
        FOREIGN KEY (visita_id) REFERENCES visitas(id) ON DELETE SET NULL,
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

  // Crear un nuevo certificado
  create: (certificadoData) => {
    const { 
      usuario_id, 
      empresa_id, 
      visita_id, 
      nombre_archivo, 
      ruta_archivo,
      tipo_archivo,
      tamano_archivo,
      descripcion,
      admin_id 
    } = certificadoData;
    
    const sql = `
      INSERT INTO certificados 
      (usuario_id, empresa_id, visita_id, nombre_archivo, ruta_archivo, 
       tipo_archivo, tamano_archivo, descripcion, admin_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        sql, 
        [usuario_id, empresa_id, visita_id, nombre_archivo, ruta_archivo, 
         tipo_archivo, tamano_archivo, descripcion, admin_id], 
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Buscar certificado por ID con detalles
  findById: (id) => {
    const sql = `
      SELECT 
        c.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        v.fecha as visita_fecha,
        v.motivo as visita_motivo,
        a.email as admin_email
      FROM certificados c
      LEFT JOIN users u ON c.usuario_id = u.id
      LEFT JOIN empresas e ON c.empresa_id = e.id
      LEFT JOIN visitas v ON c.visita_id = v.id
      LEFT JOIN admins a ON c.admin_id = a.id
      WHERE c.id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Obtener todos los certificados con detalles
  findAll: () => {
    const sql = `
      SELECT 
        c.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        v.fecha as visita_fecha,
        v.motivo as visita_motivo,
        a.email as admin_email
      FROM certificados c
      LEFT JOIN users u ON c.usuario_id = u.id
      LEFT JOIN empresas e ON c.empresa_id = e.id
      LEFT JOIN visitas v ON c.visita_id = v.id
      LEFT JOIN admins a ON c.admin_id = a.id
      ORDER BY c.fecha_creacion DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar certificados por usuario
  findByUsuario: (usuario_id) => {
    const sql = `
      SELECT 
        c.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        v.fecha as visita_fecha,
        v.motivo as visita_motivo,
        a.email as admin_email
      FROM certificados c
      LEFT JOIN users u ON c.usuario_id = u.id
      LEFT JOIN empresas e ON c.empresa_id = e.id
      LEFT JOIN visitas v ON c.visita_id = v.id
      LEFT JOIN admins a ON c.admin_id = a.id
      WHERE c.usuario_id = ?
      ORDER BY c.fecha_creacion DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [usuario_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar certificados por empresa
  findByEmpresa: (empresa_id) => {
    const sql = `
      SELECT 
        c.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        v.fecha as visita_fecha,
        v.motivo as visita_motivo,
        a.email as admin_email
      FROM certificados c
      LEFT JOIN users u ON c.usuario_id = u.id
      LEFT JOIN empresas e ON c.empresa_id = e.id
      LEFT JOIN visitas v ON c.visita_id = v.id
      LEFT JOIN admins a ON c.admin_id = a.id
      WHERE c.empresa_id = ?
      ORDER BY c.fecha_creacion DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [empresa_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar certificados por visita
  findByVisita: (visita_id) => {
    const sql = `
      SELECT 
        c.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        e.nombre as empresa_nombre,
        e.rut as empresa_rut,
        v.fecha as visita_fecha,
        v.motivo as visita_motivo,
        a.email as admin_email
      FROM certificados c
      LEFT JOIN users u ON c.usuario_id = u.id
      LEFT JOIN empresas e ON c.empresa_id = e.id
      LEFT JOIN visitas v ON c.visita_id = v.id
      LEFT JOIN admins a ON c.admin_id = a.id
      WHERE c.visita_id = ?
      ORDER BY c.fecha_creacion DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [visita_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Marcar como enviado por email
  marcarEnviado: (id) => {
    const sql = `
      UPDATE certificados 
      SET enviado_email = TRUE, fecha_envio_email = NOW() 
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Actualizar certificado
  update: (id, certificadoData) => {
    const { descripcion } = certificadoData;
    const sql = 'UPDATE certificados SET descripcion = ? WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [descripcion, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Eliminar certificado
  delete: (id) => {
    const sql = 'DELETE FROM certificados WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
};

module.exports = Certificado;


