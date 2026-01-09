require('dotenv').config();
const Residuo = require('../models/Residuo');
const preciosIniciales = require('./residuosData');

// Script para poblar la tabla de residuos
const seedResiduos = async () => {
  try {
    console.log('♻️  Iniciando carga de residuos...\n');
    
    let count = 0;
    for (const residuo of preciosIniciales) {
      // No incluir el campo 'id' en el insert (se auto-incrementa)
      const { id, ...residuoData } = residuo;
      
      await Residuo.create(residuoData);
      count++;
      console.log(`✅ Residuo ${count}/${preciosIniciales.length}: ${residuo.descripcion} - $${residuo.precio} ${residuo.moneda} por ${residuo.unidad}`);
    }
    
    console.log(`\n🎉 ¡${count} residuos cargados exitosamente!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cargar residuos:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Ejecutar el seed
seedResiduos();

