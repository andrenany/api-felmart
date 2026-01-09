const Cotizacion = require('../models/Cotizacion');
const User = require('../models/User');
const Empresa = require('../models/Empresa');
const Residuo = require('../models/Residuo');
const axios = require('axios');
const db = require('../config/db');
const { generarPDFCotizacion } = require('../utils/pdfGenerator');
const { enviarEmailConAdjunto, templateNotificacionCotizacion } = require('../config/email');
const fs = require('fs').promises;
const path = require('path');

// Obtener valor de UF actual
const obtenerValorUF = async () => {
  try {
    const response = await axios.get('https://mindicador.cl/api/uf');
    return response.data.serie[0].valor;
  } catch (error) {
    console.error('Error al obtener UF:', error);
    throw new Error('No se pudo obtener el valor de la UF');
  }
};

// Crear una nueva cotización (solo administrador)
const crearCotizacion = async (req, res) => {
  try {
    const { usuario_id, empresa_id, residuos, observaciones, tipo_cotizacion } = req.body;

    // Validaciones básicas
    if (!residuos || residuos.length === 0) {
      return res.status(400).json({ 
        message: 'Faltan datos requeridos: al menos un residuo' 
      });
    }

    // Si es tipo empresa, requiere empresa_id
    if (tipo_cotizacion === 'empresa' && !empresa_id) {
      return res.status(400).json({ 
        message: 'Para cotizaciones de empresa se requiere empresa_id' 
      });
    }

    // Variables para datos de empresa
    let empresa = null;
    let regionNombre = '';
    let comunaNombre = '';
    let usuarioIdFinal = usuario_id;

    // Si hay empresa_id, obtener datos de la empresa y usuarios asignados
    if (empresa_id) {
      empresa = await Empresa.findById(empresa_id);
      if (!empresa) {
        return res.status(404).json({ message: 'Empresa no encontrada' });
      }

      // Obtener usuarios asignados a la empresa
      const usuariosAsignados = await Empresa.obtenerUsuarios(empresa_id);
      
      if (!usuariosAsignados || usuariosAsignados.length === 0) {
        return res.status(400).json({ 
          message: 'La empresa no tiene usuarios asignados. Debe asignar al menos un usuario a la empresa antes de crear una cotización.' 
        });
      }

      // Si se proporcionó usuario_id, validar que pertenezca a la empresa
      if (usuario_id) {
        const usuarioPertenece = usuariosAsignados.some(u => u.usuario_id === usuario_id);
        if (!usuarioPertenece) {
          return res.status(400).json({ 
            message: `El usuario con ID ${usuario_id} no está asignado a esta empresa. Usuarios asignados: ${usuariosAsignados.map(u => u.usuario_id).join(', ')}` 
          });
        }
        usuarioIdFinal = usuario_id;
      } else {
        // Si no se proporcionó usuario_id, usar el primero de los usuarios asignados
        usuarioIdFinal = usuariosAsignados[0].usuario_id;
      }
    } else {
      // Si no hay empresa_id, usuario_id es obligatorio
      if (!usuario_id) {
        return res.status(400).json({ 
          message: 'Faltan datos requeridos: usuario_id (o empresa_id con usuarios asignados)' 
        });
      }
    }

    // Obtener datos del usuario
    const usuario = await User.findById(usuarioIdFinal);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Si hay empresa_id, obtener nombres de región y comuna de la empresa
    if (empresa_id && empresa) {
      // Obtener nombres de región y comuna
      if (empresa.region_id) {
        const sqlRegion = 'SELECT nombre FROM regiones WHERE id = ?';
        const regionResult = await new Promise((resolve, reject) => {
          db.query(sqlRegion, [empresa.region_id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
        regionNombre = regionResult.length > 0 ? regionResult[0].nombre : '';
      }

      if (empresa.comuna_id) {
        const sqlComuna = 'SELECT nombre FROM comunas WHERE id = ?';
        const comunaResult = await new Promise((resolve, reject) => {
          db.query(sqlComuna, [empresa.comuna_id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
        comunaNombre = comunaResult.length > 0 ? comunaResult[0].nombre : '';
      }
    } else {
      // Si no hay empresa, obtener región y comuna del usuario
      if (usuario.region_id) {
        const sqlRegion = 'SELECT nombre FROM regiones WHERE id = ?';
        const regionResult = await new Promise((resolve, reject) => {
          db.query(sqlRegion, [usuario.region_id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
        regionNombre = regionResult.length > 0 ? regionResult[0].nombre : '';
      }

      if (usuario.comuna_id) {
        const sqlComuna = 'SELECT nombre FROM comunas WHERE id = ?';
        const comunaResult = await new Promise((resolve, reject) => {
          db.query(sqlComuna, [usuario.comuna_id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
        comunaNombre = comunaResult.length > 0 ? comunaResult[0].nombre : '';
      }
    }

    // Obtener valor actual de la UF (usar el enviado o buscarlo)
    let valorUF = req.body.valor_uf;
    if (!valorUF) {
      try {
        valorUF = await obtenerValorUF();
      } catch (error) {
        console.warn('No se pudo obtener UF de API, usando valor por defecto', error);
        valorUF = 38000; // Valor fallback
      }
    }

    // Procesar residuos y calcular totales
    let totalCLP = 0;
    const residuosConvertidos = [];

    for (const item of residuos) {
      const { residuo_id, cantidad, precio_unitario: precioUnitarioOverride, moneda: monedaOverride } = item;

      if (!residuo_id || !cantidad || cantidad <= 0) {
        return res.status(400).json({ 
          message: 'Cada residuo debe tener residuo_id y cantidad válida' 
        });
      }

      // Obtener información del residuo
      const residuo = await Residuo.findById(residuo_id);
      if (!residuo) {
        return res.status(404).json({ 
          message: `Residuo con ID ${residuo_id} no encontrado` 
        });
      }

      // Usar precio personalizado si se proporciona, sino usar el del catálogo
      const precioUnitario = (typeof precioUnitarioOverride === 'number' && precioUnitarioOverride > 0) 
        ? precioUnitarioOverride 
        : residuo.precio;
      
      // Usar moneda personalizada si se proporciona, sino usar la del catálogo
      const monedaOriginal = monedaOverride || residuo.moneda;

      // Validar moneda
      if (monedaOriginal !== 'UF' && monedaOriginal !== 'CLP') {
        return res.status(400).json({ 
          message: `Moneda inválida: ${monedaOriginal}. Debe ser 'UF' o 'CLP'` 
        });
      }

      let precioUnitarioCLP;
      
      // Convertir precio a CLP si está en UF
      if (monedaOriginal === 'UF') {
        precioUnitarioCLP = precioUnitario * valorUF;
      } else {
        precioUnitarioCLP = precioUnitario;
      }

      const subtotalCLP = precioUnitarioCLP * cantidad;
      totalCLP += subtotalCLP;

      residuosConvertidos.push({
        residuo_id: residuo.id,
        residuo_descripcion: residuo.descripcion,
        cantidad: cantidad,
        precio_unitario: precioUnitario,
        moneda_original: monedaOriginal,
        precio_unitario_clp: precioUnitarioCLP,
        subtotal_clp: subtotalCLP,
        unidad: residuo.unidad
      });
    }

    // Crear la cotización
    const cotizacionData = {
      usuario_id: usuarioIdFinal,
      usuario_nombre: usuario.nombre,
      empresa_id: empresa ? empresa.id : null,
      empresa_rut: empresa ? empresa.rut : null,
      empresa_nombre: empresa ? empresa.nombre : null,
      empresa_direccion: empresa ? (empresa.direccion || '') : (usuario.direccion || ''),
      empresa_region: regionNombre,
      empresa_comuna: comunaNombre,
      valor_uf: valorUF,
      total_clp: totalCLP,
      observaciones: observaciones || '',
      admin_id: req.admin.id,
      tipo_cotizacion: tipo_cotizacion || (empresa ? 'empresa' : 'usuario'),
      residuos: residuosConvertidos
    };

    const resultado = await Cotizacion.create(cotizacionData);

    // Obtener la cotización completa con residuos para el PDF
    const cotizacionCompleta = await Cotizacion.findById(resultado.id);

    // Generar PDF y enviar email al usuario
    let emailEnviado = false;
    try {
      // Generar PDF
      const rutaPDF = await generarPDFCotizacion(cotizacionCompleta);

      // Preparar datos para el email
      const totalUF = valorUF > 0 ? totalCLP / valorUF : null;
      const contenidoEmail = templateNotificacionCotizacion(
        usuario.nombre,
        resultado.numero_cotizacion,
        totalCLP,
        totalUF,
        cotizacionCompleta.fecha_cotizacion,
        cotizacionData.tipo_cotizacion,
        empresa ? empresa.nombre : null
      );

      // Adjunto PDF
      const adjunto = {
        filename: `cotizacion-${resultado.numero_cotizacion}.pdf`,
        path: rutaPDF,
        contentType: 'application/pdf'
      };

      // Enviar email
      const emailResult = await enviarEmailConAdjunto(
        usuario.email,
        `💰 Nueva Cotización ${resultado.numero_cotizacion} - FELMART`,
        contenidoEmail,
        adjunto
      );

      if (emailResult.success) {
        emailEnviado = true;
        console.log(`✅ Email enviado exitosamente a ${usuario.email}`);
      } else {
        console.error(`❌ Error al enviar email: ${emailResult.error}`);
      }

      // Opcional: Limpiar archivo PDF después de enviar
      await fs.unlink(rutaPDF).catch(e => console.warn('Error borrando PDF temporal:', e.message));

    } catch (emailError) {
      console.error('Error al generar PDF o enviar email:', emailError);
      // No fallar la creación de la cotización si el email falla
    }

    res.status(201).json({
      message: 'Cotización creada exitosamente',
      cotizacion: {
        id: resultado.id,
        numero_cotizacion: resultado.numero_cotizacion,
        total_clp: totalCLP,
        valor_uf: valorUF,
        tipo: cotizacionData.tipo_cotizacion
      },
      email_enviado: emailEnviado
    });

  } catch (error) {
    console.error('Error al crear cotización:', error);
    res.status(500).json({ message: 'Error al crear la cotización', error: error.message });
  }
};

// Solicitar cotización (público - sin autenticación)
const solicitarCotizacion = async (req, res) => {
  try {
    const SolicitudCotizacion = require('../models/SolicitudCotizacion');
    
    // Mapear los campos del body a los campos del modelo
    const solicitudData = {
      tipo_solicitud: req.body.tipo_solicitud || 'usuario',
      nombre_solicitante: req.body.nombre_usuario || req.body.nombre_solicitante,
      email: req.body.email_usuario || req.body.email,
      telefono: req.body.telefono_usuario || req.body.telefono,
      empresa_nombre: req.body.empresa_nombre,
      empresa_rut: req.body.empresa_rut,
      empresa_giro: req.body.empresa_giro,
      direccion: req.body.empresa_direccion || req.body.direccion,
      region_id: req.body.region_id,
      comuna_id: req.body.comuna_id,
      descripcion_residuos: Array.isArray(req.body.residuos_solicitados) 
        ? req.body.residuos_solicitados.map(r => `${r.tipo}: ${r.cantidad}`).join(', ')
        : req.body.descripcion_residuos || JSON.stringify(req.body.residuos_solicitados),
      cantidad_estimada: req.body.cantidad_estimada,
      frecuencia_retiro: req.body.frecuencia_retiro,
      frecuencia_detalle: req.body.frecuencia_detalle,
      observaciones: req.body.observaciones,
      urgencia: req.body.urgencia || 'media'
    };

    // Crear solicitud usando el modelo
    const result = await SolicitudCotizacion.create(solicitudData);

    res.status(201).json({
      message: 'Solicitud de cotización enviada exitosamente',
      solicitud_id: result.id,
      numero_solicitud: result.numero_solicitud,
      info: 'Un administrador revisará tu solicitud y te contactará pronto'
    });

  } catch (error) {
    console.error('Error al solicitar cotización:', error);
    res.status(500).json({ message: 'Error al enviar la solicitud', error: error.message });
  }
};

// Obtener todas las cotizaciones (solo admin)
const obtenerCotizaciones = async (req, res) => {
  try {
    const cotizaciones = await Cotizacion.findAll();
    res.json({ cotizaciones });
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    res.status(500).json({ message: 'Error al obtener las cotizaciones' });
  }
};

// Obtener cotización por ID (usuario asignado o admin)
const obtenerCotizacionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const cotizacion = await Cotizacion.findById(id);

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Verificar permisos: solo el usuario asignado o admin puede ver
    const usuario_id = req.user.id;
    const esAdmin = req.user.role === 'admin';

    if (!esAdmin && cotizacion.usuario_id !== usuario_id) {
      return res.status(403).json({ 
        message: 'No tienes permiso para ver esta cotización' 
      });
    }

    res.json({ cotizacion });
  } catch (error) {
    console.error('Error al obtener cotización:', error);
    res.status(500).json({ message: 'Error al obtener la cotización' });
  }
};

// Obtener cotización por número (solo admin)
const obtenerCotizacionPorNumero = async (req, res) => {
  try {
    const { numero } = req.params;
    const cotizacion = await Cotizacion.findByNumero(numero);

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    res.json({ cotizacion });
  } catch (error) {
    console.error('Error al obtener cotización:', error);
    res.status(500).json({ message: 'Error al obtener la cotización' });
  }
};

// Obtener cotizaciones del usuario autenticado
const obtenerMisCotizaciones = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const cotizaciones = await Cotizacion.findByUsuario(usuario_id);
    res.json({ cotizaciones });
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    res.status(500).json({ message: 'Error al obtener las cotizaciones' });
  }
};

// Obtener cotizaciones por estado (solo admin)
const obtenerCotizacionesPorEstado = async (req, res) => {
  try {
    const { estado } = req.params;

    if (!['pendiente', 'aceptada', 'rechazada'].includes(estado)) {
      return res.status(400).json({ 
        message: 'Estado inválido. Valores permitidos: pendiente, aceptada, rechazada' 
      });
    }

    const cotizaciones = await Cotizacion.findByEstado(estado);
    res.json({ cotizaciones });
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    res.status(500).json({ message: 'Error al obtener las cotizaciones' });
  }
};

// Aceptar cotización (usuario autenticado)
const aceptarCotizacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    // Verificar que la cotización existe y pertenece al usuario
    const cotizacion = await Cotizacion.findById(id);

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    if (cotizacion.usuario_id !== usuario_id) {
      return res.status(403).json({ 
        message: 'No tienes permiso para modificar esta cotización' 
      });
    }

    if (cotizacion.estado !== 'pendiente') {
      return res.status(400).json({ 
        message: `Esta cotización ya fue ${cotizacion.estado}` 
      });
    }

    await Cotizacion.aceptar(id);

    res.json({ 
      message: 'Cotización aceptada exitosamente',
      cotizacion_id: id,
      estado: 'aceptada'
    });

  } catch (error) {
    console.error('Error al aceptar cotización:', error);
    res.status(500).json({ message: 'Error al aceptar la cotización' });
  }
};

// Rechazar cotización (usuario autenticado)
const rechazarCotizacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    // Verificar que la cotización existe y pertenece al usuario
    const cotizacion = await Cotizacion.findById(id);

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    if (cotizacion.usuario_id !== usuario_id) {
      return res.status(403).json({ 
        message: 'No tienes permiso para modificar esta cotización' 
      });
    }

    if (cotizacion.estado !== 'pendiente') {
      return res.status(400).json({ 
        message: `Esta cotización ya fue ${cotizacion.estado}` 
      });
    }

    await Cotizacion.rechazar(id);

    res.json({ 
      message: 'Cotización rechazada exitosamente',
      cotizacion_id: id,
      estado: 'rechazada'
    });

  } catch (error) {
    console.error('Error al rechazar cotización:', error);
    res.status(500).json({ message: 'Error al rechazar la cotización' });
  }
};

// Eliminar cotización (solo administrador)
const eliminarCotizacion = async (req, res) => {
  try {
    const { id } = req.params;

    const cotizacion = await Cotizacion.findById(id);
    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    await Cotizacion.delete(id);

    res.json({ message: 'Cotización eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar cotización:', error);
    res.status(500).json({ message: 'Error al eliminar la cotización' });
  }
};

// Obtener todas las solicitudes de cotización (solo administrador)
const obtenerSolicitudes = async (req, res) => {
  try {
    const sql = 'SELECT * FROM solicitudes_cotizacion ORDER BY fecha_solicitud DESC';
    
    const solicitudes = await new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Parsear los residuos solicitados de JSON
    const solicitudesParsed = solicitudes.map(s => ({
      ...s,
      residuos_solicitados: s.residuos_solicitados ? JSON.parse(s.residuos_solicitados) : []
    }));

    res.json({ solicitudes: solicitudesParsed });

  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ message: 'Error al obtener las solicitudes' });
  }
};

// Descargar PDF de cotización
const descargarPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const cotizacion = await Cotizacion.findById(id);

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Verificar permisos
    const usuario_id = req.user.id;
    const esAdmin = req.user.role === 'admin';

    if (!esAdmin && cotizacion.usuario_id !== usuario_id) {
      return res.status(403).json({ 
        message: 'No tienes permiso para descargar esta cotización' 
      });
    }

    // Generar PDF al vuelo
    const rutaPDF = await generarPDFCotizacion(cotizacion);
    
    // Enviar archivo
    res.download(rutaPDF, `Cotización ${cotizacion.numero_cotizacion}.pdf`, async (err) => {
      if (err) {
        console.error('Error al enviar archivo PDF:', err);
      }
      // Eliminar archivo temporal después de enviar
      try {
        await fs.unlink(rutaPDF);
      } catch (unlinkError) {
        console.warn('Error al eliminar PDF temporal:', unlinkError);
      }
    });

  } catch (error) {
    console.error('Error al descargar PDF:', error);
    res.status(500).json({ message: 'Error al generar el PDF' });
  }
};

module.exports = {
  crearCotizacion,
  solicitarCotizacion,
  obtenerCotizaciones,
  obtenerCotizacionPorId,
  obtenerCotizacionPorNumero,
  obtenerMisCotizaciones,
  obtenerCotizacionesPorEstado,
  aceptarCotizacion,
  rechazarCotizacion,
  eliminarCotizacion,
  obtenerSolicitudes,
  descargarPDF
};

