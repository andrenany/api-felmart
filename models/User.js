const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  // Crear tabla de usuarios (ejecutar una sola vez)
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        direccion VARCHAR(255),
        telefono VARCHAR(20) NULL,
        region_id INT,
        comuna_id INT,
        password_reset_token VARCHAR(255) NULL,
        password_reset_expires DATETIME NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (region_id) REFERENCES regiones(id) ON DELETE SET NULL,
        FOREIGN KEY (comuna_id) REFERENCES comunas(id) ON DELETE SET NULL
      )
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Crear un nuevo usuario
  create: async (userData) => {
    const { nombre, email, password, direccion, telefono, region_id, comuna_id } = userData;
    
    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const sql = 'INSERT INTO users (nombre, email, password, direccion, telefono, region_id, comuna_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [nombre, email, hashedPassword, direccion, telefono, region_id, comuna_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Buscar usuario por email
  findByEmail: (email) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [email], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Buscar usuario por ID
  findById: (id) => {
    const sql = 'SELECT id, nombre, email, direccion, telefono, region_id, comuna_id FROM users WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Obtener todos los usuarios
  findAll: () => {
    const sql = 'SELECT id, nombre, email, direccion, telefono, region_id, comuna_id FROM users';
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Actualizar usuario
  update: async (id, userData) => {
    const { nombre, email, password, direccion, telefono, region_id, comuna_id } = userData;
    
    let sql = 'UPDATE users SET nombre = ?, email = ?, direccion = ?, telefono = ?, region_id = ?, comuna_id = ?';
    let params = [nombre, email, direccion, telefono, region_id, comuna_id];
    
    // Si se proporciona nueva contraseña, encriptarla
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      sql += ', password = ?';
      params.push(hashedPassword);
    }
    
    sql += ' WHERE id = ?';
    params.push(id);
    
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Eliminar usuario
  delete: (id) => {
    const sql = 'DELETE FROM users WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Comparar contraseña (para login)
  comparePassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  },

  // Generar token de recuperación de contraseña (Código de 6 caracteres)
  generatePasswordResetToken: async (email) => {
    const crypto = require('crypto');
    // Generar 3 bytes = 6 caracteres hex (suficiente para código corto y seguro por 1 hora)
    const token = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    const sql = `
      UPDATE users 
      SET password_reset_token = ?, password_reset_expires = ? 
      WHERE email = ?
    `;

    return new Promise((resolve, reject) => {
      db.query(sql, [token, expiresAt, email], (err, result) => {
        if (err) reject(err);
        else resolve({ token, expiresAt });
      });
    });
  },

  // Verificar token de recuperación
  verifyPasswordResetToken: (token) => {
    const sql = `
      SELECT id, email, password_reset_expires 
      FROM users 
      WHERE password_reset_token = ? AND password_reset_expires > NOW()
    `;

    return new Promise((resolve, reject) => {
      db.query(sql, [token], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Actualizar contraseña con token
  updatePasswordWithToken: async (token, newPassword) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const sql = `
      UPDATE users 
      SET password = ?, password_reset_token = NULL, password_reset_expires = NULL 
      WHERE password_reset_token = ? AND password_reset_expires > NOW()
    `;

    return new Promise((resolve, reject) => {
      db.query(sql, [hashedPassword, token], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Limpiar token de recuperación
  clearPasswordResetToken: (email) => {
    const sql = `
      UPDATE users 
      SET password_reset_token = NULL, password_reset_expires = NULL 
      WHERE email = ?
    `;

    return new Promise((resolve, reject) => {
      db.query(sql, [email], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Actualizar solo la contraseña del usuario
  updatePassword: async (id, newPassword) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const sql = 'UPDATE users SET password = ? WHERE id = ?';

    return new Promise((resolve, reject) => {
      db.query(sql, [hashedPassword, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
};

module.exports = User;

