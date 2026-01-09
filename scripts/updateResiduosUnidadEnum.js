require('dotenv').config();
const Residuo = require('../models/Residuo');

// Script para actualizar el ENUM de la columna unidad en la tabla residuos
const updateUnidadEnum = async () => {
  try {
    console.log('🔄 Actualizando ENUM de la columna unidad en tabla residuos...\n');
    
    await Residuo.updateUnidadEnum();
    
    console.log('✅ ENUM actualizado exitosamente. La columna unidad ahora acepta: IBC, UNIDAD, TONELADA, TAMBOR, KL, LT, M3');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al actualizar ENUM:', error.message);
    console.error('🔍 Detalles del error:', error);
    process.exit(1);
  }
};

// Ejecutar la actualización
updateUnidadEnum();
