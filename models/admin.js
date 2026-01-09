const db = require('../config/db');
const bcrypt = require('bcryptjs');

const Admin = {
  // Crear tabla de administradores (ejecutar una sola vez)
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Crear un nuevo administrador
  create: async (adminData) => {
    const { email, password } = adminData;
    
    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const sql = 'INSERT INTO admins (email, password) VALUES (?, ?)';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [email, hashedPassword], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Buscar administrador por email
  findByEmail: (email) => {
    const sql = 'SELECT * FROM admins WHERE email = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [email], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Buscar administrador por ID
  findById: (id) => {
    const sql = 'SELECT id, email FROM admins WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Obtener todos los administradores
  findAll: () => {
    const sql = 'SELECT id, email FROM admins';
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Actualizar administrador
  update: async (id, adminData) => {
    const { email, password } = adminData;
    
    let sql = 'UPDATE admins SET email = ?';
    let params = [email];
    
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

  // Eliminar administrador
  delete: (id) => {
    const sql = 'DELETE FROM admins WHERE id = ?';
    
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
  }
};

module.exports = Admin;

