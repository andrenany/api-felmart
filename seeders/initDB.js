require('dotenv').config();
const Region = require('../models/region');
const Comuna = require('../models/Comuna');
const User = require('../models/User');
const Admin = require('../models/admin');
const Empresa = require('../models/Empresa');
const Residuo = require('../models/Residuo');
const Cotizacion = require('../models/Cotizacion');
const Visita = require('../models/Visita');
const Certificado = require('../models/Certificado');
const SolicitudCotizacion = require('../models/SolicitudCotizacion');
const Notificacion = require('../models/Notificacion');

// Script para inicializar las tablas de la base de datos
const initDatabase = async () => {
  try {
    console.log('🔄 Iniciando creación de tablas...\n');
    
    // 1. Crear tabla de regiones (sin dependencias)
    console.log('🗺️  Creando tabla regiones...');
    await Region.createTable();
    console.log('✅ Tabla regiones creada exitosamente\n');
    
    // 2. Crear tabla de comunas (FK a regiones)
    console.log('📦 Creando tabla comunas...');
    await Comuna.createTable();
    console.log('✅ Tabla comunas creada exitosamente\n');
    
    // 3. Crear tabla de usuarios (FK a regiones y comunas)
    console.log('👥 Creando tabla users...');
    await User.createTable();
    console.log('✅ Tabla users creada exitosamente\n');
    
    // 4. Crear tabla de administradores (sin dependencias)
    console.log('🔑 Creando tabla admins...');
    await Admin.createTable();
    console.log('✅ Tabla admins creada exitosamente\n');
    
    // 5. Crear tabla de empresas (FK a regiones y comunas)
    console.log('🏢 Creando tabla empresas...');
    await Empresa.createTable();
    console.log('✅ Tabla empresas creada exitosamente\n');
    
    // 6. Crear tabla de relación empresa-usuarios (FK a empresas y users)
    console.log('🔗 Creando tabla empresa_usuarios...');
    await Empresa.createEmpresaUsuarioTable();
    console.log('✅ Tabla empresa_usuarios creada exitosamente\n');
    
    // 7. Crear tabla de residuos (sin dependencias)
    console.log('♻️  Creando tabla residuos...');
    await Residuo.createTable();
    console.log('✅ Tabla residuos creada exitosamente\n');
    
    // 8. Crear tabla de cotizaciones (FK a users, empresas, admins)
    console.log('💰 Creando tabla cotizaciones...');
    await Cotizacion.createTable();
    console.log('✅ Tabla cotizaciones creada exitosamente\n');
    
    // 9. Crear tabla de detalle de cotizaciones (FK a cotizaciones y residuos)
    console.log('📋 Creando tabla cotizacion_residuos...');
    await Cotizacion.createDetalleTable();
    console.log('✅ Tabla cotizacion_residuos creada exitosamente\n');
    
    // 10. Crear tabla de visitas (FK a users, empresas, admins, cotizaciones)
    console.log('🏠 Creando tabla visitas...');
    await Visita.createTable();
    console.log('✅ Tabla visitas creada exitosamente\n');
    
    // 11. Crear tabla de certificados (FK a users, empresas, visitas, admins)
    console.log('📜 Creando tabla certificados...');
    await Certificado.createTable();
    console.log('✅ Tabla certificados creada exitosamente\n');
    
    // 12. Crear tabla de solicitudes de cotización públicas
    console.log('📝 Creando tabla solicitudes_cotizacion...');
    await SolicitudCotizacion.createTable();
    console.log('✅ Tabla solicitudes_cotizacion creada exitosamente\n');
    
    // 13. Crear tabla de notificaciones
    console.log('🔔 Creando tabla notificaciones...');
    await Notificacion.createTable();
    console.log('✅ Tabla notificaciones creada exitosamente\n');
    
    console.log('🎉 ¡Base de datos inicializada correctamente!');
    console.log('\n📊 Tablas creadas:');
    console.log('   • regiones');
    console.log('   • comunas');
    console.log('   • users');
    console.log('   • admins');
    console.log('   • empresas');
    console.log('   • empresa_usuarios');
    console.log('   • residuos');
    console.log('   • cotizaciones');
    console.log('   • cotizacion_residuos');
    console.log('   • visitas');
    console.log('   • certificados');
    console.log('   • solicitudes_cotizacion');
    console.log('   • notificaciones');
    console.log('\n📝 Puedes empezar a usar las tablas ahora.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    console.error('🔍 Detalles del error:', error);
    process.exit(1);
  }
};

// Ejecutar la inicialización
initDatabase();

