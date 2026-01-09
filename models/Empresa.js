const db = require('../config/db');

const Empresa = {
  // Crear tabla de empresas (ejecutar una sola vez)
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS empresas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rut VARCHAR(20) UNIQUE NOT NULL,
        nombre VARCHAR(200) NOT NULL,
        giro VARCHAR(200),
        direccion VARCHAR(255),
        kilometraje INT NULL,
        comuna_id INT,
        region_id INT,
        estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (comuna_id) REFERENCES comunas(id) ON DELETE SET NULL,
        FOREIGN KEY (region_id) REFERENCES regiones(id) ON DELETE SET NULL
      )
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Crear tabla de relación empresa-usuario (muchos a muchos)
  createEmpresaUsuarioTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS empresa_usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        usuario_id INT NOT NULL,
        fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_empresa_usuario (empresa_id, usuario_id)
      )
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Crear una nueva empresa
  create: (empresaData) => {
    const { rut, nombre, giro, direccion, kilometraje, comuna_id, region_id, estado, usuarios } = empresaData;
    const sql = 'INSERT INTO empresas (rut, nombre, giro, direccion, kilometraje, comuna_id, region_id, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [rut, nombre, giro, direccion, kilometraje, comuna_id, region_id, estado || 'pendiente'], (err, result) => {
        if (err) {
          reject(err);
        } else {
          const empresa_id = result.insertId;
          
          // Si se proporcionan usuarios, agregarlos a la empresa
          if (usuarios && usuarios.length > 0) {
            Empresa.agregarUsuarios(empresa_id, usuarios)
              .then(() => resolve({ id: empresa_id, ...result }))
              .catch(reject);
          } else {
            resolve({ id: empresa_id, ...result });
          }
        }
      });
    });
  },

  // Buscar empresa por RUT
  findByRut: (rut) => {
    const sql = 'SELECT * FROM empresas WHERE rut = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [rut], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Buscar empresa por ID
  findById: (id) => {
    const sql = 'SELECT * FROM empresas WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Buscar empresa por ID con usuarios
  findByIdWithUsuarios: (id) => {
    const sql = `
      SELECT 
        e.*,
        eu.usuario_id,
        eu.activo,
        eu.fecha_asignacion,
        u.nombre as usuario_nombre,
        u.email as usuario_email
      FROM empresas e
      LEFT JOIN empresa_usuarios eu ON e.id = eu.empresa_id
      LEFT JOIN users u ON eu.usuario_id = u.id
      WHERE e.id = ? AND eu.activo = TRUE
      ORDER BY eu.fecha_asignacion ASC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) {
          reject(err);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          const empresa = {
            id: results[0].id,
            rut: results[0].rut,
            nombre: results[0].nombre,
            giro: results[0].giro,
            direccion: results[0].direccion,
            kilometraje: results[0].kilometraje,
            comuna_id: results[0].comuna_id,
            region_id: results[0].region_id,
            estado: results[0].estado,
            fecha_creacion: results[0].fecha_creacion,
            fecha_actualizacion: results[0].fecha_actualizacion,
            usuarios: results.map(row => ({
              usuario_id: row.usuario_id,
              usuario_nombre: row.usuario_nombre,
              usuario_email: row.usuario_email,
              activo: row.activo,
              fecha_asignacion: row.fecha_asignacion
            }))
          };
          resolve(empresa);
        }
      });
    });
  },

  // Obtener todas las empresas
  findAll: () => {
    const sql = 'SELECT * FROM empresas ORDER BY nombre';
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar empresas por usuario
  findByUsuario: (usuario_id) => {
    const sql = `
      SELECT 
        e.*,
        eu.activo,
        eu.fecha_asignacion
      FROM empresas e
      INNER JOIN empresa_usuarios eu ON e.id = eu.empresa_id
      WHERE eu.usuario_id = ? AND eu.activo = TRUE
      ORDER BY e.nombre
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, [usuario_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar empresas por región
  findByRegion: (region_id) => {
    const sql = 'SELECT * FROM empresas WHERE region_id = ? ORDER BY nombre';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [region_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar empresas por comuna
  findByComuna: (comuna_id) => {
    const sql = 'SELECT * FROM empresas WHERE comuna_id = ? ORDER BY nombre';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [comuna_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Actualizar empresa
  update: (id, empresaData) => {
    const { rut, nombre, giro, direccion, kilometraje, comuna_id, region_id, estado, usuarios } = empresaData;
    const sql = 'UPDATE empresas SET rut = ?, nombre = ?, giro = ?, direccion = ?, kilometraje = ?, comuna_id = ?, region_id = ?, estado = ? WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [rut, nombre, giro, direccion, kilometraje, comuna_id, region_id, estado, id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          // Si se proporcionan usuarios, actualizar la relación
          if (usuarios !== undefined) {
            Empresa.actualizarUsuarios(id, usuarios)
              .then(() => resolve(result))
              .catch(reject);
          } else {
            resolve(result);
          }
        }
      });
    });
  },

  // Obtener empresas por estado
  findByEstado: (estado) => {
    const sql = 'SELECT * FROM empresas WHERE estado = ? ORDER BY nombre';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [estado], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Aprobar empresa (cambiar estado a aprobada)
  aprobar: (id) => {
    const sql = 'UPDATE empresas SET estado = ? WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, ['aprobada', id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Rechazar empresa (cambiar estado a rechazada)
  rechazar: (id) => {
    const sql = 'UPDATE empresas SET estado = ? WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, ['rechazada', id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Eliminar empresa
  delete: (id) => {
    const sql = 'DELETE FROM empresas WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // ========== MÉTODOS PARA GESTIONAR USUARIOS DE EMPRESA ==========

  // Agregar usuarios a una empresa
  agregarUsuarios: (empresa_id, usuarios) => {
    if (!usuarios || usuarios.length === 0) {
      return Promise.resolve();
    }

    const sql = `
      INSERT INTO empresa_usuarios (empresa_id, usuario_id) 
      VALUES ?
      ON DUPLICATE KEY UPDATE 
        activo = TRUE, 
        fecha_asignacion = CURRENT_TIMESTAMP
    `;

    // Filtrar usuarios válidos y mapear valores
    const values = usuarios
      .map(usuario => {
        const usuarioId = usuario.usuario_id || usuario.id;
        // Solo incluir si tiene un usuario_id válido
        if (usuarioId && !isNaN(Number(usuarioId))) {
          return [empresa_id, Number(usuarioId)];
        }
        return null;
      })
      .filter(val => val !== null); // Eliminar valores null

    // Si no hay valores válidos, resolver sin hacer nada
    if (values.length === 0) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      db.query(sql, [values], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Agregar un usuario a una empresa
  agregarUsuario: (empresa_id, usuario_id) => {
    // Validar que usuario_id sea un número válido
    if (!usuario_id || isNaN(Number(usuario_id))) {
      return Promise.reject(new Error('usuario_id debe ser un número válido'));
    }

    const sql = `
      INSERT INTO empresa_usuarios (empresa_id, usuario_id) 
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE 
        activo = TRUE, 
        fecha_asignacion = CURRENT_TIMESTAMP
    `;

    return new Promise((resolve, reject) => {
      db.query(sql, [empresa_id, Number(usuario_id)], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Remover un usuario de una empresa
  removerUsuario: (empresa_id, usuario_id) => {
    // Validar que usuario_id sea un número válido
    if (!usuario_id || isNaN(Number(usuario_id))) {
      return Promise.reject(new Error('usuario_id debe ser un número válido'));
    }

    const sql = 'UPDATE empresa_usuarios SET activo = FALSE WHERE empresa_id = ? AND usuario_id = ?';

    return new Promise((resolve, reject) => {
      db.query(sql, [empresa_id, Number(usuario_id)], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Actualizar todos los usuarios de una empresa
  actualizarUsuarios: (empresa_id, usuarios) => {
    return new Promise((resolve, reject) => {
      // Primero desactivar todos los usuarios actuales
      const desactivarSql = 'UPDATE empresa_usuarios SET activo = FALSE WHERE empresa_id = ?';
      
      db.query(desactivarSql, [empresa_id], (err) => {
        if (err) {
          reject(err);
        } else if (usuarios && usuarios.length > 0) {
          // Luego agregar los nuevos usuarios
          Empresa.agregarUsuarios(empresa_id, usuarios)
            .then(resolve)
            .catch(reject);
        } else {
          resolve();
        }
      });
    });
  },

  // Obtener usuarios de una empresa
  obtenerUsuarios: (empresa_id) => {
    const sql = `
      SELECT 
        eu.usuario_id,
        eu.activo,
        eu.fecha_asignacion,
        u.nombre as usuario_nombre,
        u.email as usuario_email
      FROM empresa_usuarios eu
      INNER JOIN users u ON eu.usuario_id = u.id
      WHERE eu.empresa_id = ? AND eu.activo = TRUE
      ORDER BY eu.fecha_asignacion ASC
    `;

    return new Promise((resolve, reject) => {
      db.query(sql, [empresa_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Verificar si un usuario pertenece a una empresa
  usuarioPerteneceA: (empresa_id, usuario_id) => {
    const sql = 'SELECT COUNT(*) as count FROM empresa_usuarios WHERE empresa_id = ? AND usuario_id = ? AND activo = TRUE';

    return new Promise((resolve, reject) => {
      db.query(sql, [empresa_id, usuario_id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count > 0);
      });
    });
  }
};

module.exports = Empresa;

