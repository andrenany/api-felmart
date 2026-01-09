require('dotenv').config();
const db = require('../config/db');

// Script para eliminar todas las tablas de la base de datos
const dropDatabase = async () => {
  try {
    console.log('⚠️  ADVERTENCIA: Este script eliminará TODAS las tablas y sus datos\n');
    console.log('🔄 Iniciando eliminación de tablas...\n');

    // Desactivar verificación de foreign keys temporalmente
    await new Promise((resolve, reject) => {
      db.query('SET FOREIGN_KEY_CHECKS = 0', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Lista de tablas a eliminar en orden (primero las que tienen FK, luego las referenciadas)
    const tables = [
      'notificaciones',
      'certificados',
      'solicitudes_cotizacion', 
      'visitas',
      'cotizacion_residuos',
      'cotizaciones',
      'empresa_usuarios',
      'empresas', 
      'residuos', 
      'admins', 
      'users', 
      'comunas', 
      'regiones'
    ];

    for (const table of tables) {
      try {
        await new Promise((resolve, reject) => {
          db.query(`DROP TABLE IF EXISTS ${table}`, (err, result) => {
            if (err) reject(err);
            else {
              console.log(`✅ Tabla '${table}' eliminada`);
              resolve(result);
            }
          });
        });
      } catch (error) {
        console.log(`⚠️  Error al eliminar tabla '${table}':`, error.message);
      }
    }

    // Reactivar verificación de foreign keys
    await new Promise((resolve, reject) => {
      db.query('SET FOREIGN_KEY_CHECKS = 1', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('\n🎉 ¡Base de datos limpiada exitosamente!');
    console.log('\n📝 Ahora puedes ejecutar:');
    console.log('   npm run init-db       (para crear las tablas)');
    console.log('   npm run seed-data     (para cargar datos de ejemplo)');
    console.log('   npm run create-admin  (para crear un administrador)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error.message);
    process.exit(1);
  }
};

// Ejecutar
dropDatabase();

