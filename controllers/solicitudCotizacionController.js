const SolicitudCotizacion = require('../models/SolicitudCotizacion');
const Cotizacion = require('../models/Cotizacion');
const User = require('../models/User');
const Empresa = require('../models/Empresa');
const Residuo = require('../models/Residuo');
const axios = require('axios');

const { enviarEmailConAdjunto, templateNotificacionCotizacion } = require('../config/email');
const { generarPDFCotizacion } = require('../utils/pdfGenerator');
const fs = require('fs').promises;

// Crear solicitud pública (sin autenticación)
const crearSolicitudPublica = async (req, res) => {
  try {
    const solicitudData = req.body;

    // Validaciones básicas
    if (!solicitudData.nombre_solicitante || !solicitudData.email || 
        !solicitudData.direccion || !solicitudData.descripcion_residuos) {
      return res.status(400).json({
        message: 'Los campos obligatorios son: nombre, email, dirección y descripción de residuos'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(solicitudData.email)) {
      return res.status(400).json({
        message: 'El formato del email no es válido'
      });
    }

    // Crear solicitud
    const result = await SolicitudCotizacion.create(solicitudData);

    res.status(201).json({
      message: 'Solicitud de cotización enviada exitosamente',
      numero_solicitud: result.numero_solicitud,
      id: result.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al crear solicitud de cotización',
      error: error.message
    });
  }
};

// Obtener todas las solicitudes (solo admin)
const obtenerSolicitudes = async (req, res) => {
  try {
    const { estado, tipo, pagina = 1, limite = 10 } = req.query;
    
    let solicitudes;
    
    if (estado) {
      solicitudes = await SolicitudCotizacion.findByEstado(estado);
    } else if (tipo) {
      solicitudes = await SolicitudCotizacion.findByTipo(tipo);
    } else {
      solicitudes = await SolicitudCotizacion.findAll();
    }

    // Paginación simple
    const inicio = (pagina - 1) * limite;
    const fin = inicio + parseInt(limite);
    const solicitudesPaginadas = solicitudes.slice(inicio, fin);

    res.status(200).json({
      solicitudes: solicitudesPaginadas,
      total: solicitudes.length,
      pagina: parseInt(pagina),
      limite: parseInt(limite),
      totalPaginas: Math.ceil(solicitudes.length / limite)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al obtener solicitudes',
      error: error.message
    });
  }
};

// Obtener solicitud por ID (solo admin)
const obtenerSolicitudPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const solicitud = await SolicitudCotizacion.findById(id);

    if (!solicitud) {
      return res.status(404).json({
        message: 'Solicitud no encontrada'
      });
    }

    res.status(200).json({ solicitud });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al obtener solicitud',
      error: error.message
    });
  }
};

// Obtener solicitud por número (público para seguimiento)
const obtenerSolicitudPorNumero = async (req, res) => {
  try {
    const { numero } = req.params;
    const solicitud = await SolicitudCotizacion.findByNumero(numero);

    if (!solicitud) {
      return res.status(404).json({
        message: 'Solicitud no encontrada'
      });
    }

    // Solo devolver información básica para seguimiento público
    const infoPublica = {
      numero_solicitud: solicitud.numero_solicitud,
      estado: solicitud.estado,
      fecha_solicitud: solicitud.fecha_solicitud,
      fecha_revision: solicitud.fecha_revision,
      fecha_cotizacion: solicitud.fecha_cotizacion,
      numero_cotizacion: solicitud.numero_cotizacion
    };

    res.status(200).json(infoPublica);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al obtener solicitud',
      error: error.message
    });
  }
};

// Asignar solicitud a admin
const asignarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id } = req.body;

    if (!admin_id) {
      return res.status(400).json({
        message: 'ID de administrador es requerido'
      });
    }

    await SolicitudCotizacion.asignarAdmin(id, admin_id);

    res.status(200).json({
      message: 'Solicitud asignada exitosamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al asignar solicitud',
      error: error.message
    });
  }
};

// Actualizar estado de solicitud
const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'en_revision', 'cotizada', 'rechazada', 'completada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        message: 'Estado no válido'
      });
    }

    await SolicitudCotizacion.updateEstado(id, estado, req.admin.id);

    res.status(200).json({
      message: 'Estado actualizado exitosamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
};

// Rechazar solicitud
const rechazarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    await SolicitudCotizacion.rechazar(id, req.admin.id, motivo);

    res.status(200).json({
      message: 'Solicitud rechazada exitosamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al rechazar solicitud',
      error: error.message
    });
  }
};

// Importar bcrypt para generar contraseñas de usuarios automáticos
let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (e) {
  try {
    bcrypt = require('bcrypt');
  } catch (e) {
    console.warn('bcrypt no encontrado, usando string simple para pass provisional');
  }
}

// Convertir solicitud a cotización
const convertirACotizacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      usuario_id, 
      empresa_id, 
      valor_uf, 
      total_clp, 
      observaciones,
      residuos,
      crear_entidades // Nuevo flag para auto-creación
    } = req.body;

    // Asegurar que el flag se interprete correctamente (bool o string)
    const crearEntidadesFlag = crear_entidades === true || crear_entidades === 'true';

    // Obtener solicitud
    const solicitud = await SolicitudCotizacion.findById(id);
    if (!solicitud) {
      return res.status(404).json({
        message: 'Solicitud no encontrada'
      });
    }

    if (solicitud.estado === 'cotizada') {
      return res.status(400).json({
        message: 'Esta solicitud ya fue convertida a cotización'
      });
    }

    // --- LÓGICA DE AUTO-CREACIÓN DE ENTIDADES ---
    let finalUserId = usuario_id;
    let finalEmpresaId = empresa_id;
    let warningMsg = '';

    if (crearEntidadesFlag) {
      // 1. Gestionar Usuario (Buscar por email)
      const userEmail = solicitud.email;
      let user = null;
      try {
        // Intenta buscar usuario existente (adaptar según tu ORM)
        if (User.findByEmail) user = await User.findByEmail(userEmail);
        else if (User.findOne) user = await User.findOne({ where: { email: userEmail } });
        // Fallback genérico si es necesario
        else {
             const users = await User.findAll ? await User.findAll() : []; 
             user = users.find(u => u.email === userEmail);
        }
      } catch (err) { console.log('Error buscando usuario:', err.message); }

      if (!user) {
        try {
            // Crear usuario provisional
            const tempPass = Math.random().toString(36).slice(-8) + "Aa1!";
            const hashedPassword = bcrypt ? await bcrypt.hash(tempPass, 10) : tempPass;
            
            const userData = {
              nombre: solicitud.nombre_solicitante,
              email: userEmail,
              password: hashedPassword,
              direccion: solicitud.direccion,
              telefono: solicitud.telefono,
              region_id: solicitud.region_id || 1, 
              comuna_id: solicitud.comuna_id || 1, 
              tipo: 'usuario',
              role: 'user'
            };
            
            user = await User.create(userData);
        } catch(err) {
            return res.status(500).json({ message: 'Error creando usuario automático: ' + err.message });
        }
      }
      finalUserId = user.id;

      // 2. Gestionar Empresa (si aplica)
      if (solicitud.tipo_solicitud === 'empresa' && solicitud.empresa_rut) {
        let empresa = null;
        try {
            if (Empresa.findByRut) empresa = await Empresa.findByRut(solicitud.empresa_rut);
            else if (Empresa.findOne) empresa = await Empresa.findOne({ where: { rut: solicitud.empresa_rut } });
        } catch (err) { console.log('Error buscando empresa:', err.message); }

        if (!empresa) {
          try {
            empresa = await Empresa.create({
                rut: solicitud.empresa_rut,
                nombre: solicitud.empresa_nombre,
                giro: solicitud.empresa_giro || 'Giro no especificado',
                direccion: solicitud.direccion,
                region_id: solicitud.region_id || 1,
                comuna_id: solicitud.comuna_id || 1,
                telefono: solicitud.telefono,
                estado: 'aprobada'
            });
          } catch(err) {
            return res.status(500).json({ message: 'Error creando empresa automática: ' + err.message });
          }
        }
        finalEmpresaId = empresa.id;

        // Intentar vincular usuario a empresa
        try {
             if (Empresa.agregarUsuario) await Empresa.agregarUsuario(finalEmpresaId, finalUserId, 'admin');
        } catch (e) { warningMsg = ' (Nota: Usuario no vinculado a empresa automáticamente)'; }
      }
    }
    // ---------------------------------------------

    // Validar datos requeridos para cotización
    if (!residuos || !Array.isArray(residuos) || residuos.length === 0) {
      return res.status(400).json({
        message: 'Se requiere al menos un residuo para crear la cotización'
      });
    }

    // Si NO se usó auto-creación, validamos IDs obligatorios
    if (!crearEntidadesFlag) {
      if (empresa_id) {
        const usuariosAsignados = await Empresa.obtenerUsuarios(empresa_id);
        
        if (!usuariosAsignados || usuariosAsignados.length === 0) {
          return res.status(400).json({ 
            message: 'La empresa no tiene usuarios asignados. Debe asignar al menos un usuario.' 
          });
        }

        if (usuario_id) {
          const usuarioPertenece = usuariosAsignados.some(u => u.usuario_id === usuario_id);
          if (!usuarioPertenece) {
            return res.status(400).json({ 
              message: `El usuario con ID ${usuario_id} no está asignado a esta empresa.` 
            });
          }
          finalUserId = usuario_id;
        } else {
          finalUserId = usuariosAsignados[0].usuario_id;
        }
        finalEmpresaId = empresa_id;

      } else if (!usuario_id) {
        return res.status(400).json({
          message: 'Se requiere usuario_id cuando no se proporciona empresa_id'
        });
      } else {
        finalUserId = usuario_id;
      }
    }

    // Obtener valor UF si es necesario
    let valorUF = valor_uf || null;
    if (!valorUF) {
      try {
        const response = await axios.get('https://mindicador.cl/api/uf');
        valorUF = response.data.serie[0].valor;
      } catch (err) {
        console.warn('Error obteniendo UF externa');
        valorUF = 37500; // Valor referencia fallback
      }
    }

    // Enriquecer residuos y calcular totales
    let totalCalculado = 0;
    const residuosConvertidos = [];

    for (const item of residuos) {
      const { residuo_id, cantidad, precio_unitario: precioUnitarioOverride, moneda: monedaOverride } = item;
      
      if (!cantidad || cantidad <= 0) {
        return res.status(400).json({ message: 'La cantidad debe ser válida' });
      }

      let residuo = null;
      if (residuo_id > 0) {
        residuo = await Residuo.findById(residuo_id);
      }
      
      if (!residuo && residuo_id > 0) {
        return res.status(404).json({ message: `Residuo con ID ${residuo_id} no encontrado` });
      }

      // Validar overrides (opcionales)
      const precioUnitario = (precioUnitarioOverride !== undefined) ? Number(precioUnitarioOverride) : (residuo ? residuo.precio : 0);
      const monedaOriginal = monedaOverride || (residuo ? residuo.moneda : 'CLP');
      
      const precioUnitarioCLP = monedaOriginal === 'UF' && valorUF ? (precioUnitario * valorUF) : precioUnitario;
      const subtotalCLP = precioUnitarioCLP * cantidad;
      totalCalculado += subtotalCLP;

      residuosConvertidos.push({
        residuo_id: residuo ? residuo.id : null,
        residuo_descripcion: residuo ? residuo.descripcion : 'Item Manual',
        cantidad: cantidad,
        precio_unitario: precioUnitario,
        moneda_original: monedaOriginal,
        precio_unitario_clp: precioUnitarioCLP,
        subtotal_clp: subtotalCLP,
        unidad: residuo ? residuo.unidad : 'UNID'
      });
    }

    // --- PRIORIDAD TOTAL MANUAL ---
    // Si el usuario envió un total explícito, lo usamos.
    const totalFinal = (total_clp !== undefined && total_clp !== null) ? Number(total_clp) : totalCalculado;

    // Obtener datos del usuario
    let usuarioNombre = solicitud.nombre_solicitante;
    if (finalUserId) {
      try {
        const usuario = await User.findById(finalUserId);
        if (usuario) usuarioNombre = usuario.nombre;
      } catch (err) {}
    }

    // Determinar tipo de cotización
    const tipoCotizacionFinal = finalEmpresaId ? 'empresa' : 'usuario';

    // Datos de empresa si aplica
    let empresaRut = null;
    let empresaNombre = null;
    let empresaDireccion = null;
    let empresaRegion = null;
    let empresaComuna = null;

    if (finalEmpresaId) {
      try {
        const empresa = await Empresa.findById(finalEmpresaId);
        if (empresa) {
          empresaRut = empresa.rut;
          empresaNombre = empresa.nombre;
          empresaDireccion = empresa.direccion;
          empresaRegion = solicitud.region_nombre || null;
          empresaComuna = solicitud.comuna_nombre || null;
        }
      } catch (err) {}
    }

    // Preparar datos para cotización
    const cotizacionData = {
      usuario_id: finalUserId || null,
      usuario_nombre: usuarioNombre,
      empresa_id: finalEmpresaId || null,
      empresa_rut: empresaRut,
      empresa_nombre: empresaNombre,
      empresa_direccion: tipoCotizacionFinal === 'empresa' ? empresaDireccion : null,
      empresa_region: tipoCotizacionFinal === 'empresa' ? empresaRegion : null,
      empresa_comuna: tipoCotizacionFinal === 'empresa' ? empresaComuna : null,
      valor_uf: valorUF,
      total_clp: totalFinal, // Usar total final (calculado o manual)
      observaciones: observaciones || `Cotización generada desde solicitud ${solicitud.numero_solicitud}`,
      admin_id: req.admin.id,
      tipo_cotizacion: tipoCotizacionFinal,
      residuos: residuosConvertidos
    };

    // Crear cotización
    const cotizacion = await Cotizacion.create(cotizacionData);

    // Marcar solicitud como cotizada
    await SolicitudCotizacion.marcarComoCotizada(id, cotizacion.id, req.admin.id);

    // --- GENERAR PDF Y ENVIAR EMAIL ---
    try {
      // Preparar datos completos para el PDF
      const cotizacionCompleta = {
        ...cotizacionData,
        id: cotizacion.id,
        numero_cotizacion: cotizacion.numero_cotizacion,
        fecha_cotizacion: new Date(),
        estado: 'pendiente'
      };

      // Generar PDF
      const rutaPDF = await generarPDFCotizacion(cotizacionCompleta);
      
      // Preparar contenido del email
      // Calcular valor en UF si aplica
      const totalUF = valorUF ? (totalFinal / valorUF) : null;
      
      const contenidoEmail = templateNotificacionCotizacion(
        cotizacionData.usuario_nombre,
        cotizacion.numero_cotizacion,
        totalFinal,
        totalUF,
        new Date(),
        tipoCotizacionFinal,
        cotizacionData.empresa_nombre
      );

      // Adjuntar PDF
      const adjunto = {
        filename: `Cotización ${cotizacion.numero_cotizacion}.pdf`,
        path: rutaPDF,
        contentType: 'application/pdf'
      };

      // Determinar email destinatario
      let emailDestino = solicitud.email; // Por defecto el de la solicitud
      
      // Si se vinculó a un usuario, intentar obtener su email si es diferente
      if (finalUserId) {
        try {
          const u = await User.findById(finalUserId);
          if (u && u.email) emailDestino = u.email;
        } catch (e) {}
      }

      // Enviar email
      await enviarEmailConAdjunto(
        emailDestino,
        `💰 Nueva Cotización Disponible - ${cotizacion.numero_cotizacion}`,
        contenidoEmail,
        adjunto
      );

      // Eliminar archivo temporal PDF
      // await fs.unlink(rutaPDF).catch(e => console.warn('Error borrando PDF temporal:', e.message));
      // NOTA: Podríamos querer guardarlo o no. Si utils/pdfGenerator.js lo guarda en uploads/cotizaciones, 
      // quizás queramos mantenerlo. Por ahora, si el sistema no tiene gestión de archivos persistente 
      // para cotizaciones, lo dejamos. Si queremos que se pueda descargar después desde el panel, 
      // NO debemos borrarlo.
      
      // Dado que el usuario pidió "ver las cotizaciones en pdf", asumiremos que debemos poder regenerarlo
      // o servirlo. Si borramos este, tendremos que generarlo al vuelo cuando se pida descargar.
      // Para ahorrar espacio, lo borraremos aquí y crearemos un endpoint que lo genere al vuelo para descargar.
      await fs.unlink(rutaPDF).catch(e => console.warn('Error borrando PDF temporal:', e.message));

    } catch (pdfError) {
      console.error('Error generando/enviando PDF cotización:', pdfError);
      // No fallamos la request principal, pero logueamos el error
      warningMsg += ' (Nota: Error al enviar email con PDF)';
    }
    // ----------------------------------

    res.status(201).json({
      message: 'Solicitud convertida a cotización exitosamente' + warningMsg,
      cotizacion: {
        id: cotizacion.id,
        numero_cotizacion: cotizacion.numero_cotizacion,
        total_clp: totalFinal
      },
      solicitud: {
        id: solicitud.id,
        numero_solicitud: solicitud.numero_solicitud
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al convertir solicitud a cotización',
      error: error.message
    });
  }
};

// Actualizar solicitud
const actualizarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const solicitudData = req.body;

    // Verificar que la solicitud existe
    const solicitudExistente = await SolicitudCotizacion.findById(id);
    if (!solicitudExistente) {
      return res.status(404).json({
        message: 'Solicitud no encontrada'
      });
    }

    await SolicitudCotizacion.update(id, solicitudData);

    res.status(200).json({
      message: 'Solicitud actualizada exitosamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al actualizar solicitud',
      error: error.message
    });
  }
};

// Eliminar solicitud
const eliminarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la solicitud existe
    const solicitud = await SolicitudCotizacion.findById(id);
    if (!solicitud) {
      return res.status(404).json({
        message: 'Solicitud no encontrada'
      });
    }

    // No permitir eliminar si ya fue convertida a cotización
    if (solicitud.estado === 'cotizada') {
      return res.status(400).json({
        message: 'No se puede eliminar una solicitud que ya fue convertida a cotización'
      });
    }

    await SolicitudCotizacion.delete(id);

    res.status(200).json({
      message: 'Solicitud eliminada exitosamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al eliminar solicitud',
      error: error.message
    });
  }
};

// Obtener estadísticas
const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await SolicitudCotizacion.getEstadisticas();

    // Procesar estadísticas para una mejor estructura
    const resumen = {
      total: estadisticas.reduce((sum, stat) => sum + stat.cantidad, 0),
      por_estado: {},
      por_tipo: {},
      por_urgencia: {}
    };

    estadisticas.forEach(stat => {
      // Por estado
      if (!resumen.por_estado[stat.estado]) {
        resumen.por_estado[stat.estado] = 0;
      }
      resumen.por_estado[stat.estado] += stat.cantidad;

      // Por tipo
      if (!resumen.por_tipo[stat.tipo_solicitud]) {
        resumen.por_tipo[stat.tipo_solicitud] = 0;
      }
      resumen.por_tipo[stat.tipo_solicitud] += stat.cantidad;

      // Por urgencia
      if (!resumen.por_urgencia[stat.urgencia]) {
        resumen.por_urgencia[stat.urgencia] = 0;
      }
      resumen.por_urgencia[stat.urgencia] += stat.cantidad;
    });

    res.status(200).json({
      resumen,
      detalle: estadisticas
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

module.exports = {
  crearSolicitudPublica,
  obtenerSolicitudes,
  obtenerSolicitudPorId,
  obtenerSolicitudPorNumero,
  asignarSolicitud,
  actualizarEstado,
  rechazarSolicitud,
  convertirACotizacion,
  actualizarSolicitud,
  eliminarSolicitud,
  obtenerEstadisticas
};
