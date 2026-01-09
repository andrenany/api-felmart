require('dotenv').config();
const Region = require('../models/region');
const Comuna = require('../models/Comuna');

// Regiones de Chile
const regionesChile = [
  { nombre: 'Región de Arica y Parinacota' },
  { nombre: 'Región de Tarapacá' },
  { nombre: 'Región de Antofagasta' },
  { nombre: 'Región de Atacama' },
  { nombre: 'Región de Coquimbo' },
  { nombre: 'Región de Valparaíso' },
  { nombre: 'Región Metropolitana' },
  { nombre: 'Región del Libertador Bernardo O\'Higgins' },
  { nombre: 'Región del Maule' },
  { nombre: 'Región de Ñuble' },
  { nombre: 'Región del Biobío' },
  { nombre: 'Región de La Araucanía' },
  { nombre: 'Región de Los Ríos' },
  { nombre: 'Región de Los Lagos' },
  { nombre: 'Región de Aysén' },
  { nombre: 'Región de Magallanes' }
];

// Script para poblar las tablas de regiones y comunas
const seedData = async () => {
  try {
    console.log('🌱 Iniciando carga de datos...\n');
    
    // Primero cargar regiones
    console.log('🗺️  Cargando regiones...');
    const regionIds = {};
    
    for (const region of regionesChile) {
      const result = await Region.create(region);
      regionIds[region.nombre] = result.insertId;
      console.log(`✅ Región creada: ${region.nombre}`);
    }
    
    console.log(`\n📦 Cargando comunas...\n`);
    
    // Luego cargar comunas asociadas a regiones
    const comunas = [
      // Región Metropolitana
      { nombre: 'Santiago', region_id: regionIds['Región Metropolitana'] },
      { nombre: 'Providencia', region_id: regionIds['Región Metropolitana'] },
      { nombre: 'Las Condes', region_id: regionIds['Región Metropolitana'] },
      { nombre: 'Maipú', region_id: regionIds['Región Metropolitana'] },
      { nombre: 'La Florida', region_id: regionIds['Región Metropolitana'] },
      { nombre: 'Puente Alto', region_id: regionIds['Región Metropolitana'] },
      { nombre: 'Ñuñoa', region_id: regionIds['Región Metropolitana'] },
      
      // Región de Valparaíso
      { nombre: 'Valparaíso', region_id: regionIds['Región de Valparaíso'] },
      { nombre: 'Viña del Mar', region_id: regionIds['Región de Valparaíso'] },
      { nombre: 'Concón', region_id: regionIds['Región de Valparaíso'] },
      { nombre: 'Quilpué', region_id: regionIds['Región de Valparaíso'] },
      
      // Región del Biobío
      { nombre: 'Concepción', region_id: regionIds['Región del Biobío'] },
      { nombre: 'Talcahuano', region_id: regionIds['Región del Biobío'] },
      { nombre: 'Los Ángeles', region_id: regionIds['Región del Biobío'] },
      
      // Región de Antofagasta
      { nombre: 'Antofagasta', region_id: regionIds['Región de Antofagasta'] },
      { nombre: 'Calama', region_id: regionIds['Región de Antofagasta'] },
      
      // Región de Coquimbo
      { nombre: 'La Serena', region_id: regionIds['Región de Coquimbo'] },
      { nombre: 'Coquimbo', region_id: regionIds['Región de Coquimbo'] },
      
      // Región de La Araucanía
      { nombre: 'Temuco', region_id: regionIds['Región de La Araucanía'] },
      { nombre: 'Villarrica', region_id: regionIds['Región de La Araucanía'] },
      { nombre: 'Pucón', region_id: regionIds['Región de La Araucanía'] },
      { nombre: 'Angol', region_id: regionIds['Región de La Araucanía'] },
      { nombre: 'Victoria', region_id: regionIds['Región de La Araucanía'] },
      { nombre: 'Lautaro', region_id: regionIds['Región de La Araucanía'] },
      { nombre: 'Nueva Imperial', region_id: regionIds['Región de La Araucanía'] },
      { nombre: 'Pitrufquén', region_id: regionIds['Región de La Araucanía'] },
      
      // Región de Los Ríos
      { nombre: 'Valdivia', region_id: regionIds['Región de Los Ríos'] },
      { nombre: 'La Unión', region_id: regionIds['Región de Los Ríos'] },
      { nombre: 'Río Bueno', region_id: regionIds['Región de Los Ríos'] },
      { nombre: 'Paillaco', region_id: regionIds['Región de Los Ríos'] },
      { nombre: 'Panguipulli', region_id: regionIds['Región de Los Ríos'] },
      { nombre: 'Lanco', region_id: regionIds['Región de Los Ríos'] },
      { nombre: 'Mariquina', region_id: regionIds['Región de Los Ríos'] },
      { nombre: 'Futrono', region_id: regionIds['Región de Los Ríos'] },
      
      // Región de Los Lagos
      { nombre: 'Puerto Montt', region_id: regionIds['Región de Los Lagos'] },
      { nombre: 'Osorno', region_id: regionIds['Región de Los Lagos'] },
      { nombre: 'Puerto Varas', region_id: regionIds['Región de Los Lagos'] },
      { nombre: 'Castro', region_id: regionIds['Región de Los Lagos'] },
      { nombre: 'Ancud', region_id: regionIds['Región de Los Lagos'] },
      { nombre: 'Chonchi', region_id: regionIds['Región de Los Lagos'] },
      { nombre: 'Dalcahue', region_id: regionIds['Región de Los Lagos'] },
      { nombre: 'Quellón', region_id: regionIds['Región de Los Lagos'] },
      { nombre: 'Calbuco', region_id: regionIds['Región de Los Lagos'] },
      { nombre: 'Frutillar', region_id: regionIds['Región de Los Lagos'] },
      { nombre: 'Llanquihue', region_id: regionIds['Región de Los Lagos'] },
      { nombre: 'Maullín', region_id: regionIds['Región de Los Lagos'] },
      { nombre: 'San Juan de la Costa', region_id: regionIds['Región de Los Lagos'] }
    ];
    
    for (const comuna of comunas) {
      await Comuna.create(comuna);
      const region = regionesChile.find(r => regionIds[r.nombre] === comuna.region_id);
      console.log(`✅ Comuna creada: ${comuna.nombre} (${region.nombre})`);
    }
    
    console.log(`\n🎉 ¡${regionesChile.length} regiones y ${comunas.length} comunas cargadas exitosamente!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cargar datos:', error.message);
    process.exit(1);
  }
};

// Ejecutar el seed
seedData();

