const Visita = require('../models/Visita');
const User = require('../models/User');
const Empresa = require('../models/Empresa');
const { enviarEmail, templateNotificacionVisita } = require('../config/email');

// Crear una nueva visita (solo administrador)
const crearVisita = async (req, res) => {
  try {
    const { usuario_id, empresa_id, cotizacion_id, fecha, hora, motivo, observaciones } = req.body;

    // Validaciones básicas
    if (!usuario_id || !fecha || !hora || !motivo) {
      return res.status(400).json({ 
        message: 'Faltan datos requeridos: usuario_id, fecha, hora y motivo' 
      });
    }

    // Validar motivo
    if (!['retiro', 'evaluacion'].includes(motivo)) {
      return res.status(400).json({ 
        message: 'Motivo inválido. Valores permitidos: retiro, evaluacion' 
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

    // Validar que no exista otra visita en la misma fecha y hora
    const visitaExistente = await Visita.findByFechaHora(fecha, hora);
    if (visitaExistente) {
      return res.status(400).json({ 
        message: `Ya existe una visita programada para el ${new Date(fecha).toLocaleDateString('es-CL')} a las ${hora}. Por favor, selecciona otra fecha u hora.`,
        visita_existente: {
          id: visitaExistente.id,
          fecha: visitaExistente.fecha,
          hora: visitaExistente.hora,
          usuario_nombre: visitaExistente.usuario_nombre
        }
      });
    }

    // Crear la visita
    const visitaData = {
      usuario_id,
      empresa_id: empresa_id || null,
      cotizacion_id: cotizacion_id || null,
      fecha,
      hora,
      motivo,
      observaciones: observaciones || '',
      admin_id: req.admin.id
    };

    const resultado = await Visita.create(visitaData);

    // Enviar email de notificación al usuario
    try {
      const contenidoEmail = templateNotificacionVisita(
        usuario.nombre,
        fecha,
        hora,
        motivo,
        observaciones
      );

      await enviarEmail(
        usuario.email,
        '🗓️ Nueva Visita Programada - FELMART',
        contenidoEmail
      );
    } catch (emailError) {
      console.error('Error al enviar email de notificación:', emailError);
      // No fallar la creación de visita si el email falla
    }

    res.status(201).json({
      message: 'Visita creada exitosamente',
      visita: {
        id: resultado.insertId,
        usuario_id,
        fecha,
        hora,
        motivo,
        estado: 'pendiente'
      }
    });

  } catch (error) {
    console.error('Error al crear visita:', error);
    res.status(500).json({ message: 'Error al crear la visita', error: error.message });
  }
};

// Obtener todas las visitas (solo administrador)
const obtenerVisitas = async (req, res) => {
  try {
    const visitas = await Visita.findAll();
    res.json({ visitas });
  } catch (error) {
    console.error('Error al obtener visitas:', error);
    res.status(500).json({ message: 'Error al obtener las visitas' });
  }
};

// Obtener visita por ID (usuario asignado o admin)
const obtenerVisitaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const visita = await Visita.findById(id);

    if (!visita) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    // Verificar permisos: solo el usuario asignado o admin puede ver
    const usuario_id = req.user.id;
    const esAdmin = req.user.role === 'admin';

    if (!esAdmin && visita.usuario_id !== usuario_id) {
      return res.status(403).json({ 
        message: 'No tienes permiso para ver esta visita' 
      });
    }

    res.json({ visita });
  } catch (error) {
    console.error('Error al obtener visita:', error);
    res.status(500).json({ message: 'Error al obtener la visita' });
  }
};

// Obtener visitas del usuario autenticado
const obtenerMisVisitas = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const visitas = await Visita.findByUsuario(usuario_id);
    res.json({ visitas });
  } catch (error) {
    console.error('Error al obtener visitas:', error);
    res.status(500).json({ message: 'Error al obtener las visitas' });
  }
};

// Obtener visitas por empresa (admin)
const obtenerVisitasPorEmpresa = async (req, res) => {
  try {
    const { empresa_id } = req.params;
    const visitas = await Visita.findByEmpresa(empresa_id);
    res.json({ visitas });
  } catch (error) {
    console.error('Error al obtener visitas:', error);
    res.status(500).json({ message: 'Error al obtener las visitas' });
  }
};

// Obtener visitas por cliente/usuario (admin)
const obtenerVisitasPorCliente = async (req, res) => {
  try {
    const { cliente_id } = req.params;
    const visitas = await Visita.findByUsuario(cliente_id);
    res.json({ success: true, data: visitas });
  } catch (error) {
    console.error('Error al obtener visitas por cliente:', error);
    res.status(500).json({ message: 'Error al obtener las visitas' });
  }
};

// Obtener visitas por estado (admin)
const obtenerVisitasPorEstado = async (req, res) => {
  try {
    const { estado } = req.params;

    if (!['pendiente', 'aceptada', 'reprogramar', 'rechazada'].includes(estado)) {
      return res.status(400).json({ 
        message: 'Estado inválido. Valores permitidos: pendiente, aceptada, reprogramar, rechazada' 
      });
    }

    const visitas = await Visita.findByEstado(estado);
    res.json({ visitas });
  } catch (error) {
    console.error('Error al obtener visitas:', error);
    res.status(500).json({ message: 'Error al obtener las visitas' });
  }
};

// Obtener visitas por motivo (admin)
const obtenerVisitasPorMotivo = async (req, res) => {
  try {
    const { motivo } = req.params;

    if (!['retiro', 'evaluacion'].includes(motivo)) {
      return res.status(400).json({ 
        message: 'Motivo inválido. Valores permitidos: retiro, evaluacion' 
      });
    }

    const visitas = await Visita.findByMotivo(motivo);
    res.json({ visitas });
  } catch (error) {
    console.error('Error al obtener visitas:', error);
    res.status(500).json({ message: 'Error al obtener las visitas' });
  }
};

// Obtener visitas por fecha (admin)
const obtenerVisitasPorFecha = async (req, res) => {
  try {
    const { fecha } = req.params;
    const visitas = await Visita.findByFecha(fecha);
    res.json({ visitas });
  } catch (error) {
    console.error('Error al obtener visitas:', error);
    res.status(500).json({ message: 'Error al obtener las visitas' });
  }
};

// Actualizar visita (solo admin)
const actualizarVisita = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, hora, motivo, observaciones, estado } = req.body;

    const visita = await Visita.findById(id);
    if (!visita) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    // Validar motivo si se proporciona
    if (motivo && !['retiro', 'evaluacion'].includes(motivo)) {
      return res.status(400).json({ 
        message: 'Motivo inválido. Valores permitidos: retiro, evaluacion' 
      });
    }

    // Validar estado si se proporciona
    if (estado && !['pendiente', 'aceptada', 'reprogramar', 'rechazada'].includes(estado)) {
      return res.status(400).json({ 
        message: 'Estado inválido. Valores permitidos: pendiente, aceptada, reprogramar, rechazada' 
      });
    }

    // Validar que no exista otra visita en la misma fecha y hora (excepto la actual)
    const nuevaFecha = fecha || visita.fecha;
    const nuevaHora = hora || visita.hora;
    const visitaExistente = await Visita.findByFechaHora(nuevaFecha, nuevaHora);
    if (visitaExistente && visitaExistente.id !== parseInt(id)) {
      return res.status(400).json({ 
        message: `Ya existe otra visita programada para el ${new Date(nuevaFecha).toLocaleDateString('es-CL')} a las ${nuevaHora}. Por favor, selecciona otra fecha u hora.`,
        visita_existente: {
          id: visitaExistente.id,
          fecha: visitaExistente.fecha,
          hora: visitaExistente.hora,
          usuario_nombre: visitaExistente.usuario_nombre
        }
      });
    }

    await Visita.update(id, {
      fecha: nuevaFecha,
      hora: nuevaHora,
      motivo: motivo || visita.motivo,
      observaciones: observaciones !== undefined ? observaciones : visita.observaciones,
      estado: estado || visita.estado
    });

    res.json({ message: 'Visita actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar visita:', error);
    res.status(500).json({ message: 'Error al actualizar la visita' });
  }
};

// Aceptar visita (usuario)
const aceptarVisita = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    const visita = await Visita.findById(id);

    if (!visita) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    if (visita.usuario_id !== usuario_id) {
      return res.status(403).json({ 
        message: 'No tienes permiso para modificar esta visita' 
      });
    }

    if (visita.estado !== 'pendiente') {
      return res.status(400).json({ 
        message: `Esta visita ya fue ${visita.estado}` 
      });
    }

    await Visita.aceptar(id);

    res.json({ 
      message: 'Visita aceptada exitosamente',
      visita_id: id,
      estado: 'aceptada'
    });

  } catch (error) {
    console.error('Error al aceptar visita:', error);
    res.status(500).json({ message: 'Error al aceptar la visita' });
  }
};

// Rechazar visita (usuario)
const rechazarVisita = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    const visita = await Visita.findById(id);

    if (!visita) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    if (visita.usuario_id !== usuario_id) {
      return res.status(403).json({ 
        message: 'No tienes permiso para modificar esta visita' 
      });
    }

    if (visita.estado !== 'pendiente') {
      return res.status(400).json({ 
        message: `Esta visita ya fue ${visita.estado}` 
      });
    }

    await Visita.rechazar(id);

    res.json({ 
      message: 'Visita rechazada exitosamente',
      visita_id: id,
      estado: 'rechazada'
    });

  } catch (error) {
    console.error('Error al rechazar visita:', error);
    res.status(500).json({ message: 'Error al rechazar la visita' });
  }
};

// Solicitar reprogramación (usuario)
const solicitarReprogramacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    const visita = await Visita.findById(id);

    if (!visita) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    if (visita.usuario_id !== usuario_id) {
      return res.status(403).json({ 
        message: 'No tienes permiso para modificar esta visita' 
      });
    }

    if (visita.estado !== 'pendiente' && visita.estado !== 'aceptada') {
      return res.status(400).json({ 
        message: 'Solo se pueden reprogramar visitas pendientes o aceptadas' 
      });
    }

    await Visita.reprogramar(id);

    res.json({ 
      message: 'Solicitud de reprogramación enviada exitosamente',
      visita_id: id,
      estado: 'reprogramar'
    });

  } catch (error) {
    console.error('Error al solicitar reprogramación:', error);
    res.status(500).json({ message: 'Error al solicitar reprogramación' });
  }
};

// Eliminar visita (solo admin)
const eliminarVisita = async (req, res) => {
  try {
    const { id } = req.params;

    const visita = await Visita.findById(id);
    if (!visita) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    await Visita.delete(id);

    res.json({ message: 'Visita eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar visita:', error);
    res.status(500).json({ message: 'Error al eliminar la visita' });
  }
};

module.exports = {
  crearVisita,
  obtenerVisitas,
  obtenerVisitaPorId,
  obtenerMisVisitas,
  obtenerVisitasPorEmpresa,
  obtenerVisitasPorCliente,
  obtenerVisitasPorEstado,
  obtenerVisitasPorMotivo,
  obtenerVisitasPorFecha,
  actualizarVisita,
  aceptarVisita,
  rechazarVisita,
  solicitarReprogramacion,
  eliminarVisita
};


