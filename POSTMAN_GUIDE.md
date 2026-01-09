# 📮 Guía Completa de Postman - API FELMART

## 🔧 Configuración Inicial en Postman

### 1. Variables de Entorno (Environment)
Crea un nuevo **Environment** en Postman con estas variables:

| Variable | Valor Inicial |
|----------|---------------|
| `baseUrl` | `http://localhost:3000/api` |
| `token` | (vacío - se llenará automáticamente al hacer login) |
| `adminToken` | (vacío - se llenará al hacer login como admin) |
| `userToken` | (vacío - se llenará al hacer login como usuario) |

---

## 📋 Endpoints con Ejemplos JSON

### 🔑 1. REGISTRO DE USUARIO

**Método:** `POST`  
**URL:** `{{baseUrl}}/register`

**Headers:**
```
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "MiPassword123!",
  "direccion": "Av. Libertador 1234",
  "telefono": "+56912345678",
  "region_id": 1,
  "comuna_id": 1
}
```

**Respuesta Esperada (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "userId": 1
}
```

**Error de contraseña débil (400):**
```json
{
  "message": "La contraseña no cumple con los requisitos de seguridad",
  "errors": [
    "Debe tener al menos 8 caracteres",
    "Debe contener al menos una letra mayúscula",
    "Debe contener al menos un carácter especial"
  ]
}
```

---

### 🔐 2. LOGIN DE USUARIO O ADMINISTRADOR

**Método:** `POST`  
**URL:** `{{baseUrl}}/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw - JSON) - Usuario:**
```json
{
  "email": "juan@example.com",
  "password": "MiPassword123!"
}
```

**Body (raw - JSON) - Admin:**
```json
{
  "email": "admin@felmart.com",
  "password": "admin123"
}
```

**Respuesta Esperada Usuario (200):**
```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "tipo": "usuario",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta Esperada Admin (200) - CON NOTIFICACIONES:**
```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": 1,
    "email": "admin@felmart.com",
    "tipo": "admin",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "notificaciones": {
    "estadisticas": {
      "total": 15,
      "no_leidas": 8,
      "criticas_no_leidas": 2,
      "altas_no_leidas": 3,
      "solicitudes_pendientes": 5,
      "visitas_proximas": 2,
      "empresas_pendientes": 1
    },
    "criticas": [
      {
        "id": 1,
        "titulo": "5 Solicitud(es) de Cotización Pendiente(s)",
        "mensaje": "Hay 5 solicitud(es) de cotización esperando revisión.",
        "prioridad": "alta",
        "fecha_creacion": "2025-01-13T10:30:00.000Z"
      }
    ],
    "altas": [...],
    "resumen": {
      "total_no_leidas": 8,
      "criticas_no_leidas": 2,
      "altas_no_leidas": 3,
      "solicitudes_pendientes": 5,
      "visitas_proximas": 2,
      "empresas_pendientes": 1
    }
  }
}
```

**📝 Nota:** El login funciona tanto para usuarios como administradores. Los admins reciben notificaciones automáticas al iniciar sesión.

**⚠️ IMPORTANTE:** Copia el `token` de la respuesta y guárdalo en la variable de entorno correspondiente.

**Automatización (opcional):**
En la pestaña **Tests** de esta petición, agrega:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.user.tipo === 'admin') {
        pm.environment.set("adminToken", jsonData.token);
        console.log("✅ Token de admin guardado");
    } else {
        pm.environment.set("userToken", jsonData.token);
        console.log("✅ Token de usuario guardado");
    }
}
```

---

### 🔄 3. CAMBIAR CONTRASEÑA (Usuario Autenticado)

**Método:** `PUT`  
**URL:** `{{baseUrl}}/change-password/:id`

**⚠️ IMPORTANTE:** Reemplaza `:id` con el ID del usuario autenticado.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{userToken}}
```

**Body (raw - JSON):**
```json
{
  "currentPassword": "MiPassword123!",
  "newPassword": "NuevaPassword456@"
}
```

**Respuesta Esperada (200):**
```json
{
  "message": "Contraseña cambiada exitosamente"
}
```

**Error si faltan campos en el body (400):**
```json
{
  "message": "Contraseña actual y nueva contraseña son requeridas",
  "hint": "Envía JSON con { \"currentPassword\": \"...\", \"newPassword\": \"...\" } y Content-Type: application/json"
}
```

**Error si contraseña actual incorrecta (401):**
```json
{
  "message": "La contraseña actual es incorrecta"
}
```

**Error si no tienes permisos (403):**
```json
{
  "message": "No tienes permisos para cambiar esta contraseña"
}
```

---

### 🔑 4. SOLICITAR RECUPERACIÓN DE CONTRASEÑA

**Método:** `POST`  
**URL:** `{{baseUrl}}/password-reset/request`

**Headers:**
```
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "email": "juan@example.com"
}
```

**Respuesta Esperada (200):**
```json
{
  "message": "Si el email existe, se ha enviado un enlace de recuperación",
  "resetLink": "http://localhost:3000/reset-password?token=abc123...",
  "expiresIn": "1 hora"
}
```

---

### 🔓 5. RESTABLECER CONTRASEÑA CON TOKEN

**Método:** `POST`  
**URL:** `{{baseUrl}}/password-reset/:token`

**Headers:**
```
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "token": "abc123def456...",
  "newPassword": "NuevaPassword789#"
}
```

**Respuesta Esperada (200):**
```json
{
  "message": "Contraseña restablecida exitosamente"
}
```

---

### ✅ 6. VERIFICAR TOKEN DE RECUPERACIÓN

**Método:** `GET`  
**URL:** `{{baseUrl}}/verify-reset-token/abc123def456...`

**Headers:**
```
Content-Type: application/json
```

**Respuesta Esperada (200):**
```json
{
  "valid": true,
  "message": "Token válido"
}
```

**Error si token inválido (400):**
```json
{
  "valid": false,
  "message": "Token inválido o expirado"
}
```

---

## 👥 ENDPOINTS PROTEGIDOS (Requieren Token)

**⚠️ Todos los siguientes endpoints requieren el header:**
```
Authorization: Bearer {{token}}
```

---

### 📋 7. LISTAR TODOS LOS USUARIOS

**Método:** `GET`  
**URL:** `{{baseUrl}}/users`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body:** (ninguno)

**Respuesta Esperada (200):**
```json
[
  {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "direccion": "Av. Libertador 1234",
    "telefono": "+56912345678",
    "region_id": 1,
    "comuna_id": 1,
    "fecha_creacion": "2025-01-13T10:30:00.000Z"
  }
]
```

---

### 👤 8. OBTENER USUARIO POR ID

**Método:** `GET`  
**URL:** `{{baseUrl}}/users/1`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Respuesta Esperada (200):**
```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "direccion": "Av. Libertador 1234",
  "telefono": "+56912345678",
  "region_id": 1,
  "comuna_id": 1,
  "fecha_creacion": "2025-01-13T10:30:00.000Z"
}
```

---

### ✏️ 9. ACTUALIZAR USUARIO

**Método:** `PUT`  
**URL:** `{{baseUrl}}/users/1`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (raw - JSON):**
```json
{
  "nombre": "Juan Pérez García",
  "email": "juan.perez@example.com",
  "direccion": "Nueva Calle 456",
  "telefono": "+56987654321",
  "region_id": 2,
  "comuna_id": 3
}
```

---

### 🗑️ 10. ELIMINAR USUARIO

**Método:** `DELETE`  
**URL:** `{{baseUrl}}/users/1`

**Headers:**
```
Authorization: Bearer {{token}}
```

---

## 🏢 SISTEMA DE EMPRESAS MULTI-USUARIO

### 📋 11. LISTAR TODAS LAS EMPRESAS (ADMIN)

**Método:** `GET`  
**URL:** `{{baseUrl}}/empresas`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Respuesta Esperada (200):**
```json
{
  "empresas": [
    {
      "id": 1,
      "rut": "76.123.456-7",
      "nombre": "Empresa Ejemplo S.A.",
      "giro": "Servicios Industriales",
      "direccion": "Av. Principal 1234",
      "kilometraje": 15,
      "comuna_id": 1,
      "region_id": 1,
      "estado": "aprobada",
      "fecha_creacion": "2025-01-13T10:30:00.000Z",
      "usuarios": [
        {
          "id": 1,
          "nombre": "Juan Pérez",
          "email": "juan@example.com",
          "rol": "admin",
          "activo": true,
          "fecha_asignacion": "2025-01-13T10:30:00.000Z"
        }
      ]
    }
  ]
}
```

---

### 🏢 12. CREAR EMPRESA CON USUARIOS (ADMIN)

**Método:** `POST`  
**URL:** `{{baseUrl}}/empresas`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{adminToken}}
```

**Body (raw - JSON):**
```json
{
  "rut": "76.555.444-3",
  "nombre": "Nueva Empresa S.A.",
  "giro": "Manufactura",
  "direccion": "Calle Industrial 567",
  "kilometraje": 25,
  "region_id": 7,
  "comuna_id": 2,
  "usuarios": [
    {
      "usuario_id": 1
    },
    {
      "usuario_id": 2
    }
  ]
}
```

**Respuesta Esperada (201):**
```json
{
  "message": "Empresa creada exitosamente",
  "empresa": {
    "id": 2,
    "rut": "76.555.444-3",
    "nombre": "Nueva Empresa S.A.",
    "usuarios_asignados": 2
  }
}
```

---

### 👥 13. AGREGAR USUARIO A EMPRESA (ADMIN)

**Método:** `POST`  
**URL:** `{{baseUrl}}/empresas/1/usuarios`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{adminToken}}
```

**Body (raw - JSON):**
```json
{
  "usuario_id": 3
}
```

---

### 🗑️ 14. REMOVER USUARIO DE EMPRESA (ADMIN)

**Método:** `DELETE`  
**URL:** `{{baseUrl}}/empresas/1/usuarios/3`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

---

## 💰 SISTEMA DE COTIZACIONES MEJORADO

**🔔 IMPORTANTE - Cotizaciones para Empresas:**
Cuando creas una cotización para una empresa (`empresa_id` presente), el sistema:
- **Toma automáticamente** el primer usuario asignado a la empresa si no proporcionas `usuario_id`
- **Valida** que el `usuario_id` proporcionado pertenezca a la empresa
- **Rechaza** la cotización si la empresa no tiene usuarios asignados

Esto asegura que las cotizaciones siempre se asignen al usuario correcto de la empresa.

---

### 🌐 16. SOLICITAR COTIZACIÓN (PÚBLICO - SIN TOKEN)

**Método:** `POST`  
**URL:** `{{baseUrl}}/cotizaciones/solicitar`

**Headers:**
```
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "tipo_solicitud": "empresa",
  "nombre_solicitante": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "+56912345678",
  "empresa_nombre": "Empresa Ejemplo S.A.",
  "empresa_rut": "76.123.456-7",
  "empresa_giro": "Servicios Industriales",
  "direccion": "Av. Principal 1234",
  "region_id": 1,
  "comuna_id": 1,
  "descripcion_residuos": "Aceite usado industrial y baterías de plomo",
  "cantidad_estimada": "200 litros de aceite, 50 baterías",
  "frecuencia_retiro": "mensual",
  "observaciones": "Necesito retiro urgente dentro de esta semana",
  "urgencia": "alta"
}
```

**Respuesta Esperada (201):**
```json
{
  "message": "Solicitud de cotización enviada exitosamente",
  "solicitud": {
    "id": 1,
    "numero_solicitud": "SOL-000001",
    "tipo_solicitud": "empresa",
    "estado": "pendiente",
    "fecha_solicitud": "2025-01-13T10:30:00.000Z"
  }
}
```

---

### ➕ 17. CREAR COTIZACIÓN FLEXIBLE (ADMIN)

**Método:** `POST`  
**URL:** `{{baseUrl}}/admin/cotizaciones`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{adminToken}}
```

**Body (raw - JSON) - Cotización para Usuario:**
```json
{
  "tipo_cotizacion": "usuario",
  "usuario_id": 1,
  "residuos": [
    {
      "residuo_id": 1,
      "cantidad": 100
    },
    {
      "residuo_id": 2,
      "cantidad": 50
    }
  ],
  "observaciones": "Retiro programado para el próximo lunes"
}
```

**Body (raw - JSON) - Cotización para Usuario con Precio Personalizado:**
```json
{
  "tipo_cotizacion": "usuario",
  "usuario_id": 1,
  "residuos": [
    {
      "residuo_id": 1,
      "cantidad": 100,
      "precio_unitario": 1.50,
      "moneda": "UF"
    },
    {
      "residuo_id": 2,
      "cantidad": 50,
      "precio_unitario": 50000,
      "moneda": "CLP"
    }
  ],
  "observaciones": "Cotización con precios personalizados"
}
```

**Body (raw - JSON) - Cotización para Empresa (usuario_id OPCIONAL):**
```json
{
  "tipo_cotizacion": "empresa",
  "empresa_id": 1,
  "residuos": [
    {
      "residuo_id": 1,
      "cantidad": 200
    }
  ],
  "observaciones": "Cotización para empresa con descuento corporativo"
}
```

**⚠️ IMPORTANTE - Cotizaciones para Empresa:**
- Si **NO** proporcionas `usuario_id`, el sistema tomará **automáticamente el primer usuario asignado** a la empresa.
- Si **SÍ** proporcionas `usuario_id`, el sistema **validará** que ese usuario esté asignado a la empresa.
- Si la empresa **no tiene usuarios asignados**, recibirás un error 400.
- El `usuario_id` es **obligatorio** solo cuando `tipo_cotizacion` es `"usuario"` o cuando no hay `empresa_id`.

**💰 Precios Personalizados (NUEVO):**
- Cada residuo puede tener `precio_unitario` (opcional) para sobrescribir el precio del catálogo.
- Cada residuo puede tener `moneda` (opcional) para cambiar la moneda del precio (`UF` o `CLP`).
- Si no proporcionas `precio_unitario`, se usa el precio base del catálogo.
- Si no proporcionas `moneda`, se usa la moneda del catálogo.
- El sistema calculará automáticamente el total en CLP usando el valor de UF actual si es necesario.
- **Ejemplo:** Puedes mezclar residuos con precios personalizados y otros con precios del catálogo en la misma cotización.

**Body (raw - JSON) - Cotización para Empresa (con usuario_id específico):**
```json
{
  "tipo_cotizacion": "empresa",
  "empresa_id": 1,
  "usuario_id": 2,
  "residuos": [
    {
      "residuo_id": 1,
      "cantidad": 200
    }
  ],
  "observaciones": "Cotización para usuario específico de la empresa"
}
```

**Respuesta Esperada (201):**
```json
{
  "message": "Cotización creada exitosamente",
  "cotizacion": {
    "id": 1,
    "numero_cotizacion": "COT-000001",
    "tipo_cotizacion": "empresa",
    "total_clp": 7500100.00,
    "valor_uf": 75001.00
  }
}
```

**Error si empresa no tiene usuarios asignados (400):**
```json
{
  "message": "La empresa no tiene usuarios asignados. Debe asignar al menos un usuario a la empresa antes de crear una cotización."
}
```

**Error si usuario_id no pertenece a la empresa (400):**
```json
{
  "message": "El usuario con ID 5 no está asignado a esta empresa. Usuarios asignados: 1, 2, 3"
}
```

---

### 🔍 18. VER COTIZACIÓN CON DETALLES COMPLETOS

**Método:** `GET`  
**URL:** `{{baseUrl}}/cotizaciones/1`

**Headers:**
```
Authorization: Bearer {{userToken}} o {{adminToken}}
```

**Respuesta Esperada (200):**
```json
{
  "cotizacion": {
      "id": 1,
      "numero_cotizacion": "COT-000001",
    "tipo_cotizacion": "empresa",
    "usuario_id": 1,
      "usuario_nombre": "Juan Pérez",
    "empresa_id": 1,
      "empresa_rut": "76.123.456-7",
    "empresa_nombre": "Empresa Ejemplo S.A.",
    "empresa_direccion": "Av. Principal 1234",
    "empresa_region": "Metropolitana",
    "empresa_comuna": "Santiago",
    "valor_uf": 75001.00,
    "fecha_cotizacion": "2025-01-13T10:30:00.000Z",
    "total_clp": 7500100.00,
      "estado": "pendiente",
    "observaciones": "Retiro programado para el lunes",
    "admin_id": 1,
    "admin_email": "admin@felmart.com",
    "residuos": [
      {
        "id": 1,
        "cotizacion_id": 1,
        "residuo_id": 1,
        "residuo_descripcion": "Aceite usado industrial",
        "cantidad": 200.00,
        "precio_unitario": 1.00,
        "moneda_original": "UF",
        "precio_unitario_clp": 37500.50,
        "subtotal_clp": 7500100.00,
        "unidad": "LT"
      }
    ]
  }
}
```

---

### 🔄 19. CONVERTIR SOLICITUD A COTIZACIÓN (ADMIN)

**Método:** `POST`  
**URL:** `{{baseUrl}}/solicitudes-cotizacion/:id/convertir-cotizacion`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{adminToken}}
```

**Body (raw - JSON):**
```json
{
  "usuario_id": 1,
  "empresa_id": 1,
  "observaciones": "Cotización generada desde solicitud SOL-000001",
  "residuos": [
    {
      "residuo_id": 1,
      "cantidad": 200
    },
    {
      "residuo_id": 10,
      "cantidad": 50
    }
  ]
}
```

**⚠️ IMPORTANTE:**
- `usuario_id` y `empresa_id` son **opcionales**
- `residuos` es **obligatorio** y debe contener al menos un residuo válido
- `valor_uf` se obtiene automáticamente si no se proporciona
- `total_clp` se calcula automáticamente basado en los residuos
- La solicitud debe estar en estado `pendiente` o `en_revision`
- Después de convertir, la solicitud se marca automáticamente como `cotizada`

**Respuesta Esperada (201):**
```json
{
  "message": "Solicitud convertida a cotización exitosamente",
  "cotizacion": {
    "id": 1,
    "numero_cotizacion": "COT-000001",
    "total_clp": 7500100.00,
    "valor_uf": 75001.00
  },
  "solicitud": {
    "id": 1,
    "numero_solicitud": "SOL-000001",
    "estado": "cotizada"
  }
}
```

**Error si solicitud ya fue convertida (400):**
```json
{
  "message": "Esta solicitud ya fue convertida a cotización"
}
```

**Error si no hay residuos (400):**
```json
{
  "message": "Se requiere al menos un residuo para crear la cotización"
}
```

**Error si residuo no existe (404):**
```json
{
  "message": "Residuo con ID 999 no encontrado"
}
```

**Parámetros del Body explicados:**
- `usuario_id` (opcional): ID del usuario al que asignar la cotización. Si la solicitud es de una empresa registrada, puedes asignar un usuario específico.
- `empresa_id` (opcional): ID de la empresa. Solo necesario si la solicitud es tipo `empresa` y quieres vincularla a una empresa registrada.
- `valor_uf` (opcional): Valor de la UF en CLP. Si no se proporciona, se obtiene automáticamente desde la API de mindicador.cl.
- `observaciones` (opcional): Observaciones adicionales para la cotización. Se puede incluir información relevante de la solicitud original.
- `residuos` (obligatorio): Array de objetos con:
  - `residuo_id` (obligatorio): ID del residuo del catálogo disponible
  - `cantidad` (obligatorio): Cantidad del residuo (debe ser mayor a 0)
  - `precio_unitario` (opcional): Precio unitario personalizado. Si no se proporciona, se usa el precio del catálogo.
  - `moneda` (opcional): Moneda del precio (`UF` o `CLP`). Si no se proporciona, se usa la moneda del catálogo.

**Ejemplo completo con todos los parámetros:**
```json
{
  "usuario_id": 1,
  "empresa_id": 1,
  "valor_uf": 37500.50,
  "observaciones": "Cotización generada desde solicitud SOL-000001. Cliente requiere servicio urgente.",
  "residuos": [
    {
      "residuo_id": 1,
      "cantidad": 200,
      "precio_unitario": 1.00,
      "moneda": "UF"
    },
    {
      "residuo_id": 10,
      "cantidad": 50
    }
  ]
}
```

**Flujo recomendado:**
1. Obtener lista de solicitudes pendientes: `GET /solicitudes-cotizacion?estado=pendiente`
2. Revisar detalles de una solicitud: `GET /solicitudes-cotizacion/:id`
3. Obtener catálogo de residuos disponibles: `GET /residuos`
4. Convertir solicitud a cotización: `POST /solicitudes-cotizacion/:id/convertir-cotizacion`
5. Verificar la cotización creada: `GET /cotizaciones/:id`

---

### 📋 20. OBTENER SOLICITUDES DE COTIZACIÓN (ADMIN)

**Método:** `GET`  
**URL:** `{{baseUrl}}/solicitudes-cotizacion`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Query Parameters (opcionales):**
- `estado`: Filtrar por estado (`pendiente`, `en_revision`, `cotizada`, `rechazada`)
- `tipo`: Filtrar por tipo (`empresa`, `particular`)
- `pagina`: Número de página (default: 1)
- `limite`: Cantidad por página (default: 10)

**Ejemplo:** `{{baseUrl}}/solicitudes-cotizacion?estado=pendiente&limite=20`

**Respuesta Esperada (200):**
```json
{
  "solicitudes": [
    {
      "id": 1,
      "numero_solicitud": "SOL-000001",
      "tipo_solicitud": "empresa",
      "nombre_solicitante": "Juan Pérez",
      "email": "juan@example.com",
      "telefono": "+56912345678",
      "empresa_nombre": "Empresa Ejemplo S.A.",
      "empresa_rut": "76.123.456-7",
      "empresa_giro": "Servicios Industriales",
      "direccion": "Av. Principal 1234",
      "region_id": 1,
      "region_nombre": "Metropolitana",
      "comuna_id": 1,
      "comuna_nombre": "Santiago",
      "descripcion_residuos": "Aceite usado industrial y baterías de plomo",
      "cantidad_estimada": "200 litros de aceite, 50 baterías",
      "frecuencia_retiro": "mensual",
      "observaciones": "Necesito retiro urgente",
      "urgencia": "alta",
      "estado": "pendiente",
      "fecha_solicitud": "2025-01-13T10:30:00.000Z",
      "cotizacion_id": null,
      "numero_cotizacion": null
    }
  ],
  "total": 1,
  "pagina": 1,
  "limite": 10,
  "totalPaginas": 1
}
```

---

### 👁️ 21. OBTENER SOLICITUD POR ID (ADMIN)

**Método:** `GET`  
**URL:** `{{baseUrl}}/solicitudes-cotizacion/:id`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Respuesta Esperada (200):**
```json
{
  "solicitud": {
    "id": 1,
    "numero_solicitud": "SOL-000001",
    "tipo_solicitud": "empresa",
    "nombre_solicitante": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "+56912345678",
    "empresa_nombre": "Empresa Ejemplo S.A.",
    "empresa_rut": "76.123.456-7",
    "empresa_giro": "Servicios Industriales",
    "direccion": "Av. Principal 1234",
    "region_id": 1,
    "region_nombre": "Metropolitana",
    "comuna_id": 1,
    "comuna_nombre": "Santiago",
    "descripcion_residuos": "Aceite usado industrial y baterías de plomo",
    "cantidad_estimada": "200 litros de aceite, 50 baterías",
    "frecuencia_retiro": "mensual",
    "observaciones": "Necesito retiro urgente",
    "urgencia": "alta",
    "estado": "pendiente",
    "fecha_solicitud": "2025-01-13T10:30:00.000Z"
  }
}
```

---

### 📊 22. FILTRAR COTIZACIONES POR ESTADO (ADMIN)

**Método:** `GET`  
**URL:** `{{baseUrl}}/cotizaciones/estado/:estado`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Estados válidos:** `pendiente`, `aceptada`, `rechazada`, `expirada`

**Ejemplo:** `{{baseUrl}}/cotizaciones/estado/pendiente`

---

### 📦 22.1. OBTENER CATÁLOGO DE RESIDUOS (PÚBLICO)

**Método:** `GET`  
**URL:** `{{baseUrl}}/residuos`

**Headers:** (Ninguno requerido - endpoint público)

**Respuesta Esperada (200):**
```json
[
  {
    "id": 1,
    "descripcion": "ACEITE",
    "precio": 1.00,
    "unidad": "IBC",
    "moneda": "UF"
  },
  {
    "id": 2,
    "descripcion": "ACEITE CON TRAZAS DE AGUA",
    "precio": 6.00,
    "unidad": "IBC",
    "moneda": "UF"
  },
  {
    "id": 10,
    "descripcion": "CARCASAS DE BATERÍAS",
    "precio": 7.50,
    "unidad": "UNIDAD",
    "moneda": "UF"
  }
]
```

**⚠️ NOTA:** Este endpoint es público y no requiere autenticación. Úsalo para obtener la lista de residuos disponibles al crear cotizaciones o convertir solicitudes.

**Unidades permitidas:** `IBC`, `UNIDAD`, `TONELADA`, `TAMBOR`, `KL`, `LT`, `M3`

---

### 📝 22.2. BUSCAR RESIDUOS (PÚBLICO)

**Método:** `GET`  
**URL:** `{{baseUrl}}/residuos/search?q=texto`

**Query Parameters:**
- `q` (obligatorio): Texto a buscar en la descripción

**Ejemplo:** `{{baseUrl}}/residuos/search?q=aceite`

**Headers:** (Ninguno requerido - endpoint público)

---

### ➕ 22.3. CREAR RESIDUO (ADMIN)

**Método:** `POST`  
**URL:** `{{baseUrl}}/admin/residuos/crear`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{adminToken}}
```

**Body (raw - JSON):**
```json
{
  "descripcion": "ACEITE USADO INDUSTRIAL",
  "precio": 1.50,
  "unidad": "M3",
  "moneda": "UF"
}
```

**Unidades válidas:** `IBC`, `UNIDAD`, `TONELADA`, `TAMBOR`, `KL`, `LT`, `M3`  
**Monedas válidas:** `UF`, `CLP`

**Respuesta Esperada (201):**
```json
{
  "message": "Residuo creado exitosamente",
  "residuoId": 1
}
```

**Error si unidad no válida (400):**
```json
{
  "message": "Unidad no válida. Valores permitidos: IBC, UNIDAD, TONELADA, TAMBOR, KL, LT, M3",
  "unidadRecibida": "KG"
}
```

---

### ✏️ 22.4. ACTUALIZAR RESIDUO (ADMIN)

**Método:** `PUT`  
**URL:** `{{baseUrl}}/residuos/:id`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{adminToken}}
```

**Body (raw - JSON):**
```json
{
  "descripcion": "ACEITE USADO INDUSTRIAL ACTUALIZADO",
  "precio": 2.00,
  "unidad": "M3",
  "moneda": "UF"
}
```

---

### 🗑️ 22.5. ELIMINAR RESIDUO (ADMIN)

**Método:** `DELETE`  
**URL:** `{{baseUrl}}/residuos/:id`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

---

## 🏠 SISTEMA DE VISITAS CON COTIZACIONES

### 📅 23. CREAR VISITA (ADMIN)

**Método:** `POST`  
**URL:** `{{baseUrl}}/admin/visitas`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{adminToken}}
```

**Body (raw - JSON):**
```json
{
  "usuario_id": 1,
  "empresa_id": 1,
  "cotizacion_id": 1,
  "fecha": "2025-01-20",
  "hora": "10:00:00",
  "motivo": "retiro",
  "observaciones": "Visita relacionada con cotización COT-000001"
}
```

**Respuesta Esperada (201):**
```json
{
  "message": "Visita creada exitosamente",
  "visita": {
      "id": 1,
    "usuario_id": 1,
    "empresa_id": 1,
    "cotizacion_id": 1,
    "fecha": "2025-01-20",
    "hora": "10:00:00",
    "motivo": "retiro",
    "estado": "pendiente"
  }
}
```

---

### 🔍 24. LISTAR TODAS LAS VISITAS (ADMIN)

**Método:** `GET`  
**URL:** `{{baseUrl}}/admin/visitas`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Respuesta Esperada (200):**
```json
{
  "visitas": [
    {
    "id": 1,
    "usuario_id": 1,
    "usuario_nombre": "Juan Pérez",
    "empresa_id": 1,
    "empresa_nombre": "Empresa Ejemplo S.A.",
        "cotizacion_id": 1,
      "numero_cotizacion": "COT-000001",
      "cotizacion_total": 7500100.00,
      "cotizacion_estado": "pendiente",
      "fecha": "2025-01-20",
      "hora": "10:00:00",
      "motivo": "retiro",
      "estado": "pendiente",
      "observaciones": "Visita relacionada con cotización COT-000001",
      "fecha_creacion": "2025-01-13T10:30:00.000Z"
    }
  ]
}
```

---

### 🔗 25. FILTRAR VISITAS (ADMIN)

**Por empresa:**  
`GET {{baseUrl}}/admin/visitas/empresa/:empresa_id`

**Por estado:**  
`GET {{baseUrl}}/admin/visitas/estado/:estado`

**Por motivo:**  
`GET {{baseUrl}}/admin/visitas/motivo/:motivo`

**Por fecha (YYYY-MM-DD):**  
`GET {{baseUrl}}/admin/visitas/fecha/:fecha`

---

### 👤 26. MIS VISITAS (USUARIO AUTENTICADO)

**Método:** `GET`  
**URL:** `{{baseUrl}}/mis-visitas`

**Headers:**
```
Authorization: Bearer {{userToken}}
```

---

### ✅ 27. GESTIONAR ESTADO DE VISITA (USUARIO AUTENTICADO)

- Aceptar: `PUT {{baseUrl}}/visitas/:id/aceptar`
- Rechazar: `PUT {{baseUrl}}/visitas/:id/rechazar`
- Solicitar reprogramación: `PUT {{baseUrl}}/visitas/:id/reprogramar`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{userToken}}
```

---

## 📄 SISTEMA DE CERTIFICADOS

### 📦 37. CREAR CERTIFICADO Y ENVIAR EMAIL (ADMIN)

**Método:** `POST`  
**URL:** `{{baseUrl}}/admin/certificados`

**Headers:**
```
Authorization: Bearer {{adminToken}}
Content-Type: multipart/form-data
```

**Body (form-data):**
- `user_id` (número, obligatorio): ID del usuario
- `empresa_id` (número, opcional): ID de la empresa
- `visita_id` (número, opcional): ID de la visita relacionada
- `descripcion` (texto, opcional): Descripción del certificado
- `archivo` (archivo PDF, obligatorio): Archivo PDF del certificado

**Respuesta Esperada (201):**
```json
{
  "message": "Certificado creado y enviado exitosamente",
  "certificado": {
    "id": 1,
    "user_id": 1,
    "empresa_id": 1,
    "visita_id": 1,
    "descripcion": "Certificado de retiro de residuos",
    "archivo_pdf": "certificados/certificado_1.pdf",
    "fecha_emision": "2025-01-13"
  }
}
```

**⚠️ NOTA:** El certificado se envía automáticamente por email al usuario con un template HTML profesional.

---

### 🔁 38. REENVIAR CERTIFICADO POR EMAIL (ADMIN)

**Método:** `POST`  
**URL:** `{{baseUrl}}/admin/certificados/:id/reenviar`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

---

### 📋 39. LISTAR CERTIFICADOS (ADMIN)

- Todos: `GET {{baseUrl}}/admin/certificados`
- Por empresa: `GET {{baseUrl}}/admin/certificados/empresa/:empresa_id`
- Por visita: `GET {{baseUrl}}/admin/certificados/visita/:visita_id`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

---

### ✏️ 40. ACTUALIZAR O ELIMINAR CERTIFICADO (ADMIN)

- Actualizar descripción: `PUT {{baseUrl}}/admin/certificados/:id`
- Eliminar: `DELETE {{baseUrl}}/admin/certificados/:id`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{adminToken}}
```

---

### 👥 41. CERTIFICADOS PARA USUARIOS AUTENTICADOS

- Listar los propios: `GET {{baseUrl}}/mis-certificados`
- Ver detalle: `GET {{baseUrl}}/certificados/:id`
- Descargar PDF: `GET {{baseUrl}}/certificados/:id/descargar`

**Headers:**
```
Authorization: Bearer {{userToken}}
```

---

## 📧 SISTEMA DE EMAIL/IMAP

### 🔍 30. VERIFICAR CONEXIÓN IMAP (ADMIN)

**Método:** `GET`  
**URL:** `{{baseUrl}}/email/verificar`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Respuesta Esperada (200):**
```json
{
  "success": true,
  "message": "Conexión IMAP exitosa"
}
```

**Error si conexión falla (500):**
```json
{
  "success": false,
  "error": "Error al conectar con el servidor IMAP"
}
```

---

### 📬 31. OBTENER CORREOS IMAP (ADMIN)

**Método:** `GET`  
**URL:** `{{baseUrl}}/email/correos`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Query Parameters (opcionales):**
- `cantidad`: Número de correos a obtener (default: 10)
- `noLeidos`: true/false - Solo correos no leídos (default: false)
- `carpeta`: Carpeta IMAP (default: 'INBOX')

**Ejemplo:** `{{baseUrl}}/email/correos?cantidad=20&noLeidos=true`

**Respuesta Esperada (200):**
```json
{
  "success": true,
  "total": 15,
  "procesados": 10,
  "correos": [
    {
      "uid": 12345,
      "asunto": "Solicitud de cotización",
      "remitente": {
        "nombre": "Juan Pérez",
        "email": "juan@example.com"
      },
      "destinatarios": {
        "para": ["contacto@felmart.com"],
        "cc": [],
        "bcc": []
      },
      "fecha": "2025-01-13T10:30:00.000Z",
      "texto": "Contenido del correo en texto plano",
      "html": "<p>Contenido del correo en HTML</p>",
      "adjuntos": [
        {
          "nombre": "documento.pdf",
          "tipo": "application/pdf",
          "tamaño": 102400
        }
      ],
      "leido": false,
      "flags": ["\\Seen"]
    }
  ]
}
```

---

### 📨 32. OBTENER CORREOS NO LEÍDOS (ADMIN)

**Método:** `GET`  
**URL:** `{{baseUrl}}/email/correos/no-leidos`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Query Parameters (opcionales):**
- `cantidad`: Número de correos a obtener (default: 10)

**Respuesta Esperada (200):**
```json
{
  "success": true,
  "total": 5,
  "procesados": 5,
  "correos": [...]
}
```

---

### ✅ 33. MARCAR CORREO COMO LEÍDO (ADMIN)

**Método:** `POST`  
**URL:** `{{baseUrl}}/email/correos/:uid/marcar-leido`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Respuesta Esperada (200):**
```json
{
  "success": true,
  "message": "Correo marcado como leído"
}
```

---

### 🗑️ 34. ELIMINAR CORREO (ADMIN)

**Método:** `DELETE`  
**URL:** `{{baseUrl}}/email/correos/:uid`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Respuesta Esperada (200):**
```json
{
  "success": true,
  "message": "Correo eliminado"
}
```

---

## 💵 SISTEMA DE VALOR UF

### 💰 35. OBTENER VALOR UF ACTUAL (PÚBLICO)

**Método:** `GET`  
**URL:** `{{baseUrl}}/uf/valor-actual`

**Headers:** (Ninguno requerido - endpoint público)

**Respuesta Esperada (200):**
```json
{
  "fecha": "2025-01-13",
  "uf": 37500.50
}
```

**⚠️ NOTA:** Este endpoint obtiene el valor de la UF desde la API pública de mindicador.cl. El valor se actualiza diariamente.

---

## 📞 SISTEMA DE CONTACTO

### 📧 36. ENVIAR MENSAJE DE CONTACTO (PÚBLICO)

**Método:** `POST`  
**URL:** `{{baseUrl}}/contacto/enviar`

**Headers:**
```
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "+56912345678",
  "mensaje": "Me interesa conocer más sobre sus servicios de gestión de residuos."
}
```

**Campos obligatorios:**
- `nombre` (string)
- `email` (string, debe ser válido)
- `mensaje` (string)

**Campos opcionales:**
- `telefono` (string)

**Respuesta Esperada (200):**
```json
{
  "message": "Gracias por contactarnos. Te responderemos a la brevedad."
}
```

**Error si email inválido (400):**
```json
{
  "message": "El correo electrónico ingresado no es válido."
}
```

**Error si faltan campos (400):**
```json
{
  "message": "Nombre, correo y mensaje son obligatorios."
}
```

**⚠️ NOTA:** El mensaje se envía por email a las direcciones configuradas en las variables de entorno (`CONTACT_EMAILS`, `CONTACT_EMAIL`, `EMAIL_CONTACT` o `EMAIL_USER`).

---

## 🔔 SISTEMA DE NOTIFICACIONES PARA ADMINISTRADORES

### 📊 42. OBTENER RESUMEN DE NOTIFICACIONES (LOGIN)

**Método:** `GET`  
**URL:** `{{baseUrl}}/notificaciones/resumen-login`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Respuesta Esperada (200):**
```json
{
  "estadisticas": {
    "total": 15,
    "no_leidas": 8,
    "criticas_no_leidas": 2,
    "altas_no_leidas": 3,
    "solicitudes_pendientes": 5,
    "visitas_proximas": 2,
    "empresas_pendientes": 1
  },
  "criticas": [
    {
      "id": 1,
      "tipo": "solicitud_pendiente",
      "titulo": "5 Solicitud(es) de Cotización Pendiente(s)",
      "mensaje": "Hay 5 solicitud(es) de cotización esperando revisión.",
      "prioridad": "alta",
      "leida": false,
      "fecha_creacion": "2025-01-13T10:30:00.000Z",
      "datos_adicionales": {
        "cantidad": 5,
        "solicitudes": [...]
      }
    }
  ],
  "altas": [...],
  "ultimas": [...],
  "resumen": {
    "total_no_leidas": 8,
    "criticas_no_leidas": 2,
    "altas_no_leidas": 3,
    "solicitudes_pendientes": 5,
    "visitas_proximas": 2,
    "empresas_pendientes": 1
  }
}
```

---

### 📋 43. OBTENER TODAS LAS NOTIFICACIONES

**Método:** `GET`  
**URL:** `{{baseUrl}}/notificaciones`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Query Parameters:**
- `solo_no_leidas`: true/false
- `limite`: número de notificaciones (default: 50)
- `tipo`: filtrar por tipo
- `prioridad`: filtrar por prioridad

**Ejemplo:** `{{baseUrl}}/notificaciones?solo_no_leidas=true&limite=10&prioridad=critica`

---

### ✅ 44. MARCAR NOTIFICACIÓN COMO LEÍDA

**Método:** `PUT`  
**URL:** `{{baseUrl}}/notificaciones/1/leer`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Respuesta Esperada (200):**
```json
{
  "message": "Notificación marcada como leída"
}
```

---

### ✅ 45. MARCAR TODAS LAS NOTIFICACIONES COMO LEÍDAS

**Método:** `PUT`  
**URL:** `{{baseUrl}}/notificaciones/marcar-todas-leidas`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Respuesta Esperada (200):**
```json
{
  "message": "Todas las notificaciones marcadas como leídas",
  "notificaciones_actualizadas": 8
}
```

---

### 🗑️ 46. ELIMINAR NOTIFICACIÓN

**Método:** `DELETE`  
**URL:** `{{baseUrl}}/notificaciones/1`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

---

### 🔔 47. GENERAR NOTIFICACIONES AUTOMÁTICAS

**Método:** `POST`  
**URL:** `{{baseUrl}}/notificaciones/generar-automaticas`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Respuesta Esperada (200):**
```json
{
  "message": "Notificaciones automáticas generadas exitosamente",
  "resultado": {
    "solicitudes_generadas": 5,
    "visitas_generadas": 2,
    "empresas_generadas": 1,
    "cotizaciones_generadas": 3
  }
}
```

---

### 📊 48. OBTENER ESTADÍSTICAS DE NOTIFICACIONES

**Método:** `GET`  
**URL:** `{{baseUrl}}/notificaciones/estadisticas`

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Respuesta Esperada (200):**
```json
{
  "total": 15,
  "no_leidas": 8,
  "criticas_no_leidas": 2,
  "altas_no_leidas": 3,
  "solicitudes_pendientes": 5,
  "visitas_proximas": 2,
  "empresas_pendientes": 1
}
```

---

## 🧪 CASOS DE PRUEBA DE ERRORES

### ❌ Error: Contraseña débil en registro

**POST** `{{baseUrl}}/register`

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "123"
}
```

**Respuesta (400):**
```json
{
  "message": "La contraseña no cumple con los requisitos de seguridad",
  "errors": [
    "Debe tener al menos 8 caracteres",
    "Debe contener al menos una letra mayúscula",
    "Debe contener al menos una letra minúscula",
    "Debe contener al menos un número",
    "Debe contener al menos un carácter especial"
  ]
}
```

---

### ❌ Error: Token de recuperación inválido

**POST** `{{baseUrl}}/password-reset/:token`

**Body:**
```json
{
  "token": "token_invalido",
  "newPassword": "NuevaPassword123!"
}
```

**Respuesta (400):**
```json
{
  "message": "Token inválido o expirado"
}
```

---

### ❌ Error: Cotización sin empresa cuando tipo es 'empresa'

**POST** `{{baseUrl}}/admin/cotizaciones`

**Body:**
```json
{
  "tipo_cotizacion": "empresa",
  "usuario_id": 1,
  "residuos": [...]
}
```

**Respuesta (400):**
```json
{
  "message": "Para cotizaciones de empresa se requiere empresa_id"
}
```

---

### ❌ Error: Empresa sin usuarios asignados

**POST** `{{baseUrl}}/admin/cotizaciones`

**Body:**
```json
{
  "tipo_cotizacion": "empresa",
  "empresa_id": 1,
  "residuos": [
    {
      "residuo_id": 1,
      "cantidad": 100
    }
  ]
}
```

**Respuesta (400):**
```json
{
  "message": "La empresa no tiene usuarios asignados. Debe asignar al menos un usuario a la empresa antes de crear una cotización."
}
```

---

### ❌ Error: Usuario no asignado a la empresa

**POST** `{{baseUrl}}/admin/cotizaciones`

**Body:**
```json
{
  "tipo_cotizacion": "empresa",
  "empresa_id": 1,
  "usuario_id": 99,
  "residuos": [
    {
      "residuo_id": 1,
      "cantidad": 100
    }
  ]
}
```

**Respuesta (400):**
```json
{
  "message": "El usuario con ID 99 no está asignado a esta empresa. Usuarios asignados: 1, 2, 3"
}
```

---

## 📝 EJEMPLOS DE DATOS PARA PRUEBAS

### Usuario con contraseña fuerte:
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "MiPassword123!",
  "direccion": "Av. Libertador 1234",
  "telefono": "+56912345678",
  "region_id": 1,
  "comuna_id": 1
}
```

### Empresa con múltiples usuarios:
```json
{
  "rut": "76.123.456-7",
  "nombre": "Empresa Ejemplo S.A.",
  "giro": "Servicios Industriales",
  "direccion": "Av. Principal 1234",
  "kilometraje": 15,
  "region_id": 1,
  "comuna_id": 1,
  "usuarios": [
    {
      "usuario_id": 1,
      "rol": "admin"
    },
    {
      "usuario_id": 2,
      "rol": "usuario"
    },
    {
      "usuario_id": 3,
      "rol": "lector"
    }
  ]
}
```

### Solicitud de cotización completa:
```json
{
  "tipo_solicitud": "empresa",
  "nombre_solicitante": "María González",
  "email": "maria@empresa.com",
  "telefono": "+56987654321",
  "empresa_nombre": "Industrias González Ltda.",
  "empresa_rut": "76.555.444-3",
  "empresa_giro": "Manufactura",
  "direccion": "Calle Industrial 567",
  "region_id": 7,
  "comuna_id": 2,
  "descripcion_residuos": "Aceite usado industrial, baterías de plomo y residuos químicos",
  "cantidad_estimada": "500 litros de aceite, 100 baterías, 200 kg químicos",
  "frecuencia_retiro": "quincenal",
  "observaciones": "Necesitamos servicio regular para cumplir con normativas ambientales",
  "urgencia": "media"
}
```

---

## 🎯 FLUJO DE PRUEBA COMPLETO EN POSTMAN

### Paso 1: Configurar Variables
1. Ve a **Environments** en Postman
2. Crea un nuevo environment llamado "FELMART Local"
3. Agrega las variables:
   - `baseUrl`: `http://localhost:3000/api`
   - `token`: (dejar vacío)
   - `adminToken`: (dejar vacío)
   - `userToken`: (dejar vacío)
4. Selecciona este environment

### Paso 2: Registrar Usuario
1. Selecciona **POST** `{{baseUrl}}/register`
2. En **Body** → **raw** → **JSON**, pega:
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "MiPassword123!",
  "direccion": "Av. Libertador 1234",
  "telefono": "+56912345678",
  "region_id": 1,
  "comuna_id": 1
}
```
3. Click en **Send**

### Paso 3: Hacer Login como Usuario
1. Selecciona **POST** `{{baseUrl}}/login`
2. En **Body** → **raw** → **JSON**, pega:
```json
{
  "email": "juan@example.com",
  "password": "MiPassword123!"
}
```
3. Click en **Send**
4. **COPIA el token de la respuesta** y pégalo en la variable `{{userToken}}`

### Paso 4: Hacer Login como Admin
1. Selecciona **POST** `{{baseUrl}}/login`
2. En **Body** → **raw** → **JSON**, pega:
```json
{
  "email": "admin@felmart.com",
  "password": "admin123"
}
```
3. Click en **Send**
4. **COPIA el token de la respuesta** y pégalo en la variable `{{adminToken}}`
5. **OBSERVA las notificaciones** en la respuesta

### Paso 5: Probar Funcionalidades Nuevas

#### Crear Empresa con Usuarios
1. **POST** `{{baseUrl}}/empresas`
2. Headers: `Authorization: Bearer {{adminToken}}`
3. Body: Datos de empresa con usuarios

#### Crear Cotización Flexible
1. **POST** `{{baseUrl}}/admin/cotizaciones`
2. Headers: `Authorization: Bearer {{adminToken}}`
3. Body: Cotización para usuario o empresa

#### Gestionar Notificaciones
1. **GET** `{{baseUrl}}/notificaciones/resumen-login`
2. Headers: `Authorization: Bearer {{adminToken}}`
3. Ver estadísticas y notificaciones

#### Cambiar Contraseña
1. **PUT** `{{baseUrl}}/change-password/1` (reemplaza 1 con tu ID de usuario)
2. Headers: `Authorization: Bearer {{userToken}}`
3. Body: Contraseña actual y nueva

---

## 📊 CÓDIGOS DE RESPUESTA HTTP

| Código | Significado | Cuándo aparece |
|--------|-------------|----------------|
| 200 | OK | Operación exitosa |
| 201 | Created | Registro/Creación exitosa |
| 400 | Bad Request | Datos faltantes o inválidos |
| 401 | Unauthorized | Token inválido o faltante |
| 403 | Forbidden | Sin permisos para la acción |
| 404 | Not Found | Recurso no encontrado |
| 500 | Server Error | Error del servidor |

---

## 🎨 ESTRUCTURA DE COLECCIÓN EN POSTMAN

Organiza tus peticiones así:

```
📁 FELMART API
  ├── 📁 Autenticación
  │   ├── POST Registro de Usuario
  │   ├── POST Login (Usuario o Admin)
  │   ├── PUT Cambiar Contraseña
  │   ├── POST Solicitar Recuperación
  │   ├── POST Restablecer Contraseña
  │   └── GET Verificar Token
  ├── 📁 Usuarios (Protegidos)
  │   ├── GET Listar Todos los Usuarios
  │   ├── GET Obtener Usuario por ID
  │   ├── PUT Actualizar Usuario
  │   └── DELETE Eliminar Usuario
  ├── 📁 Empresas Multi-Usuario
  │   ├── GET Listar Empresas
  │   ├── POST Crear Empresa
  │   ├── GET Ver Empresa con Usuarios
  │   ├── POST Agregar Usuario
  │   ├── PUT Actualizar Rol
  │   └── DELETE Remover Usuario
  ├── 📁 Residuos
  │   ├── 📁 Público
  │   │   ├── GET Catálogo de Residuos
  │   │   ├── GET Buscar Residuos
  │   │   └── GET Obtener Residuo por ID
  │   └── 📁 Admin
  │       ├── POST Crear Residuo
  │       ├── PUT Actualizar Residuo
  │       └── DELETE Eliminar Residuo
  ├── 📁 Cotizaciones Mejoradas
  │   ├── 📁 Público
  │   │   ├── POST Solicitar Cotización
  │   │   └── GET Catálogo de Residuos
  │   ├── 📁 Usuario
  │   │   ├── GET Mis Cotizaciones
  │   │   ├── GET Ver Cotización
  │   │   ├── PUT Aceptar Cotización
  │   │   └── PUT Rechazar Cotización
  │   └── 📁 Admin
  │       ├── GET Listar Cotizaciones
  │       ├── GET Filtrar por Estado
  │       ├── GET Ver Cotización Detallada
  │       ├── POST Crear Cotización Flexible
  │       ├── DELETE Eliminar Cotización
  │       ├── GET Listar Solicitudes
  │       ├── GET Obtener Solicitud por ID
  │       └── POST Convertir Solicitud a Cotización
  ├── 📁 Visitas con Cotizaciones
  │   ├── POST Crear Visita
  │   ├── GET Listar Visitas
  │   ├── PUT Asignar Cotización
  │   └── PUT Desasignar Cotización
  ├── 📁 Certificados
  │   ├── 📁 Usuario
  │   │   ├── GET Mis Certificados
  │   │   ├── GET Ver Certificado
  │   │   └── GET Descargar PDF
  │   └── 📁 Admin
  │       ├── POST Crear Certificado
  │       ├── POST Reenviar por Email
  │       ├── GET Listar Certificados
  │       ├── GET Por Empresa
  │       ├── GET Por Visita
  │       ├── PUT Actualizar
  │       └── DELETE Eliminar
  ├── 📁 Email/IMAP (Admin)
  │   ├── GET Verificar Conexión
  │   ├── GET Obtener Correos
  │   ├── GET Correos No Leídos
  │   ├── POST Marcar como Leído
  │   └── DELETE Eliminar Correo
  ├── 📁 Valor UF (Público)
  │   └── GET Valor UF Actual
  ├── 📁 Contacto (Público)
  │   └── POST Enviar Mensaje
  └── 📁 Notificaciones Admin
      ├── GET Resumen Login
      ├── GET Todas las Notificaciones
      ├── GET Estadísticas
      ├── PUT Marcar como Leída
      ├── PUT Marcar Todas Leídas
      ├── DELETE Eliminar Notificación
      └── POST Generar Automáticas
```

---

## 🚀 QUICK START - Copiar y Pegar

### 1️⃣ Registro con Contraseña Fuerte
```
POST: {{baseUrl}}/register
Body JSON:
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "MiPassword123!",
  "direccion": "Av. Libertador 1234",
  "telefono": "+56912345678",
  "region_id": 1,
  "comuna_id": 1
}
```

### 2️⃣ Login Usuario
```
POST: {{baseUrl}}/login
Body JSON:
{
  "email": "juan@example.com",
  "password": "MiPassword123!"
}
```

### 3️⃣ Login Admin (con Notificaciones)
```
POST: {{baseUrl}}/login
Body JSON:
{
  "email": "admin@felmart.com",
  "password": "admin123"
}
```

### 4️⃣ Cambiar Contraseña
```
PUT: {{baseUrl}}/change-password/1
Header: Authorization: Bearer {{userToken}}
Content-Type: application/json
Body JSON:
{
  "currentPassword": "MiPassword123!",
  "newPassword": "NuevaPassword456@"
}

⚠️ IMPORTANTE: 
- Reemplaza el número "1" en la URL con tu ID de usuario real
- Solo puedes cambiar tu propia contraseña
- La nueva contraseña debe cumplir los requisitos de seguridad
```

### 5️⃣ Crear Empresa con Usuarios
```
POST: {{baseUrl}}/empresas
Header: Authorization: Bearer {{adminToken}}
Body JSON:
{
  "rut": "76.123.456-7",
  "nombre": "Empresa Ejemplo S.A.",
  "giro": "Servicios Industriales",
  "direccion": "Av. Principal 1234",
  "region_id": 1,
  "comuna_id": 1,
  "usuarios": [
    {
      "usuario_id": 1,
      "rol": "admin"
    }
  ]
}
```

### 6️⃣ Crear Cotización Flexible
```
POST: {{baseUrl}}/admin/cotizaciones
Header: Authorization: Bearer {{adminToken}}
Body JSON (Cotización para Empresa - usuario_id OPCIONAL):
{
  "tipo_cotizacion": "empresa",
  "empresa_id": 1,
  "residuos": [
    {
      "residuo_id": 1,
      "cantidad": 100
    }
  ],
  "observaciones": "Cotización para empresa"
}

⚠️ IMPORTANTE:
- Si NO envías usuario_id, se tomará automáticamente el primer usuario asignado a la empresa
- Si SÍ envías usuario_id, debe pertenecer a la empresa
- La empresa debe tener al menos un usuario asignado

Body JSON (Cotización para Usuario):
{
  "tipo_cotizacion": "usuario",
  "usuario_id": 1,
  "residuos": [
    {
      "residuo_id": 1,
      "cantidad": 100
    }
  ],
  "observaciones": "Cotización para usuario"
}
```

**Body JSON (Cotización con Precios Personalizados):**
```
{
  "tipo_cotizacion": "usuario",
  "usuario_id": 1,
  "residuos": [
    {
      "residuo_id": 1,
      "cantidad": 100,
      "precio_unitario": 1.50,
      "moneda": "UF"
    },
    {
      "residuo_id": 2,
      "cantidad": 50,
      "precio_unitario": 50000,
      "moneda": "CLP"
    }
  ],
  "observaciones": "Cotización con precios personalizados"
}

⚠️ IMPORTANTE - Precios Personalizados:
- precio_unitario (opcional): Sobrescribe el precio del catálogo
- moneda (opcional): Cambia la moneda del precio (UF o CLP)
- Si no proporcionas precio_unitario, se usa el precio base del catálogo
- Si no proporcionas moneda, se usa la moneda del catálogo
```

### 6️⃣.1 Convertir Solicitud a Cotización
```
POST: {{baseUrl}}/solicitudes-cotizacion/1/convertir-cotizacion
Header: Authorization: Bearer {{adminToken}}
Content-Type: application/json
Body JSON:
{
  "usuario_id": 1,
  "empresa_id": 1,
  "observaciones": "Cotización generada desde solicitud SOL-000001",
  "residuos": [
    {
      "residuo_id": 1,
      "cantidad": 200
    },
    {
      "residuo_id": 10,
      "cantidad": 50
    }
  ]
}

⚠️ IMPORTANTE:
- Reemplaza "1" en la URL con el ID de la solicitud que deseas convertir
- usuario_id y empresa_id son opcionales
- residuos es obligatorio y debe contener al menos un residuo válido
- La solicitud debe estar en estado "pendiente" o "en_revision"
- Después de convertir, la solicitud se marca automáticamente como "cotizada"
- Puedes obtener la lista de residuos disponibles con: GET {{baseUrl}}/residuos
```

### 6️⃣.2 Obtener Solicitudes Pendientes
```
GET: {{baseUrl}}/solicitudes-cotizacion?estado=pendiente
Header: Authorization: Bearer {{adminToken}}
```

### 6️⃣.3 Obtener Catálogo de Residuos
```
GET: {{baseUrl}}/residuos
(No requiere autenticación - endpoint público)
```

### 7️⃣ Ver Notificaciones Admin
```
GET: {{baseUrl}}/notificaciones/resumen-login
Header: Authorization: Bearer {{adminToken}}
```

### 8️⃣ Crear Visita con Cotización
```
POST: {{baseUrl}}/visitas
Header: Authorization: Bearer {{adminToken}}
Body JSON:
{
  "usuario_id": 1,
  "empresa_id": 1,
  "cotizacion_id": 1,
  "fecha": "2025-01-20",
  "hora": "10:00:00",
  "motivo": "retiro",
  "observaciones": "Visita relacionada con cotización"
}
```

---

## 💡 TIPS PARA POSTMAN

### ✅ Configurar Headers Automáticos
En tu colección, ve a **Authorization** → **Type: Bearer Token** → Value: `{{token}}`

### ✅ Guardar Tokens Automáticamente
En la petición de Login, pestaña **Tests**:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.user.tipo === 'admin') {
        pm.environment.set("adminToken", jsonData.token);
        console.log("✅ Token de admin guardado");
    } else {
        pm.environment.set("userToken", jsonData.token);
        console.log("✅ Token de usuario guardado");
    }
}
```

### ✅ Ver Variables
Console de Postman → Puedes ver el valor de `{{token}}` y otras variables

### ✅ Probar Secuencia Completa
1. Registro → 2. Login → 3. Crear Empresa → 4. Crear Cotización → 5. Crear Visita → 6. Ver Notificaciones

### ⚠️ IMPORTANTE: Cambiar Contraseña
1. **URL:** `PUT {{baseUrl}}/change-password/1` (reemplaza "1" con tu ID de usuario)
2. **Headers obligatorios:**
   - `Authorization: Bearer {{userToken}}`
   - `Content-Type: application/json`
3. **Body (raw JSON):**
   ```json
   {
     "currentPassword": "TuPassActual123!",
     "newPassword": "NuevaPassSegura123@"
   }
   ```
4. **Validaciones:**
   - La nueva contraseña debe tener al menos 8 caracteres
   - Debe contener mayúsculas, minúsculas, números y caracteres especiales
   - Solo puedes cambiar tu propia contraseña
   - El token debe ser válido y del usuario correspondiente

---

## 🔥 ESCENARIOS DE PRUEBA RECOMENDADOS

### Escenario 1: Flujo Completo de Empresa Multi-Usuario
1. ✅ Registrar usuarios → Verificar registro
2. ✅ Login como admin → Verificar notificaciones
3. ✅ Crear empresa con usuarios → Verificar asignación
4. ✅ Agregar más usuarios → Verificar roles
5. ✅ Actualizar roles → Verificar cambios
6. ✅ Crear cotización para empresa → Verificar tipo
7. ✅ Crear visita con cotización → Verificar relación

### Escenario 2: Sistema de Notificaciones
1. ✅ Login como admin → Verificar notificaciones automáticas
2. ✅ Generar notificaciones manuales → Verificar creación
3. ✅ Marcar como leídas → Verificar estado
4. ✅ Ver estadísticas → Verificar contadores
5. ✅ Eliminar notificaciones → Verificar limpieza

### Escenario 3: Recuperación de Contraseñas
1. ✅ Solicitar recuperación → Verificar token
2. ✅ Verificar token → Verificar validez
3. ✅ Restablecer contraseña → Verificar cambio
4. ✅ Login con nueva contraseña → Verificar acceso

### Escenario 4: Cotizaciones Flexibles
1. ✅ Crear cotización para usuario → Verificar tipo 'usuario'
2. ✅ Crear cotización para empresa sin usuario_id → Verificar que toma automáticamente el usuario asignado
3. ✅ Crear cotización para empresa con usuario_id válido → Verificar que acepta el usuario
4. ✅ Intentar crear cotización para empresa con usuario_id inválido → Verificar error 400
5. ✅ Intentar crear cotización para empresa sin usuarios asignados → Verificar error 400
6. ✅ Filtrar por tipo → Verificar filtros
7. ✅ Ver detalles completos → Verificar información

---

## 📥 IMPORTAR COLECCIÓN A POSTMAN

1. Descarga el archivo `FELMART_COMPLETA.postman_collection.json` (si está disponible)
2. En Postman → **Import** → Arrastra el archivo
3. La colección se importará con todos los endpoints configurados

---

## ⚡ ATAJOS ÚTILES

- **Ctrl/Cmd + Enter** = Enviar petición
- **Ctrl/Cmd + S** = Guardar petición
- **Ctrl/Cmd + E** = Editar environment
- **Alt + Click** en variable = Ver valor

---

## 🎯 DASHBOARD WEB DE NOTIFICACIONES

Accede al dashboard completo de notificaciones en:
```
http://localhost:3000/dashboard-notificaciones.html
```

**Características del Dashboard:**
- ✅ Estadísticas en tiempo real
- ✅ Notificaciones por prioridad
- ✅ Acciones de gestión (leer, eliminar)
- ✅ Auto-refresh cada 5 minutos
- ✅ Diseño responsive
- ✅ Interfaz intuitiva

---

¡Sistema completo de FELMART listo para usar! 🎉

**Funcionalidades implementadas:**
- ✅ Sistema de notificaciones automáticas
- ✅ Recuperación de contraseñas
- ✅ Empresas multi-usuario con roles
- ✅ Cotizaciones flexibles (usuario/empresa)
- ✅ Conversión de solicitudes públicas a cotizaciones
- ✅ Gestión de solicitudes de cotización (listar, filtrar, convertir)
- ✅ Visitas relacionadas con cotizaciones
- ✅ Dashboard web de notificaciones
- ✅ Validación robusta de contraseñas
- ✅ Generación automática de alertas
- ✅ Sistema de Email/IMAP completo
- ✅ Gestión de certificados PDF
- ✅ Catálogo de residuos con unidades (IBC, UNIDAD, TONELADA, TAMBOR, KL, LT, M3)
- ✅ Integración con API de UF (mindicador.cl)
- ✅ Formulario de contacto público
- ✅ Envío automático de emails con templates HTML

