require('dotenv').config();
const Admin = require('../models/admin');

// Script para crear un administrador
const createAdmin = async () => {
  try {
    console.log('🔐 Creando administrador...\n');

    // Datos del administrador
    const adminData = {
      email: 'felmartoilspa@gmail.com',
      password: 'admin123'  // Cambiar por una contraseña segura
    };

    // Verificar si ya existe
    const existingAdmin = await Admin.findByEmail(adminData.email);
    if (existingAdmin) {
      console.log('⚠️  El administrador ya existe con el email:', adminData.email);
      process.exit(0);
    }

    // Crear administrador
    const result = await Admin.create(adminData);

    console.log('✅ Administrador creado exitosamente!');
    console.log('\n📧 Email:', adminData.email);
    console.log('🔑 Contraseña:', adminData.password);
    console.log('🆔 ID:', result.insertId);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear administrador:', error.message);
    process.exit(1);
  }
};

// Ejecutar
createAdmin();

