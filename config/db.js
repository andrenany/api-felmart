const mysql = require('mysql2');

// Configuración de la conexión a MySQL usando variables de entorno
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'FELMART',
  port: process.env.DB_PORT || 3306
});

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('❌ Error al conectar a MySQL:', err.message);
    return;
  }
  console.log('✅ Conexión exitosa a MySQL - Base de datos:', process.env.DB_NAME);
});

module.exports = connection;

