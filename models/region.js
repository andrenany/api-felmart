const db = require('../config/db');

const Region = {
  // Crear tabla de regiones (ejecutar una sola vez)
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS regiones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL
      )
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Crear una nueva región
  create: (regionData) => {
    const { nombre } = regionData;
    const sql = 'INSERT INTO regiones (nombre) VALUES (?)';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [nombre], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Buscar región por ID
  findById: (id) => {
    const sql = 'SELECT * FROM regiones WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Obtener todas las regiones
  findAll: () => {
    const sql = 'SELECT * FROM regiones ORDER BY nombre';
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Actualizar región
  update: (id, regionData) => {
    const { nombre } = regionData;
    const sql = 'UPDATE regiones SET nombre = ? WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [nombre, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Eliminar región
  delete: (id) => {
    const sql = 'DELETE FROM regiones WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
};

module.exports = Region;

