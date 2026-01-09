require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const residuosRoutes = require('./routes/residuosRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const ufRoutes = require('./routes/ufRoutes');
const cotizacionRoutes = require('./routes/cotizacionRoutes');
const solicitudCotizacionRoutes = require('./routes/solicitudCotizacionRoutes');
const visitaRoutes = require('./routes/visitaRoutes');
const certificadoRoutes = require('./routes/certificadoRoutes');
const contactoRoutes = require('./routes/contactoRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');
const emailRoutes = require('./routes/emailRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());

// Body parser condicional - solo parsear si NO es multipart/form-data
// Esto permite que multer maneje los archivos sin interferencia
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  
  // DEBUG: Log para ver qué Content-Type está llegando
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`[${req.method}] ${req.path} - Content-Type: ${contentType}`);
  }
  
  // Si es multipart/form-data, NO aplicar ningún parser (multer lo manejará)
  if (contentType && contentType.includes('multipart/form-data')) {
    console.log('Saltando body parser para multipart/form-data');
    return next();
  }
  
  // Si es JSON, aplicar parser JSON
  if (contentType && contentType.includes('application/json')) {
    return express.json({ limit: '50mb' })(req, res, next);
  }
  
  // Para otros tipos (incluyendo application/x-www-form-urlencoded), aplicar urlencoded
  // Pero solo si hay Content-Type (evitar parsear GET requests)
  if (contentType && (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('text/plain'))) {
    return express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
  }
  
  // Si no hay Content-Type o es otro tipo, continuar sin parsear
  return next();
});

// Rutas
app.use('/api', userRoutes);
app.use('/api', residuosRoutes);
app.use('/api', empresaRoutes);
app.use('/api', ufRoutes);
app.use('/api', cotizacionRoutes);
app.use('/api', solicitudCotizacionRoutes);
app.use('/api', visitaRoutes);
app.use('/api', certificadoRoutes);
app.use('/api', contactoRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/email', emailRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de FELMART funcionando correctamente' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

