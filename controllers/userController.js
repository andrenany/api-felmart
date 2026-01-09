const User = require('../models/User');
const Admin = require('../models/admin');
const { generateToken } = require('../config/jwt');
const Notificacion = require('../models/Notificacion');
const { enviarEmail } = require('../config/email');

// Función para validar fortaleza de contraseña
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Registro de usuario
const register = async (req, res) => {
  try {
    const { nombre, email, password, direccion, telefono, region_id, comuna_id } = req.body;

    // Validar campos obligatorios
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
    }

    // Validar fortaleza de contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'La contraseña no cumple con los requisitos de seguridad',
        errors: passwordValidation.errors
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Crear usuario
    const result = await User.create({
      nombre,
      email,
      password,
      direccion,
      telefono,
      region_id,
      comuna_id
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      userId: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

// Login de usuario o administrador
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos obligatorios
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // Buscar primero en usuarios
    let user = await User.findByEmail(email);
    let isAdmin = false;

    // Si no es usuario, buscar en administradores
    if (!user) {
      user = await Admin.findByEmail(email);
      isAdmin = true;
    }

    // Si no existe ni como usuario ni como admin
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Comparar contraseñas
    const passwordMatch = isAdmin 
      ? await Admin.comparePassword(password, user.password)
      : await User.comparePassword(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar token con rol
    const role = isAdmin ? 'admin' : 'user';
    const token = generateToken(user, role);

    // Respuesta diferenciada según tipo
    const response = {
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        email: user.email,
        tipo: isAdmin ? 'admin' : 'usuario',
        role: role
      },
      token
    };

    // Agregar nombre solo si es usuario (admin no tiene nombre)
    if (!isAdmin) {
      response.user.nombre = user.nombre;
    }

    // Si es admin, agregar notificaciones
    if (isAdmin) {
      try {
        // Generar notificaciones automáticas
        await Notificacion.generarNotificacionesAutomaticas();
        
        // Obtener estadísticas de notificaciones
        const estadisticas = await Notificacion.getEstadisticas(user.id);
        
        // Obtener notificaciones críticas y altas
        const criticas = await Notificacion.findByAdmin(user.id, {
          solo_no_leidas: true,
          prioridad: 'critica',
          limite: 5
        });

        const altas = await Notificacion.findByAdmin(user.id, {
          solo_no_leidas: true,
          prioridad: 'alta',
          limite: 5
        });

        response.notificaciones = {
          estadisticas,
          criticas,
          altas,
          resumen: {
            total_no_leidas: estadisticas.no_leidas,
            criticas_no_leidas: estadisticas.criticas_no_leidas,
            altas_no_leidas: estadisticas.altas_no_leidas,
            solicitudes_pendientes: estadisticas.solicitudes_pendientes,
            visitas_proximas: estadisticas.visitas_proximas,
            empresas_pendientes: estadisticas.empresas_pendientes
          }
        };
      } catch (notificationError) {
        console.error('Error obteniendo notificaciones:', notificationError);
        // No fallar el login por error en notificaciones
        response.notificaciones = {
          error: 'Error al cargar notificaciones',
          estadisticas: { no_leidas: 0 }
        };
      }
    }

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Listar todos los usuarios
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

// Obtener un usuario por ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};

// Actualizar usuario
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, direccion, telefono, region_id, comuna_id } = req.body;

    // Verificar si el usuario existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar usuario
    await User.update(id, {
      nombre,
      email,
      password,
      direccion,
      telefono,
      region_id,
      comuna_id
    });

    res.status(200).json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

// Eliminar usuario
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el usuario existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Eliminar usuario
    await User.delete(id);

    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

// Cambiar contraseña (requiere autenticación)
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;

    // Asegurar que el body exista y sea un objeto
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const { currentPassword, newPassword } = body;

    // Validar contenido del body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Contraseña actual y nueva contraseña son requeridas',
        hint: 'Envía JSON con { "currentPassword": "...", "newPassword": "..." } y Content-Type: application/json'
      });
    }

    // Validar fortaleza de nueva contraseña
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'La contraseña no cumple con los requisitos de seguridad',
        errors: passwordValidation.errors
      });
    }

    // Verificar si el usuario existe (usar email del token)
    const user = await User.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que el usuario esté cambiando su propia contraseña
    if (user.id !== parseInt(id)) {
      return res.status(403).json({ 
        message: 'No tienes permisos para cambiar esta contraseña' 
      });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await User.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        message: 'La contraseña actual es incorrecta' 
      });
    }

    // Actualizar contraseña
    await User.updatePassword(id, newPassword);

    res.status(200).json({ 
      message: 'Contraseña cambiada exitosamente' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error al cambiar contraseña', 
      error: error.message 
    });
  }
};

// Solicitar recuperación de contraseña
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Validar email
    if (!email) {
      return res.status(400).json({ 
        message: 'Email es requerido' 
      });
    }

    // Verificar si el usuario existe
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ 
        message: 'El correo electrónico no está registrado en el sistema' 
      });
    }

    // Generar token de recuperación (ahora es un código corto)
    const { token, expiresAt } = await User.generatePasswordResetToken(email);

    // Preparar contenido del email con el código
    const asunto = '🔐 Código de Recuperación - FELMART';
    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
          .header { background-color: #00616e; color: white; padding: 30px 20px; text-align: center; }
          .content { background-color: #ffffff; padding: 40px 30px; }
          .code-box { background-color: #f0f9fa; border: 2px dashed #00616e; color: #00616e; padding: 20px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 30px 0; border-radius: 10px; }
          .footer { background-color: #f5f5f5; text-align: center; color: #777; font-size: 12px; padding: 20px; }
          h1 { margin: 0; font-size: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Hemos recibido una solicitud para restablecer tu contraseña en FELMART.</p>
            <p>Utiliza el siguiente código de seguridad para continuar el proceso:</p>
            
            <div class="code-box">${token}</div>
            
            <p><strong>Este código expira en 1 hora.</strong></p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático de FELMART.</p>
            <p>&copy; ${new Date().getFullYear()} Felmart. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email
    try {
      await enviarEmail(email, asunto, contenido);
      console.log(`✅ Email de recuperación enviado a: ${email} con código: ${token}`);
    } catch (emailError) {
      console.error('❌ Error al enviar email:', emailError);
      // No fallar la operación si hay error en el email (para evitar enumeración de usuarios, aunque aquí ya validamos existencia)
    }

    res.status(200).json({ 
      message: 'Si el email existe, recibirás un código de recuperación',
      // Solo para desarrollo - remover en producción real si se desea
      debugCode: process.env.NODE_ENV === 'development' ? token : undefined
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error al procesar solicitud de recuperación', 
      error: error.message 
    });
  }
};

// Resetear contraseña con token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Validar campos
    if (!newPassword) {
      return res.status(400).json({ 
        message: 'Nueva contraseña es requerida' 
      });
    }

    // Validar fortaleza de contraseña
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'La contraseña no cumple con los requisitos de seguridad',
        errors: passwordValidation.errors
      });
    }

    // Verificar token
    const user = await User.verifyPasswordResetToken(token);
    if (!user) {
      return res.status(400).json({ 
        message: 'Token inválido o expirado' 
      });
    }

    // Actualizar contraseña
    await User.updatePasswordWithToken(token, newPassword);

    res.status(200).json({ 
      message: 'Contraseña restablecida exitosamente' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error al restablecer contraseña', 
      error: error.message 
    });
  }
};

// Verificar token de recuperación
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.verifyPasswordResetToken(token);
    if (!user) {
      return res.status(400).json({ 
        message: 'Token inválido o expirado' 
      });
    }

    res.status(200).json({ 
      message: 'Token válido',
      email: user.email 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error al verificar token', 
      error: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyResetToken
};
