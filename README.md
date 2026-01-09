# 🚀 Proyecto FELMART - Sistema de Gestión de Residuos

Sistema completo de gestión de residuos con API REST, autenticación JWT, gestión de empresas multi-usuario, cotizaciones, visitas, certificados, notificaciones y sistema de email/IMAP.

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura de la Base de Datos](#-estructura-de-la-base-de-datos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Scripts Disponibles](#-scripts-disponibles)
- [API Endpoints](#-api-endpoints)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Seguridad](#-seguridad)
- [Documentación Adicional](#-documentación-adicional)

## ✨ Características Principales

- 🔐 **Autenticación JWT** - Sistema de login seguro para usuarios y administradores
- 👥 **Gestión de Usuarios** - CRUD completo con validaciones
- 🏢 **Sistema Multi-Empresa** - Gestión de empresas con múltiples usuarios y roles
- ♻️ **Catálogo de Residuos** - Gestión de tipos de residuos con precios en UF/CLP
- 💰 **Sistema de Cotizaciones** - Creación, gestión y seguimiento de cotizaciones
- 📝 **Solicitudes Públicas** - Formulario público para solicitar cotizaciones
- 🏠 **Gestión de Visitas** - Programación y seguimiento de visitas técnicas
- 📜 **Certificados PDF** - Generación automática de certificados en PDF
- 🔔 **Sistema de Notificaciones** - Notificaciones para usuarios y administradores
- 📧 **Email/IMAP** - Envío y recepción de correos electrónicos
- 💵 **Valor UF** - Integración con API para obtener valor de UF en tiempo real
- 📊 **Dashboard Admin** - Panel de administración con métricas

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express 5.1.0** - Framework web
- **MySQL2** - Cliente de base de datos MySQL
- **JWT** - Autenticación con tokens
- **bcryptjs** - Encriptación de contraseñas
- **Multer** - Manejo de archivos
- **PDFKit** - Generación de PDFs
- **Nodemailer** - Envío de emails
- **imap-simple** - Recepción de emails (IMAP)
- **Mailparser** - Parsing de emails

### Frontend
- **React + TypeScript** - Framework frontend
- **Vite** - Build tool
- **CSS Modules** - Estilos modulares

## 📊 Estructura de la Base de Datos

### Relaciones Principales

```
regiones (1) ──→ (N) comunas ──→ (N) users
empresas (1) ──→ (N) empresa_usuarios ──→ (N) users
users (1) ──→ (N) cotizaciones
cotizaciones (1) ──→ (N) cotizacion_residuos ──→ (N) residuos
users (1) ──→ (N) visitas
visitas (1) ──→ (N) certificados
```

### Tablas Principales

#### **regiones**
```sql
├── id (INT, PRIMARY KEY)
└── nombre (VARCHAR 100)
```

#### **comunas**
```sql
├── id (INT, PRIMARY KEY)
├── nombre (VARCHAR 100)
└── region_id (INT, FK → regiones.id)
```

#### **users**
```sql
├── id (INT, PRIMARY KEY)
├── nombre (VARCHAR 100)
├── email (VARCHAR 100, UNIQUE)
├── password (VARCHAR 255, encriptada)
├── direccion (VARCHAR 255)
├── telefono (VARCHAR 20)
├── region_id (INT, FK → regiones.id)
├── comuna_id (INT, FK → comunas.id)
└── fecha_creacion (TIMESTAMP)
```

#### **admins**
```sql
├── id (INT, PRIMARY KEY)
├── email (VARCHAR 100, UNIQUE)
└── password (VARCHAR 255, encriptada)
```

#### **empresas**
```sql
├── id (INT, PRIMARY KEY)
├── rut (VARCHAR 20, UNIQUE)
├── nombre (VARCHAR 200)
├── direccion (VARCHAR 255)
├── telefono (VARCHAR 20)
├── email (VARCHAR 100)
├── region_id (INT, FK → regiones.id)
├── comuna_id (INT, FK → comunas.id)
└── fecha_creacion (TIMESTAMP)
```

#### **empresa_usuarios**
```sql
├── id (INT, PRIMARY KEY)
├── empresa_id (INT, FK → empresas.id)
├── user_id (INT, FK → users.id)
└── rol (ENUM: 'owner', 'admin', 'user')
```

#### **residuos**
```sql
├── id (INT, PRIMARY KEY)
├── descripcion (VARCHAR 200)
├── precio (DECIMAL 10,2)
├── unidad (ENUM: 'IBC', 'UNIDAD', 'TONELADA', 'TAMBOR', 'KL', 'LT', 'M3')
└── moneda (ENUM: 'UF', 'CLP')
```

#### **cotizaciones**
```sql
├── id (INT, PRIMARY KEY)
├── numero_cotizacion (VARCHAR 50, UNIQUE)
├── user_id (INT, FK → users.id)
├── empresa_id (INT, FK → empresas.id, NULL)
├── admin_id (INT, FK → admins.id)
├── estado (ENUM: 'pendiente', 'aceptada', 'rechazada', 'vencida')
├── total_clp (DECIMAL 12,2)
├── total_uf (DECIMAL 10,4)
├── fecha_emision (DATE)
├── fecha_vencimiento (DATE)
├── archivo_pdf (VARCHAR 255)
└── fecha_creacion (TIMESTAMP)
```

#### **cotizacion_residuos**
```sql
├── id (INT, PRIMARY KEY)
├── cotizacion_id (INT, FK → cotizaciones.id)
├── residuo_id (INT, FK → residuos.id)
├── cantidad (DECIMAL 10,2)
└── subtotal (DECIMAL 12,2)
```

#### **visitas**
```sql
├── id (INT, PRIMARY KEY)
├── user_id (INT, FK → users.id)
├── empresa_id (INT, FK → empresas.id, NULL)
├── admin_id (INT, FK → admins.id)
├── cotizacion_id (INT, FK → cotizaciones.id, NULL)
├── fecha (DATE)
├── hora (TIME)
├── motivo (ENUM: 'retiro', 'evaluacion')
├── observaciones (TEXT)
└── estado (ENUM: 'programada', 'completada', 'cancelada')
```

#### **certificados**
```sql
├── id (INT, PRIMARY KEY)
├── user_id (INT, FK → users.id)
├── empresa_id (INT, FK → empresas.id, NULL)
├── visita_id (INT, FK → visitas.id, NULL)
├── admin_id (INT, FK → admins.id)
├── descripcion (TEXT)
├── archivo_pdf (VARCHAR 255)
└── fecha_emision (DATE)
```

#### **notificaciones**
```sql
├── id (INT, PRIMARY KEY)
├── user_id (INT, FK → users.id, NULL)
├── admin_id (INT, FK → admins.id, NULL)
├── tipo (VARCHAR 50)
├── titulo (VARCHAR 200)
├── mensaje (TEXT)
├── leida (BOOLEAN, DEFAULT false)
└── fecha_creacion (TIMESTAMP)
```

#### **solicitudes_cotizacion**
```sql
├── id (INT, PRIMARY KEY)
├── nombre (VARCHAR 100)
├── email (VARCHAR 100)
├── telefono (VARCHAR 20)
├── empresa (VARCHAR 200)
├── direccion (VARCHAR 255)
├── residuos (TEXT)
├── estado (ENUM: 'pendiente', 'en_proceso', 'completada')
└── fecha_creacion (TIMESTAMP)
```

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd README_IMAP
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Configuración de MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=FELMART
DB_PORT=3306

# Configuración del servidor
PORT=3000

# JWT Secret (cambiar por una clave segura)
JWT_SECRET=tu_clave_secreta_super_segura_aqui

# Configuración de Email
EMAIL_HOST=mail.felmartresiduos.cl
EMAIL_PORT=465
EMAIL_USER=tu_email@felmartresiduos.cl
EMAIL_PASS=tu_password_email
EMAIL_BCC=felmartoilspa@gmail.com

# Configuración IMAP
IMAP_HOST=mail.felmartresiduos.cl
IMAP_PORT=993
```

### 4. Inicializar la base de datos

```bash
# Crear todas las tablas
npm run init-db

# Cargar datos iniciales (regiones y comunas)
npm run seed-data

# Cargar catálogo de residuos
npm run seed-residuos

# Crear usuario administrador
npm run create-admin
```

### 5. Actualizar ENUM de residuos (si es necesario)

Si necesitas agregar nuevas unidades de medida:

```bash
npm run update-residuos-enum
```

### 6. Iniciar el servidor

```bash
# Producción
npm start

# Desarrollo (con nodemon)
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 🛠️ Scripts Disponibles

```bash
# Servidor
npm start              # Iniciar servidor en producción
npm run dev            # Iniciar servidor en desarrollo (nodemon)

# Base de datos
npm run init-db        # Crear todas las tablas
npm run drop-db        # Eliminar todas las tablas (¡CUIDADO!)
npm run seed-data      # Cargar regiones y comunas
npm run seed-residuos  # Cargar catálogo de residuos
npm run create-admin   # Crear usuario administrador

# Migraciones
npm run update-residuos-enum  # Actualizar ENUM de unidades de residuos

# Inicialización de módulos
npm run init-cotizaciones    # Inicializar datos de cotizaciones
npm run init-visitas         # Inicializar datos de visitas y certificados
```

## 🌐 API Endpoints

### 🔑 Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/register` | Registrar nuevo usuario | ❌ |
| POST | `/api/login` | Iniciar sesión (usuario/admin) | ❌ |
| PUT | `/api/users/change-password` | Cambiar contraseña | ✅ |
| POST | `/api/users/request-reset` | Solicitar recuperación | ❌ |
| POST | `/api/users/reset-password` | Restablecer contraseña | ❌ |
| GET | `/api/users/verify-token` | Verificar token | ✅ |

### 👥 Usuarios

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | Listar todos los usuarios | ✅ |
| GET | `/api/users/:id` | Obtener usuario por ID | ✅ |
| PUT | `/api/users/:id` | Actualizar usuario | ✅ |
| DELETE | `/api/users/:id` | Eliminar usuario | ✅ |

### 🏢 Empresas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/empresas` | Listar empresas | ✅ Admin |
| POST | `/api/empresas` | Crear empresa | ✅ Admin |
| GET | `/api/empresas/:id` | Ver empresa con usuarios | ✅ Admin |
| PUT | `/api/empresas/:id` | Actualizar empresa | ✅ Admin |
| DELETE | `/api/empresas/:id` | Eliminar empresa | ✅ Admin |
| POST | `/api/empresas/:id/usuarios` | Agregar usuario a empresa | ✅ Admin |
| PUT | `/api/empresas/:id/usuarios/:userId` | Actualizar rol de usuario | ✅ Admin |
| DELETE | `/api/empresas/:id/usuarios/:userId` | Remover usuario de empresa | ✅ Admin |

### ♻️ Residuos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/residuos` | Listar residuos | ❌ |
| GET | `/api/residuos/:id` | Obtener residuo por ID | ❌ |
| GET | `/api/residuos/search?q=texto` | Buscar residuos | ❌ |
| POST | `/api/admin/residuos/crear` | Crear residuo | ✅ Admin |
| PUT | `/api/admin/residuos/:id` | Actualizar residuo | ✅ Admin |
| DELETE | `/api/admin/residuos/:id` | Eliminar residuo | ✅ Admin |

### 💰 Cotizaciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/cotizaciones` | Listar cotizaciones | ✅ Admin |
| GET | `/api/cotizaciones/mis-cotizaciones` | Mis cotizaciones | ✅ User |
| GET | `/api/cotizaciones/:id` | Ver cotización | ✅ |
| POST | `/api/admin/cotizaciones` | Crear cotización | ✅ Admin |
| PUT | `/api/cotizaciones/:id/aceptar` | Aceptar cotización | ✅ User |
| PUT | `/api/cotizaciones/:id/rechazar` | Rechazar cotización | ✅ User |
| DELETE | `/api/admin/cotizaciones/:id` | Eliminar cotización | ✅ Admin |

### 📝 Solicitudes de Cotización (Público)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/solicitudes-cotizacion` | Crear solicitud pública | ❌ |
| GET | `/api/admin/solicitudes-cotizacion` | Listar solicitudes | ✅ Admin |
| GET | `/api/admin/solicitudes-cotizacion/:id` | Ver solicitud | ✅ Admin |
| POST | `/api/admin/solicitudes-cotizacion/:id/convertir` | Convertir a cotización | ✅ Admin |

### 🏠 Visitas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/visitas` | Listar visitas | ✅ |
| GET | `/api/visitas/:id` | Ver visita | ✅ |
| POST | `/api/admin/visitas` | Crear visita | ✅ Admin |
| PUT | `/api/admin/visitas/:id` | Actualizar visita | ✅ Admin |
| PUT | `/api/admin/visitas/:id/asignar-cotizacion` | Asignar cotización | ✅ Admin |
| DELETE | `/api/admin/visitas/:id` | Eliminar visita | ✅ Admin |

### 📜 Certificados

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/certificados` | Listar certificados | ✅ |
| GET | `/api/certificados/:id` | Ver certificado | ✅ |
| GET | `/api/certificados/:id/download` | Descargar PDF | ✅ |
| POST | `/api/admin/certificados` | Crear certificado | ✅ Admin |
| DELETE | `/api/admin/certificados/:id` | Eliminar certificado | ✅ Admin |

### 🔔 Notificaciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/notificaciones` | Listar notificaciones | ✅ |
| GET | `/api/notificaciones/no-leidas` | Notificaciones no leídas | ✅ |
| PUT | `/api/notificaciones/:id/marcar-leida` | Marcar como leída | ✅ |
| PUT | `/api/notificaciones/marcar-todas-leidas` | Marcar todas como leídas | ✅ |
| GET | `/api/notificaciones/resumen-login` | Resumen al login (Admin) | ✅ Admin |

### 📧 Email/IMAP

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/email/enviar` | Enviar email | ✅ Admin |
| GET | `/api/email/correos` | Obtener correos IMAP | ✅ Admin |
| GET | `/api/email/correos/no-leidos` | Correos no leídos | ✅ Admin |
| PUT | `/api/email/correos/:uid/marcar-leido` | Marcar correo como leído | ✅ Admin |
| DELETE | `/api/email/correos/:uid` | Eliminar correo | ✅ Admin |
| GET | `/api/email/verificar` | Verificar conexión IMAP | ✅ Admin |

### 💵 Valor UF

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/uf/valor-actual` | Obtener valor UF actual | ❌ |
| GET | `/api/uf/historial` | Historial de valores UF | ❌ |

### 📞 Contacto

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/contacto` | Enviar mensaje de contacto | ❌ |

**📝 Nota:** Para endpoints protegidos, incluir header:
```
Authorization: Bearer <tu_token_jwt>
```

**📖 Documentación completa:** Ver [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)

## 📂 Estructura del Proyecto

```
project/
├── config/
│   ├── db.js              # Configuración MySQL
│   ├── email.js           # Configuración email/IMAP
│   ├── jwt.js             # Configuración JWT
│   └── upload.js          # Configuración Multer
├── controllers/
│   ├── certificadoController.js
│   ├── contactoController.js
│   ├── cotizacionController.js
│   ├── emailController.js
│   ├── empresaController.js
│   ├── notificacionController.js
│   ├── ResiduosController.js
│   ├── solicitudCotizacionController.js
│   ├── ufController.js
│   ├── userController.js
│   └── visitaController.js
├── middleware/
│   ├── adminMiddleware.js  # Middleware para admin
│   └── authMiddleware.js   # Middleware de autenticación
├── models/
│   ├── admin.js
│   ├── Certificado.js
│   ├── Comuna.js
│   ├── Cotizacion.js
│   ├── Empresa.js
│   ├── Notificacion.js
│   ├── region.js
│   ├── Residuo.js
│   ├── SolicitudCotizacion.js
│   ├── User.js
│   └── Visita.js
├── routes/
│   ├── certificadoRoutes.js
│   ├── contactoRoutes.js
│   ├── cotizacionRoutes.js
│   ├── emailRoutes.js
│   ├── empresaRoutes.js
│   ├── notificacionRoutes.js
│   ├── residuosRoutes.js
│   ├── solicitudCotizacionRoutes.js
│   ├── ufRoutes.js
│   ├── userRoutes.js
│   └── visitaRoutes.js
├── seeders/
│   ├── createAdmin.js
│   ├── dropDB.js
│   ├── initDB.js
│   ├── residuosData.js
│   ├── seedData.js
│   └── seedResiduos.js
├── scripts/
│   ├── generarNotificaciones.js
│   └── updateResiduosUnidadEnum.js
├── utils/
│   └── pdfGenerator.js
├── uploads/
│   ├── certificados/
│   └── cotizaciones/
├── frontend/
│   ├── dist/              # Build de producción
│   ├── src/               # Código fuente React
│   ├── public/
│   └── package.json
├── public/
│   ├── dashboard-notificaciones.html
│   └── formulario-solicitud.html
├── .env                   # Variables de entorno (no commitear)
├── .gitignore
├── server.js             # Servidor Express principal
├── package.json
├── POSTMAN_GUIDE.md      # Guía completa de Postman
└── README.md
```

## 🔒 Seguridad

- ✅ **Contraseñas encriptadas** con bcryptjs (10 rounds)
- ✅ **Autenticación JWT** con tokens de 7 días de expiración
- ✅ **Validación de email único** en usuarios y admins
- ✅ **Variables de entorno** para credenciales sensibles
- ✅ **Middleware de autenticación** para rutas protegidas
- ✅ **Middleware de admin** para endpoints administrativos
- ✅ **Validación de datos** en todos los endpoints
- ✅ **Foreign Keys** con `ON DELETE SET NULL` para integridad referencial
- ✅ **CORS configurado** para control de acceso
- ✅ **Validación de contraseñas** (mínimo 8 caracteres, mayúsculas, números, caracteres especiales)
- ✅ **Sanitización de archivos** subidos (validación de tipos y tamaños)
- ✅ **Dependencias actualizadas** sin vulnerabilidades conocidas

## 📧 Configuración de Email/IMAP

El sistema incluye integración completa con email:

- **Envío de emails** mediante Nodemailer
- **Recepción de emails** mediante IMAP
- **Templates HTML** para notificaciones automáticas:
  - Notificaciones de visitas programadas
  - Notificaciones de certificados disponibles
  - Notificaciones de cotizaciones
- **BCC automático** a dirección configurada
- **Parsing de emails** recibidos con Mailparser

## 🧪 Probar la API

### Opción 1: Postman
1. Importar colección desde `POSTMAN_GUIDE.md`
2. Configurar variables de entorno en Postman
3. Hacer login para obtener token
4. Usar token en requests protegidos

### Opción 2: cURL
Ver ejemplos en `POSTMAN_GUIDE.md`

### Opción 3: REST Client (VSCode)
1. Instalar extensión **REST Client**
2. Crear archivo `.rest` con requests
3. Ejecutar requests directamente desde VSCode

## 💡 Datos de Ejemplo Incluidos

### Regiones (16)
Todas las regiones de Chile

### Comunas (22+)
Comunas principales de las regiones más pobladas

### Residuos
Catálogo inicial de residuos con precios en UF y CLP

## 🚀 Flujo de Uso Completo

1. **Inicializar base de datos:**
   ```bash
   npm run init-db
   npm run seed-data
   npm run seed-residuos
   npm run create-admin
   ```

2. **Iniciar servidor:**
   ```bash
   npm start
   ```

3. **Registrar usuario o hacer login:**
   ```bash
   POST /api/register
   POST /api/login
   ```

4. **Usar token en endpoints protegidos:**
   ```bash
   GET /api/users
   Header: Authorization: Bearer <token>
   ```

5. **Administrador puede:**
   - Crear empresas y asignar usuarios
   - Gestionar catálogo de residuos
   - Crear cotizaciones
   - Programar visitas
   - Generar certificados
   - Ver notificaciones y métricas

6. **Usuario puede:**
   - Ver sus cotizaciones
   - Aceptar/rechazar cotizaciones
   - Ver sus visitas programadas
   - Descargar certificados
   - Ver notificaciones

## 📚 Documentación Adicional

- [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md) - Guía completa de endpoints con ejemplos
- [README_IMAP.md](./README_IMAP.md) - Documentación del sistema de email/IMAP (si existe)
- [README_VISITAS_CERTIFICADOS.md](./README_VISITAS_CERTIFICADOS.md) - Documentación de visitas y certificados (si existe)

## 🐛 Solución de Problemas

### Error: "Data truncated for column 'unidad'"
Si recibes este error al crear residuos, ejecuta:
```bash
npm run update-residuos-enum
```

### Error de conexión a MySQL
Verifica que:
- MySQL esté corriendo
- Las credenciales en `.env` sean correctas
- La base de datos `FELMART` exista

### Error de autenticación JWT
Verifica que:
- El token esté en el header `Authorization: Bearer <token>`
- El token no haya expirado (7 días)
- `JWT_SECRET` en `.env` sea el mismo usado al generar el token

## 📝 Notas Importantes

- ⚠️ **Nunca commitear** el archivo `.env` con credenciales reales
- ⚠️ **Cambiar `JWT_SECRET`** en producción por una clave segura
- ⚠️ **Backup regular** de la base de datos
- ✅ **Actualizar dependencias** regularmente: `npm audit fix`
- ✅ **Revisar logs** en caso de errores

---

✨ **Desarrollado para FELMART** 🛒

**Versión:** 1.0.0  
**Última actualización:** 2025