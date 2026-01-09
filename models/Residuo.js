const db = require('../config/db');

const Residuo = {
  // Crear tabla de residuos (ejecutar una sola vez)
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS residuos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        descripcion VARCHAR(200) NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        unidad ENUM('IBC', 'UNIDAD', 'TONELADA', 'TAMBOR', 'KL', 'LT', 'M3') NOT NULL,
        moneda ENUM('UF', 'CLP') DEFAULT 'CLP'
      )
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Actualizar la columna unidad para agregar 'M3' al ENUM
  updateUnidadEnum: () => {
    const sql = `
      ALTER TABLE residuos 
      MODIFY COLUMN unidad ENUM('IBC', 'UNIDAD', 'TONELADA', 'TAMBOR', 'KL', 'LT', 'M3') NOT NULL
    `;
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Crear un nuevo residuo
  create: (residuoData) => {
    const { descripcion, precio, unidad, moneda } = residuoData;
    const sql = 'INSERT INTO residuos (descripcion, precio, unidad, moneda) VALUES (?, ?, ?, ?)';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [descripcion, precio, unidad, moneda || 'CLP'], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Buscar residuo por ID
  findById: (id) => {
    const sql = 'SELECT * FROM residuos WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Obtener todos los residuos
  findAll: () => {
    const sql = 'SELECT * FROM residuos ORDER BY descripcion';
    
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar residuos por unidad
  findByUnidad: (unidad) => {
    const sql = 'SELECT * FROM residuos WHERE unidad = ? ORDER BY descripcion';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [unidad], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar residuos por moneda
  findByMoneda: (moneda) => {
    const sql = 'SELECT * FROM residuos WHERE moneda = ? ORDER BY descripcion';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [moneda], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Buscar por descripción (búsqueda parcial)
  findByDescripcion: (descripcion) => {
    const sql = 'SELECT * FROM residuos WHERE descripcion LIKE ? ORDER BY descripcion';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [`%${descripcion}%`], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Actualizar residuo
  update: (id, residuoData) => {
    const { descripcion, precio, unidad, moneda } = residuoData;
    const sql = 'UPDATE residuos SET descripcion = ?, precio = ?, unidad = ?, moneda = ? WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [descripcion, precio, unidad, moneda, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Eliminar residuo
  delete: (id) => {
    const sql = 'DELETE FROM residuos WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
};

module.exports = Residuo;

