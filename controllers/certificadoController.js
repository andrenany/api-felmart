const Certificado = require('../models/Certificado');
const User = require('../models/User');
const Empresa = require('../models/Empresa');
const Visita = require('../models/Visita');
const { enviarEmailConAdjunto, templateNotificacionCertificado } = require('../config/email');
const path = require('path');
const fs = require('fs').promises;

// Crear un nuevo certificado y enviarlo por email (solo administrador)
const crearCertificado = async (req, res) => {
  try {
    const { usuario_id, empresa_id, visita_id, descripcion } = req.body;

    // Validaciones básicas
    if (!usuario_id) {
      return res.status(400).json({ 
        message: 'Falta dato requerido: usuario_id' 
      });
    }

    // Verificar que se haya subido un archivo
    if (!req.file) {
      return res.status(400).json({ 
        message: 'Debe subir un archivo PDF' 
      });
    }

    // Obtener datos del usuario
    const usuario = await User.findById(usuario_id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Si se proporciona empresa_id, verificar que exista
    if (empresa_id) {
      const empresa = await Empresa.findById(empresa_id);
      if (!empresa) {
        return res.status(404).json({ message: 'Empresa no encontrada' });
      }
    }

    // Si se proporciona visita_id, verificar que exista
    if (visita_id) {
      const visita = await Visita.findById(visita_id);
      if (!visita) {
        return res.status(404).json({ message: 'Visita no encontrada' });
      }
    }

    // Crear el certificado en la base de datos
    const certificadoData = {
      usuario_id,
      empresa_id: empresa_id || null,
      visita_id: visita_id || null,
      nombre_archivo: req.file.filename,
      ruta_archivo: req.file.path,
      tipo_archivo: req.file.mimetype,
      tamano_archivo: req.file.size,
      descripcion: descripcion || '',
      admin_id: req.admin.id
    };

    const resultado = await Certificado.create(certificadoData);
    const certificado_id = resultado.insertId;

    // Enviar email con el certificado adjunto
    try {
      const contenidoEmail = templateNotificacionCertificado(
        usuario.nombre,
        descripcion,
        req.file.originalname
      );

      const adjunto = {
        filename: req.file.originalname,
        path: req.file.path,
        contentType: 'application/pdf'
      };

      const emailResult = await enviarEmailConAdjunto(
        usuario.email,
        '📜 Nuevo Certificado Disponible - FELMART',
        contenidoEmail,
        adjunto
      );

      if (emailResult.success) {
        // Marcar como enviado
        await Certificado.marcarEnviado(certificado_id);
      }

      res.status(201).json({
        message: 'Certificado creado y enviado exitosamente',
        certificado: {
          id: certificado_id,
          usuario_id,
          nombre_archivo: req.file.originalname,
          email_enviado: emailResult.success
        }
      });

    } catch (emailError) {
      console.error('Error al enviar email:', emailError);
      // El certificado se creó pero el email falló
      res.status(201).json({
        message: 'Certificado creado pero el email no pudo ser enviado',
        certificado: {
          id: certificado_id,
          usuario_id,
          nombre_archivo: req.file.originalname,
          email_enviado: false
        }
      });
    }

  } catch (error) {
    console.error('Error al crear certificado:', error);
    // Si hay error, intentar eliminar el archivo subido
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo:', unlinkError);
      }
    }
    res.status(500).json({ message: 'Error al crear el certificado', error: error.message });
  }
};

// Reenviar certificado por email (admin)
const reenviarCertificado = async (req, res) => {
  try {
    const { id } = req.params;

    const certificado = await Certificado.findById(id);
    if (!certificado) {
      return res.status(404).json({ message: 'Certificado no encontrado' });
    }

    // Verificar que el archivo existe
    try {
      await fs.access(certificado.ruta_archivo);
    } catch {
      return res.status(404).json({ 
        message: 'El archivo del certificado no se encuentra en el servidor' 
      });
    }

    // Enviar email con el certificado
    const contenidoEmail = templateNotificacionCertificado(
      certificado.usuario_nombre,
      certificado.descripcion,
      certificado.nombre_archivo
    );

    const adjunto = {
      filename: certificado.nombre_archivo,
      path: certificado.ruta_archivo,
      contentType: 'application/pdf'
    };

    const emailResult = await enviarEmailConAdjunto(
      certificado.usuario_email,
      '📜 Reenvío de Certificado - FELMART',
      contenidoEmail,
      adjunto
    );

    if (emailResult.success) {
      await Certificado.marcarEnviado(id);
      res.json({ 
        message: 'Certificado reenviado exitosamente',
        email: certificado.usuario_email
      });
    } else {
      res.status(500).json({ 
        message: 'Error al enviar el email',
        error: emailResult.error
      });
    }

  } catch (error) {
    console.error('Error al reenviar certificado:', error);
    res.status(500).json({ message: 'Error al reenviar el certificado' });
  }
};

// Obtener todos los certificados (admin) con filtros opcionales
const obtenerCertificados = async (req, res) => {
  try {
    const { cliente, fechaDesde, fechaHasta } = req.query;
    
    let certificados;
    
    // Si hay filtro por cliente, usar findByUsuario
    if (cliente) {
      certificados = await Certificado.findByUsuario(parseInt(cliente));
    } else {
      certificados = await Certificado.findAll();
    }
    
    // Aplicar filtros de fecha si existen
    if (fechaDesde || fechaHasta) {
      certificados = certificados.filter(cert => {
        if (!cert.fecha_creacion) return false;
        
        const fechaCert = new Date(cert.fecha_creacion);
        fechaCert.setHours(0, 0, 0, 0);
        
        if (fechaDesde) {
          const desde = new Date(fechaDesde);
          desde.setHours(0, 0, 0, 0);
          if (fechaCert < desde) return false;
        }
        
        if (fechaHasta) {
          const hasta = new Date(fechaHasta);
          hasta.setHours(23, 59, 59, 999);
          if (fechaCert > hasta) return false;
        }
        
        return true;
      });
    }
    
    res.json({ certificados });
  } catch (error) {
    console.error('Error al obtener certificados:', error);
    res.status(500).json({ message: 'Error al obtener los certificados' });
  }
};

// Obtener certificado por ID (usuario asignado o admin)
const obtenerCertificadoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const certificado = await Certificado.findById(id);

    if (!certificado) {
      return res.status(404).json({ message: 'Certificado no encontrado' });
    }

    // Verificar permisos: solo el usuario asignado o admin puede ver
    const usuario_id = req.user.id;
    const esAdmin = req.user.role === 'admin';

    if (!esAdmin && certificado.usuario_id !== usuario_id) {
      return res.status(403).json({ 
        message: 'No tienes permiso para ver este certificado' 
      });
    }

    res.json({ certificado });
  } catch (error) {
    console.error('Error al obtener certificado:', error);
    res.status(500).json({ message: 'Error al obtener el certificado' });
  }
};

// Descargar certificado (usuario asignado o admin)
const descargarCertificado = async (req, res) => {
  try {
    const { id } = req.params;
    const certificado = await Certificado.findById(id);

    if (!certificado) {
      return res.status(404).json({ message: 'Certificado no encontrado' });
    }

    // Verificar permisos
    const usuario_id = req.user.id;
    const esAdmin = req.user.role === 'admin';

    if (!esAdmin && certificado.usuario_id !== usuario_id) {
      return res.status(403).json({ 
        message: 'No tienes permiso para descargar este certificado' 
      });
    }

    // Verificar que el archivo existe
    try {
      await fs.access(certificado.ruta_archivo);
    } catch {
      return res.status(404).json({ 
        message: 'El archivo del certificado no se encuentra en el servidor' 
      });
    }

    // Enviar el archivo
    res.download(certificado.ruta_archivo, certificado.nombre_archivo, (err) => {
      if (err) {
        console.error('Error al descargar archivo:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error al descargar el archivo' });
        }
      }
    });

  } catch (error) {
    console.error('Error al descargar certificado:', error);
    res.status(500).json({ message: 'Error al descargar el certificado' });
  }
};

// Obtener certificados del usuario autenticado
const obtenerMisCertificados = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const certificados = await Certificado.findByUsuario(usuario_id);
    res.json({ certificados });
  } catch (error) {
    console.error('Error al obtener certificados:', error);
    res.status(500).json({ message: 'Error al obtener los certificados' });
  }
};

// Obtener certificados por empresa (admin)
const obtenerCertificadosPorEmpresa = async (req, res) => {
  try {
    const { empresa_id } = req.params;
    const certificados = await Certificado.findByEmpresa(empresa_id);
    res.json({ certificados });
  } catch (error) {
    console.error('Error al obtener certificados:', error);
    res.status(500).json({ message: 'Error al obtener los certificados' });
  }
};

// Obtener certificados por visita (admin o usuario de la visita)
const obtenerCertificadosPorVisita = async (req, res) => {
  try {
    const { visita_id } = req.params;
    const certificados = await Certificado.findByVisita(visita_id);
    res.json({ certificados });
  } catch (error) {
    console.error('Error al obtener certificados:', error);
    res.status(500).json({ message: 'Error al obtener los certificados' });
  }
};

// Actualizar certificado (solo admin)
const actualizarCertificado = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;

    const certificado = await Certificado.findById(id);
    if (!certificado) {
      return res.status(404).json({ message: 'Certificado no encontrado' });
    }

    await Certificado.update(id, { descripcion });

    res.json({ message: 'Certificado actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar certificado:', error);
    res.status(500).json({ message: 'Error al actualizar el certificado' });
  }
};

// Eliminar certificado (solo admin)
const eliminarCertificado = async (req, res) => {
  try {
    const { id } = req.params;

    const certificado = await Certificado.findById(id);
    if (!certificado) {
      return res.status(404).json({ message: 'Certificado no encontrado' });
    }

    // Eliminar el archivo físico
    try {
      await fs.unlink(certificado.ruta_archivo);
    } catch (error) {
      console.error('Error al eliminar archivo físico:', error);
      // Continuar eliminando el registro aunque el archivo no exista
    }

    // Eliminar el registro de la base de datos
    await Certificado.delete(id);

    res.json({ message: 'Certificado eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar certificado:', error);
    res.status(500).json({ message: 'Error al eliminar el certificado' });
  }
};

module.exports = {
  crearCertificado,
  reenviarCertificado,
  obtenerCertificados,
  obtenerCertificadoPorId,
  descargarCertificado,
  obtenerMisCertificados,
  obtenerCertificadosPorEmpresa,
  obtenerCertificadosPorVisita,
  actualizarCertificado,
  eliminarCertificado
};


