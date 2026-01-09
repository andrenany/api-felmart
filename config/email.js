const nodemailer = require('nodemailer');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');

// Configuración del transportador de email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'mail.felmartresiduos.cl',
  port: process.env.EMAIL_PORT || 465,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verificar configuración
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Error en configuración de email:', error);
  } else {
    console.log('✅ Servidor de email listo para enviar mensajes');
  }
});

// Configuración IMAP para recibir correos
const configIMAP = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: process.env.IMAP_HOST || process.env.EMAIL_HOST || 'mail.felmartresiduos.cl',
    port: process.env.IMAP_PORT || 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 3000
  }
};

// Conectar a servidor IMAP y obtener correos
const obtenerCorreos = async (opciones = {}) => {
  const {
    carpeta = 'INBOX',
    cantidad = 10,
    noLeidos = false,
    desdeFecha = null,
    hastaFecha = null
  } = opciones;

  try {
    // Conectar al servidor IMAP
    const connection = await imaps.connect(configIMAP);
    console.log('✅ Conectado al servidor IMAP');

    // Abrir la carpeta especificada
    await connection.openBox(carpeta);

    // Construir criterio de búsqueda
    const criterio = [];
    
    if (noLeidos) {
      criterio.push('UNSEEN');
    }
    
    if (desdeFecha) {
      criterio.push(['SINCE', desdeFecha]);
    }
    
    if (hastaFecha) {
      criterio.push(['BEFORE', hastaFecha]);
    }

    // Si no hay criterios, obtener todos los correos
    const searchCriteria = criterio.length > 0 ? criterio : ['ALL'];

    // Buscar correos
    const fetchOptions = {
      bodies: '',
      struct: true
    };

    const mensajes = await connection.search(searchCriteria, fetchOptions);
    console.log(`📧 Encontrados ${mensajes.length} correos`);

    // Limitar cantidad de correos
    const mensajesLimitados = mensajes.slice(0, cantidad);
    const correosProcesados = [];

    // Procesar cada correo
    for (const mensaje of mensajesLimitados) {
      try {
        // Obtener todas las partes del mensaje
        const todasLasPartes = imaps.getParts(mensaje.attributes.struct);
        
        // Buscar la parte principal del mensaje (no es un adjunto)
        const partePrincipal = todasLasPartes.find(part => {
          return !part.disposition || part.disposition.type !== 'attachment';
        });

        let correoCompleto = null;
        let adjuntos = [];

        // Obtener el cuerpo completo del mensaje
        if (partePrincipal) {
          try {
            const datos = await connection.getPartData(mensaje, partePrincipal);
            correoCompleto = await simpleParser(datos);
          } catch (error) {
            // Si falla, intentar obtener el mensaje completo de otra manera
            console.warn(`Advertencia al parsear parte principal: ${error.message}`);
          }
        }

        // Si no se pudo obtener la parte principal, intentar obtener el mensaje completo
        if (!correoCompleto) {
          try {
            // Obtener el mensaje completo usando la primera parte disponible
            const primeraParte = todasLasPartes[0];
            if (primeraParte) {
              const datos = await connection.getPartData(mensaje, primeraParte);
              correoCompleto = await simpleParser(datos);
            }
          } catch (error) {
            console.warn(`Advertencia al parsear primera parte: ${error.message}`);
          }
        }

        // Obtener adjuntos
        const partesAdjuntos = todasLasPartes.filter(part => {
          return part.disposition && part.disposition.type === 'attachment';
        });

        for (const parte of partesAdjuntos) {
          try {
            const datos = await connection.getPartData(mensaje, parte);
            adjuntos.push({
              nombre: parte.disposition.params?.filename || parte.disposition.params?.name || 'adjunto',
              contenido: datos,
              tipo: parte.type,
              tamaño: datos.length
            });
          } catch (error) {
            console.error(`Error al obtener adjunto:`, error.message);
          }
        }

        // Si no se pudo parsear el correo, crear uno básico con información disponible
        if (!correoCompleto) {
          correoCompleto = {
            subject: '(Sin asunto)',
            from: { value: [{ address: 'desconocido@desconocido.com', name: '' }] },
            date: mensaje.attributes.date || new Date(),
            text: '',
            html: '',
            to: { value: [] },
            cc: { value: [] },
            bcc: { value: [] }
          };
        }

        correosProcesados.push({
          uid: mensaje.attributes.uid,
          asunto: correoCompleto.subject || '(Sin asunto)',
          remitente: {
            nombre: correoCompleto.from?.text || correoCompleto.from?.value?.[0]?.name || '',
            email: correoCompleto.from?.value?.[0]?.address || correoCompleto.from?.text || ''
          },
          destinatarios: {
            para: correoCompleto.to?.value?.map(v => v.address) || [],
            cc: correoCompleto.cc?.value?.map(v => v.address) || [],
            bcc: correoCompleto.bcc?.value?.map(v => v.address) || []
          },
          fecha: correoCompleto.date || mensaje.attributes.date,
          texto: correoCompleto.text || '',
          html: correoCompleto.html || '',
          adjuntos: adjuntos,
          leido: !mensaje.attributes.flags?.includes('\\Seen'),
          flags: mensaje.attributes.flags || []
        });
      } catch (error) {
        console.error(`❌ Error al procesar correo ${mensaje.attributes.uid}:`, error.message);
      }
    }

    // Cerrar conexión
    connection.end();
    console.log('✅ Conexión IMAP cerrada');

    return {
      success: true,
      total: mensajes.length,
      procesados: correosProcesados.length,
      correos: correosProcesados
    };
  } catch (error) {
    console.error('❌ Error al obtener correos IMAP:', error);
    return {
      success: false,
      error: error.message,
      correos: []
    };
  }
};

// Obtener correos no leídos
const obtenerCorreosNoLeidos = async (cantidad = 10) => {
  return await obtenerCorreos({ noLeidos: true, cantidad });
};

// Marcar correo como leído
const marcarComoLeido = async (uid, carpeta = 'INBOX') => {
  try {
    const connection = await imaps.connect(configIMAP);
    await connection.openBox(carpeta);
    
    // El UID debe ser un array
    const uidArray = Array.isArray(uid) ? uid : [uid];
    await connection.addFlags(uidArray, '\\Seen');
    connection.end();
    
    return { success: true, message: 'Correo marcado como leído' };
  } catch (error) {
    console.error('❌ Error al marcar correo como leído:', error);
    return { success: false, error: error.message };
  }
};

// Eliminar correo
const eliminarCorreo = async (uid, carpeta = 'INBOX') => {
  try {
    const connection = await imaps.connect(configIMAP);
    await connection.openBox(carpeta);
    
    // El UID debe ser un array
    const uidArray = Array.isArray(uid) ? uid : [uid];
    await connection.addFlags(uidArray, '\\Deleted');
    await connection.expunge();
    connection.end();
    
    return { success: true, message: 'Correo eliminado' };
  } catch (error) {
    console.error('❌ Error al eliminar correo:', error);
    return { success: false, error: error.message };
  }
};

// Verificar conexión IMAP
const verificarIMAP = async () => {
  try {
    const connection = await imaps.connect(configIMAP);
    await connection.openBox('INBOX');
    connection.end();
    console.log('✅ Conexión IMAP verificada correctamente');
    return { success: true, message: 'Conexión IMAP exitosa' };
  } catch (error) {
    console.error('❌ Error en verificación IMAP:', error);
    return { success: false, error: error.message };
  }
};

// Email para BCC automático (copia oculta de todos los correos enviados)
const EMAIL_BCC = process.env.EMAIL_BCC || 'felmartoilspa@gmail.com';

// Enviar email con adjunto
const enviarEmailConAdjunto = async (destinatario, asunto, contenido, archivoAdjunto) => {
  try {
    const mailOptions = {
      from: `"FELMART" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html: contenido,
      attachments: archivoAdjunto ? [archivoAdjunto] : [],
      // Agregar BCC automáticamente para mantener copia de todos los correos
      bcc: EMAIL_BCC
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado:', info.messageId);
    console.log(`📋 Copia BCC enviada a: ${EMAIL_BCC}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    return { success: false, error: error.message };
  }
};

// Enviar email simple
const enviarEmail = async (destinatario, asunto, contenido) => {
  return await enviarEmailConAdjunto(destinatario, asunto, contenido, null);
};

// Template para notificación de visita
const templateNotificacionVisita = (nombre, fecha, hora, motivo, observaciones) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .info-item { margin: 10px 0; }
        .info-label { font-weight: bold; color: #2c3e50; }
        .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
        .button { background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🗓️ Nueva Visita Programada</h1>
        </div>
        <div class="content">
          <p>Estimado/a ${nombre},</p>
          <p>Se ha programado una nueva visita con los siguientes detalles:</p>
          
          <div class="info-item">
            <span class="info-label">📅 Fecha:</span> ${fecha}
          </div>
          <div class="info-item">
            <span class="info-label">⏰ Hora:</span> ${hora}
          </div>
          <div class="info-item">
            <span class="info-label">📋 Motivo:</span> ${motivo === 'retiro' ? 'Retiro' : 'Evaluación'}
          </div>
          ${observaciones ? `
          <div class="info-item">
            <span class="info-label">📝 Observaciones:</span> ${observaciones}
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://felmartresiduos.cl/login" style="background-color: #9FC440; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Iniciar Sesión en FELMART
            </a>
          </div>

          <p>Por favor, confirme su disponibilidad respondiendo a este correo o contactándonos.</p>
        </div>
        <div class="footer">
          <p>Este es un correo automático de FELMART</p>
          <p>Por favor no responder directamente a este correo</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template para notificación de certificado
const templateNotificacionCertificado = (nombre, descripcion, nombreArchivo) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .info-item { margin: 10px 0; }
        .info-label { font-weight: bold; color: #27ae60; }
        .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
        .attachment-box { background-color: #e8f5e9; padding: 15px; border-left: 4px solid #27ae60; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📜 Nuevo Certificado Disponible</h1>
        </div>
        <div class="content">
          <p>Estimado/a ${nombre},</p>
          <p>Se ha generado un nuevo certificado a su nombre.</p>
          
          ${descripcion ? `
          <div class="info-item">
            <span class="info-label">📋 Descripción:</span> ${descripcion}
          </div>
          ` : ''}
          
          <div class="attachment-box">
            <strong>📎 Archivo adjunto:</strong> ${nombreArchivo}
            <br>
            <small>El certificado se encuentra adjunto a este correo en formato PDF</small>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://felmartresiduos.cl/login" style="background-color: #9FC440; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Iniciar Sesión en FELMART
            </a>
          </div>

          <p>Por favor, descargue y guarde el certificado para sus registros.</p>
          <p>Si tiene alguna consulta, no dude en contactarnos.</p>
        </div>
        <div class="footer">
          <p>Este es un correo automático de FELMART</p>
          <p>Por favor no responder directamente a este correo</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template para notificación de cotización
const templateNotificacionCotizacion = (nombre, numeroCotizacion, totalCLP, totalUF, fecha, tipoCliente, empresaNombre) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #9FC440; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .info-item { margin: 10px 0; padding: 10px; background-color: white; border-left: 4px solid #9FC440; }
        .info-label { font-weight: bold; color: #1a1a1a; }
        .total-box { background-color: #e8f5e9; padding: 15px; border-left: 4px solid #9FC440; margin: 15px 0; text-align: center; }
        .total-amount { font-size: 24px; font-weight: bold; color: #9FC440; }
        .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
        .attachment-box { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Nueva Cotización Disponible</h1>
        </div>
        <div class="content">
          <p>Estimado/a ${nombre},</p>
          <p>Se ha generado una nueva cotización a su nombre con los siguientes detalles:</p>
          
          <div class="info-item">
            <span class="info-label">📋 Número de Cotización:</span> ${numeroCotizacion}
          </div>
          
          <div class="info-item">
            <span class="info-label">📅 Fecha de Emisión:</span> ${new Date(fecha).toLocaleDateString('es-CL', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          
          ${tipoCliente === 'empresa' && empresaNombre ? `
          <div class="info-item">
            <span class="info-label">🏢 Empresa:</span> ${empresaNombre}
          </div>
          ` : ''}
          
          <div class="total-box">
            <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Total de la Cotización</div>
            <div class="total-amount">$${totalCLP.toLocaleString('es-CL')} CLP</div>
            ${totalUF ? `<div style="font-size: 14px; color: #666; margin-top: 5px;">(Aprox. ${totalUF.toFixed(2)} UF)</div>` : ''}
          </div>
          
          <div class="attachment-box">
            <strong>📎 Archivo adjunto:</strong> Cotización ${numeroCotizacion}.pdf
            <br>
            <small>La cotización completa con todos los detalles se encuentra adjunta a este correo en formato PDF</small>
          </div>
          
          <p>Puede iniciar sesión en nuestra plataforma para <strong>Aceptar</strong> o <strong>Rechazar</strong> esta cotización:</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://felmartresiduos.cl/login" style="background-color: #9FC440; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Iniciar Sesión en FELMART
            </a>
          </div>
          
          <p>Por favor, revise la cotización adjunta y no dude en contactarnos si tiene alguna consulta o desea realizar algún ajuste.</p>
          
          <p style="margin-top: 20px;">
            <strong>Próximos pasos:</strong><br>
            • Revise los detalles de la cotización<br>
            • Ingrese a la plataforma para gestionar la cotización<br>
            • Contacte con nosotros si tiene dudas
          </p>
        </div>
        <div class="footer">
          <p>Este es un correo automático de FELMART</p>
          <p>Por favor no responder directamente a este correo</p>
          <p>Para consultas, contáctenos a través de nuestros canales oficiales</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  transporter,
  enviarEmail,
  enviarEmailConAdjunto,
  templateNotificacionVisita,
  templateNotificacionCertificado,
  templateNotificacionCotizacion,
  // Funciones IMAP
  obtenerCorreos,
  obtenerCorreosNoLeidos,
  marcarComoLeido,
  eliminarCorreo,
  verificarIMAP,
  configIMAP
};


