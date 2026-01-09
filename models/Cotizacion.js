const db = require('../config/db');

const Cotizacion = {
  // Crear tabla de cotizaciones (ejecutar una sola vez)
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS cotizaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_cotizacion VARCHAR(50) UNIQUE NOT NULL,
        usuario_id INT,
        usuario_nombre VARCHAR(100) NOT NULL,
        empresa_id INT,
        empresa_rut VARCHAR(20),
        empresa_nombre VARCHAR(200),
        empresa_direccion VARCHAR(255),
        empresa_region VARCHAR(100),
        empresa_comuna VARCHAR(100),
        valor_uf DECIMAL(10, 2),
        fecha_cotizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_clp DECIMAL(15, 2) NOT NULL,
        estado ENUM('pendiente', 'aceptada', 'rechazada') DEFAULT 'pendiente',
        observaciones TEXT,
        admin_id INT,
        tipo_cotizacion ENUM('usuario', 'empresa') NOT NULL DEFAULT 'usuario',
        FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
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

  // Crear tabla de detalle de cotizaciones con residuos
  createDetalleTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS cotizacion_residuos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cotizacion_id INT NOT NULL,
        residuo_id INT,
        residuo_descripcion VARCHAR(200) NOT NULL,
        cantidad DECIMAL(10, 2) NOT NULL,
        precio_unitario DECIMAL(10, 2) NOT NULL,
        moneda_original ENUM('UF', 'CLP') NOT NULL,
        precio_unitario_clp DECIMAL(10, 2) NOT NULL,
        subtotal_clp DECIMAL(15, 2) NOT NULL,
        unidad VARCHAR(20) NOT NULL,
        FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,
        FOREIGN KEY (residuo_id) REFERENCES residuos(id) ON DELETE SET NULL
      )
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Generar número de cotización automático
  generarNumeroCotizacion: async () => {
    const sql = 'SELECT numero_cotizacion FROM cotizaciones ORDER BY id DESC LIMIT 1';
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) {
          reject(err);
        } else {
          let numero = 1;
          if (results.length > 0) {
            const ultimoNumero = results[0].numero_cotizacion;
            const match = ultimoNumero.match(/COT-(\d+)/);
            if (match) {
              numero = parseInt(match[1]) + 1;
            }
          }
          resolve(`COT-${numero.toString().padStart(6, '0')}`);
        }
      });
    });
  },

  // Crear una nueva cotización (transacción para garantizar integridad)
  create: async (cotizacionData) => {
    const { 
      usuario_id, 
      usuario_nombre, 
      empresa_id, 
      empresa_rut, 
      empresa_nombre, 
      empresa_direccion,
      empresa_region,
      empresa_comuna,
      valor_uf,
      total_clp,
      observaciones,
      admin_id,
      residuos,
      tipo_cotizacion = 'usuario' // Por defecto es para usuario
    } = cotizacionData;

    // Validar datos según el tipo de cotización
    if (tipo_cotizacion === 'empresa') {
      if (!empresa_id || !empresa_rut || !empresa_nombre) {
        throw new Error('Para cotizaciones de empresa se requiere empresa_id, empresa_rut y empresa_nombre');
      }
    }
    
    if (!usuario_id || !usuario_nombre) {
      throw new Error('Se requiere usuario_id y usuario_nombre para cualquier tipo de cotización');
    }
    
    return new Promise(async (resolve, reject) => {
      db.beginTransaction(async (err) => {
        if (err) {
          return reject(err);
        }

        try {
          // Generar número de cotización
          const numero_cotizacion = await Cotizacion.generarNumeroCotizacion();

          // Insertar cotización principal
          const sqlCotizacion = `
            INSERT INTO cotizaciones 
            (numero_cotizacion, usuario_id, usuario_nombre, empresa_id, empresa_rut, 
             empresa_nombre, empresa_direccion, empresa_region, empresa_comuna, 
             valor_uf, total_clp, observaciones, admin_id, tipo_cotizacion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          db.query(
            sqlCotizacion, 
            [numero_cotizacion, usuario_id, usuario_nombre, empresa_id, empresa_rut, 
             empresa_nombre, empresa_direccion, empresa_region, empresa_comuna,
             valor_uf, total_clp, observaciones, admin_id, tipo_cotizacion], 
            (err, result) => {
              if (err) {
                return db.rollback(() => {
                  reject(err);
                });
              }

              const cotizacion_id = result.insertId;

              // Insertar residuos
              const sqlResiduos = `
                INSERT INTO cotizacion_residuos 
                (cotizacion_id, residuo_id, residuo_descripcion, cantidad, 
                 precio_unitario, moneda_original, precio_unitario_clp, 
                 subtotal_clp, unidad) 
                VALUES ?
              `;

              const valuesResiduos = residuos.map(r => [
                cotizacion_id,
                r.residuo_id,
                r.residuo_descripcion,
                r.cantidad,
                r.precio_unitario,
                r.moneda_original,
                r.precio_unitario_clp,
                r.subtotal_clp,
                r.unidad
              ]);

              db.query(sqlResiduos, [valuesResiduos], (err, result) => {
                if (err) {
                  return db.rollback(() => {
                    reject(err);
                  });
                }

                db.commit((err) => {
                  if (err) {
                    return db.rollback(() => {
                      reject(err);
                    });
                  }
                  resolve({ id: cotizacion_id, numero_cotizacion });
                });
              });
            }
          );
        } catch (error) {
          db.rollback(() => {
            reject(error);
          });
        }
      });
    });
  },

  // Buscar cotización por ID con detalles
  findById: (id) => {
    const sql = `
      SELECT 
        c.*,
        a.email as admin_email
      FROM cotizaciones c
      LEFT JOIN admins a ON c.admin_id = a.id
      WHERE c.id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) {
          reject(err);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          const cotizacion = results[0];
          
          // Obtener residuos de la cotización
          const sqlResiduos = 'SELECT * FROM cotizacion_residuos WHERE cotizacion_id = ?';
          db.query(sqlResiduos, [id], (err, residuos) => {
            if (err) {
              reject(err);
            } else {
              cotizacion.residuos = residuos;
              resolve(cotizacion);
            }
          });
        }
      });
    });
  },

  // Buscar cotización por número
  findByNumero: (numero_cotizacion) => {
    const sql = `
      SELECT 
        c.*,
        a.email as admin_email
      FROM cotizaciones c
      LEFT JOIN admins a ON c.admin_id = a.id
      WHERE c.numero_cotizacion = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [numero_cotizacion], (err, results) => {
        if (err) {
          reject(err);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          const cotizacion = results[0];
          
          // Obtener residuos de la cotización
          const sqlResiduos = 'SELECT * FROM cotizacion_residuos WHERE cotizacion_id = ?';
          db.query(sqlResiduos, [cotizacion.id], (err, residuos) => {
            if (err) {
              reject(err);
            } else {
              cotizacion.residuos = residuos;
              resolve(cotizacion);
            }
          });
        }
      });
    });
  },

  // Obtener todas las cotizaciones
  findAll: () => {
    const sql = `
      SELECT 
        c.*,
        a.email as admin_email
      FROM cotizaciones c
      LEFT JOIN admins a ON c.admin_id = a.id
      ORDER BY c.fecha_cotizacion DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar cotizaciones por usuario
  findByUsuario: (usuario_id) => {
    const sql = `
      SELECT 
        c.*,
        a.email as admin_email
      FROM cotizaciones c
      LEFT JOIN admins a ON c.admin_id = a.id
      WHERE c.usuario_id = ?
      ORDER BY c.fecha_cotizacion DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [usuario_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar cotizaciones por empresa
  findByEmpresa: (empresa_id) => {
    const sql = `
      SELECT 
        c.*,
        a.email as admin_email
      FROM cotizaciones c
      LEFT JOIN admins a ON c.admin_id = a.id
      WHERE c.empresa_id = ?
      ORDER BY c.fecha_cotizacion DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [empresa_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar cotizaciones por estado
  findByEstado: (estado) => {
    const sql = `
      SELECT 
        c.*,
        a.email as admin_email
      FROM cotizaciones c
      LEFT JOIN admins a ON c.admin_id = a.id
      WHERE c.estado = ?
      ORDER BY c.fecha_cotizacion DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [estado], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar cotizaciones por tipo
  findByTipo: (tipo_cotizacion) => {
    const sql = `
      SELECT 
        c.*,
        a.email as admin_email
      FROM cotizaciones c
      LEFT JOIN admins a ON c.admin_id = a.id
      WHERE c.tipo_cotizacion = ?
      ORDER BY c.fecha_cotizacion DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [tipo_cotizacion], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar cotizaciones solo para usuarios (sin empresa)
  findSoloUsuarios: () => {
    const sql = `
      SELECT 
        c.*,
        a.email as admin_email
      FROM cotizaciones c
      LEFT JOIN admins a ON c.admin_id = a.id
      WHERE c.tipo_cotizacion = 'usuario' AND c.empresa_id IS NULL
      ORDER BY c.fecha_cotizacion DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar cotizaciones para empresas
  findParaEmpresas: () => {
    const sql = `
      SELECT 
        c.*,
        a.email as admin_email
      FROM cotizaciones c
      LEFT JOIN admins a ON c.admin_id = a.id
      WHERE c.tipo_cotizacion = 'empresa' AND c.empresa_id IS NOT NULL
      ORDER BY c.fecha_cotizacion DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Aceptar cotización
  aceptar: (id) => {
    const sql = 'UPDATE cotizaciones SET estado = ? WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, ['aceptada', id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Rechazar cotización
  rechazar: (id) => {
    const sql = 'UPDATE cotizaciones SET estado = ? WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, ['rechazada', id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Actualizar tipo de cotización
  updateTipo: (id, tipo_cotizacion, empresaData = null) => {
    let sql, params;
    
    if (tipo_cotizacion === 'empresa' && empresaData) {
      sql = `
        UPDATE cotizaciones 
        SET tipo_cotizacion = ?, empresa_id = ?, empresa_rut = ?, 
            empresa_nombre = ?, empresa_direccion = ?, empresa_region = ?, empresa_comuna = ?
        WHERE id = ?
      `;
      params = [
        tipo_cotizacion, 
        empresaData.empresa_id, 
        empresaData.empresa_rut, 
        empresaData.empresa_nombre,
        empresaData.empresa_direccion,
        empresaData.empresa_region,
        empresaData.empresa_comuna,
        id
      ];
    } else if (tipo_cotizacion === 'usuario') {
      sql = `
        UPDATE cotizaciones 
        SET tipo_cotizacion = ?, empresa_id = NULL, empresa_rut = NULL, 
            empresa_nombre = NULL, empresa_direccion = NULL, empresa_region = NULL, empresa_comuna = NULL
        WHERE id = ?
      `;
      params = [tipo_cotizacion, id];
    } else {
      return Promise.reject(new Error('Tipo de cotización no válido o datos de empresa faltantes'));
    }
    
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Eliminar cotización
  delete: (id) => {
    const sql = 'DELETE FROM cotizaciones WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
};

module.exports = Cotizacion;

