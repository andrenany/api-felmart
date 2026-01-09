const { enviarEmail } = require('../config/email');

const escapeHtml = (value = '') =>
  value
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getRecipients = () => {
  const raw =
    process.env.CONTACT_EMAILS ||
    process.env.CONTACT_EMAIL ||
    process.env.EMAIL_CONTACT ||
    process.env.EMAIL_USER;

  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const buildContactTemplate = ({ nombre, email, telefono, mensaje }) => `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 640px; margin: 0 auto; padding: 24px; background: #f7f9fb; border-radius: 12px; border: 1px solid #dfe6ec; }
        .header { background: linear-gradient(135deg, #00616e, #9fc440); color: #fff; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 1.5rem; letter-spacing: 0.08em; text-transform: uppercase; }
        .field { margin: 12px 0; }
        .label { font-weight: 600; color: #00616e; display: block; margin-bottom: 6px; text-transform: uppercase; font-size: 0.78rem; letter-spacing: 0.04em; }
        .value { background: #ffffff; padding: 14px; border-radius: 10px; border: 1px solid #e0e6eb; }
        .footer { margin-top: 24px; font-size: 0.85rem; color: #7a8a99; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nuevo mensaje desde la web</h1>
        </div>
        <div class="field">
          <span class="label">Nombre</span>
          <div class="value">${escapeHtml(nombre)}</div>
        </div>
        <div class="field">
          <span class="label">Correo electrónico</span>
          <div class="value">${escapeHtml(email)}</div>
        </div>
        ${
          telefono
            ? `
        <div class="field">
          <span class="label">Teléfono</span>
          <div class="value">${escapeHtml(telefono)}</div>
        </div>
        `
            : ''
        }
        <div class="field">
          <span class="label">Mensaje</span>
          <div class="value">${escapeHtml(mensaje)}</div>
        </div>
        <div class="footer">
          <p>Este mensaje fue enviado desde el formulario de contacto del sitio web de FELMART.</p>
        </div>
      </div>
    </body>
  </html>
`;

const enviarMensajeContacto = async (req, res) => {
  const { nombre, email, telefono, mensaje } = req.body || {};

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({
      message: 'Nombre, correo y mensaje son obligatorios.',
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: 'El correo electrónico ingresado no es válido.',
    });
  }

  const destinatarios = getRecipients();

  if (destinatarios.length === 0) {
    return res.status(500).json({
      message: 'No se pudo procesar tu solicitud. Falta configurar un correo de destino.',
    });
  }

  const asunto = `📬 Nuevo mensaje de contacto - ${nombre}`;
  const html = buildContactTemplate({ nombre, email, telefono, mensaje });

  try {
    const resultado = await enviarEmail(destinatarios.join(','), asunto, html);

    if (!resultado.success) {
      throw new Error(resultado.error || 'Error desconocido al enviar correo');
    }

    return res.json({
      message: 'Gracias por contactarnos. Te responderemos a la brevedad.',
    });
  } catch (error) {
    console.error('❌ Error al procesar contacto:', error);
    return res.status(500).json({
      message: 'Ocurrió un error al enviar tu mensaje. Intenta nuevamente más tarde.',
    });
  }
};

module.exports = {
  enviarMensajeContacto,
};


