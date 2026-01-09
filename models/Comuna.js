const db = require('../config/db');

const Comuna = {
  // Crear tabla de comunas (ejecutar una sola vez)
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS comunas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        region_id INT,
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

  // Crear una nueva comuna
  create: (comunaData) => {
    const { nombre, region_id } = comunaData;
    const sql = 'INSERT INTO comunas (nombre, region_id) VALUES (?, ?)';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [nombre, region_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Buscar comuna por ID
  findById: (id) => {
    const sql = 'SELECT * FROM comunas WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Obtener todas las comunas
  findAll: () => {
    const sql = 'SELECT * FROM comunas ORDER BY nombre';
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar comunas por región
  findByRegion: (region_id) => {
    const sql = 'SELECT * FROM comunas WHERE region_id = ? ORDER BY nombre';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [region_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Actualizar comuna
  update: (id, comunaData) => {
    const { nombre, region_id } = comunaData;
    const sql = 'UPDATE comunas SET nombre = ?, region_id = ? WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [nombre, region_id, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Eliminar comuna
  delete: (id) => {
    const sql = 'DELETE FROM comunas WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
};

module.exports = Comuna;

