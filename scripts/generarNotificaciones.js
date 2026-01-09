require('dotenv').config();
const Notificacion = require('../models/Notificacion');

// Script para generar notificaciones automáticas
const generarNotificaciones = async () => {
  try {
    console.log('🔔 Iniciando generación de notificaciones automáticas...\n');
    
    const resultado = await Notificacion.generarNotificacionesAutomaticas();
    
    console.log('✅ Notificaciones generadas exitosamente:');
    console.log(`   📝 Solicitudes pendientes: ${resultado.solicitudes_generadas}`);
    console.log(`   🏠 Visitas próximas: ${resultado.visitas_generadas}`);
    console.log(`   🏢 Empresas pendientes: ${resultado.empresas_generadas}`);
    console.log(`   💰 Cotizaciones vencidas: ${resultado.cotizaciones_generadas}`);
    
    // Limpiar notificaciones expiradas
    console.log('\n🧹 Limpiando notificaciones expiradas...');
    const limpieza = await Notificacion.eliminarExpiradas();
    console.log(`   ✅ ${limpieza.affectedRows} notificaciones expiradas eliminadas`);
    
    console.log('\n🎉 Proceso completado exitosamente!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generando notificaciones:', error.message);
    console.error('🔍 Detalles:', error);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  generarNotificaciones();
}

module.exports = generarNotificaciones;
