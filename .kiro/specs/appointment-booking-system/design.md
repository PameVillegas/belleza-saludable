# Documento de Diseño

## Introducción

Este documento describe la arquitectura técnica y el plan de implementación del sistema de gestión de turnos. El sistema se implementa como una aplicación web full-stack con frontend responsivo y backend con API REST, desplegado en Render.

## Arquitectura General

### Stack Tecnológico

- **Frontend (SPA)**: React 18 con Vite (formulario de reserva pública)
- **Frontend (Panel Admin)**: HTML/JS vanilla (panel.html) — hecho a mano, sin frameworks
- **Frontend (Cliente)**: HTML/JS vanilla (cliente.html) — página estática
- **Backend**: Node.js con Express
- **Base de Datos**: PostgreSQL conectada vía `pg` pool (con soporte SSL para producción)
- **Autenticación**: Auth propio simple — comparación directa de username/password contra la base de datos, sesión guardada en localStorage
- **Despliegue**: Render (web service + base de datos PostgreSQL, plan free)
- **Notificaciones**: Envío de emails de confirmación (integración configurable)

### Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend                             │
│  ┌──────────────────┐  ┌────────────┐  ┌─────────────┐ │
│  │ React SPA (Vite) │  │ panel.html │  │cliente.html │ │
│  │ Reserva Online   │  │ Admin (JS) │  │ (JS vanilla)│ │
│  └──────────────────┘  └────────────┘  └─────────────┘ │
└──────────────────────────────────────────────────────────┘
                         │ HTTP/REST (fetch)
┌──────────────────────────────────────────────────────────┐
│                 Backend (Express API)                      │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────────────────┐│
│  │Turnos  │ │Clientes│ │Servicios│ │Disponibilidad    ││
│  │API     │ │API     │ │API      │ │API               ││
│  └────────┘ └────────┘ └─────────┘ └──────────────────┘│
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │Auth (simple)    │  │  Notification Service        │  │
│  │username/password│  │  (email configurable)        │  │
│  └─────────────────┘  └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                         │ pg pool (SSL en producción)
┌──────────────────────────────────────────────────────────┐
│                PostgreSQL Database (Render)               │
│  clients | services | appointments | schedules |          │
│  blocked_slots | admins                                   │
└──────────────────────────────────────────────────────────┘
```

## Modelo de Datos

### Tabla: clients
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | UUID | PK, auto-generado |
| name | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(50) | NOT NULL |
| email | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL, default now() |
| updated_at | TIMESTAMP | NOT NULL |

**Índices**: UNIQUE(email), UNIQUE(phone), INDEX(name)

### Tabla: services
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | UUID | PK, auto-generado |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | nullable |
| duration_minutes | INTEGER | NOT NULL |
| price | DECIMAL(10,2) | NOT NULL |
| is_active | BOOLEAN | NOT NULL, default true |
| created_at | TIMESTAMP | NOT NULL, default now() |
| updated_at | TIMESTAMP | NOT NULL |

### Tabla: schedules (horarios de atención)
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | UUID | PK, auto-generado |
| day_of_week | INTEGER | NOT NULL (0=domingo, 6=sábado) |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL |
| slot_duration_minutes | INTEGER | NOT NULL |
| is_active | BOOLEAN | NOT NULL, default true |

**Restricción**: CHECK(start_time < end_time)

### Tabla: blocked_slots (franjas bloqueadas)
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | UUID | PK, auto-generado |
| date | DATE | NOT NULL |
| start_time | TIME | nullable (null = día completo) |
| end_time | TIME | nullable (null = día completo) |
| reason | VARCHAR(255) | nullable |
| created_at | TIMESTAMP | NOT NULL, default now() |

### Tabla: appointments (turnos)
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | UUID | PK, auto-generado |
| client_id | UUID | FK → clients.id, NOT NULL |
| service_id | UUID | FK → services.id, NOT NULL |
| date | DATE | NOT NULL |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL |
| status | ENUM | NOT NULL ('confirmed', 'cancelled', 'completed') |
| source | ENUM | NOT NULL ('online', 'manual') |
| notes | TEXT | nullable |
| created_at | TIMESTAMP | NOT NULL, default now() |
| updated_at | TIMESTAMP | NOT NULL |

**Índices**: INDEX(date, start_time), INDEX(client_id), INDEX(status)
**Restricción**: CHECK(start_time < end_time)

### Tabla: admins
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | UUID | PK, auto-generado |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL, default now() |

## Endpoints API

### Públicos (sin autenticación)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/services | Lista servicios activos |
| GET | /api/availability/:serviceId | Obtiene fechas disponibles para un servicio |
| GET | /api/availability/:serviceId/:date | Obtiene franjas horarias disponibles |
| POST | /api/appointments | Crear turno (reserva online) |

### Protegidos (requieren JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Iniciar sesión admin |
| POST | /api/auth/logout | Cerrar sesión |
| GET | /api/admin/appointments | Listar turnos (con filtros de fecha) |
| GET | /api/admin/appointments/:id | Detalle de un turno |
| POST | /api/admin/appointments | Crear turno manual |
| PUT | /api/admin/appointments/:id | Modificar turno |
| PATCH | /api/admin/appointments/:id/cancel | Cancelar turno |
| GET | /api/admin/clients | Listar clientes |
| GET | /api/admin/clients/:id | Detalle de cliente con historial |
| POST | /api/admin/clients | Crear cliente |
| PUT | /api/admin/clients/:id | Editar cliente |
| GET | /api/admin/services | Listar todos los servicios |
| POST | /api/admin/services | Crear servicio |
| PUT | /api/admin/services/:id | Editar servicio |
| PATCH | /api/admin/services/:id/deactivate | Desactivar servicio |
| GET | /api/admin/schedules | Obtener horarios configurados |
| PUT | /api/admin/schedules | Actualizar horarios |
| GET | /api/admin/blocked-slots | Listar franjas bloqueadas |
| POST | /api/admin/blocked-slots | Crear bloqueo |
| DELETE | /api/admin/blocked-slots/:id | Eliminar bloqueo |

## Lógica de Disponibilidad

El cálculo de franjas disponibles sigue este algoritmo:

1. Obtener la configuración de horario para el día de la semana solicitado
2. Generar todas las franjas posibles según hora_inicio, hora_fin y duración del slot
3. Filtrar franjas que tienen duración suficiente para el servicio solicitado
4. Excluir franjas que coinciden con bloqueos (blocked_slots)
5. Excluir franjas que se solapan con turnos existentes (status != 'cancelled')
6. Retornar franjas restantes como disponibles

### Detección de conflictos

Un turno nuevo conflicta con uno existente si:
- Tienen la misma fecha
- Sus rangos de tiempo se solapan: `nuevo.start_time < existente.end_time AND nuevo.end_time > existente.start_time`

## Componentes Frontend

### Formulario de Reserva — React SPA (Vite)
- **Paso 1**: Selección de servicio (tarjetas con nombre, descripción, duración, precio)
- **Paso 2**: Selección de fecha y hora (calendario + lista de franjas disponibles)
- **Paso 3**: Datos del cliente y confirmación (nombre, teléfono, email)

### Panel de Administración — panel.html (HTML/JS vanilla)
- **Dashboard**: Agenda del día con vista de lista de turnos
- **Calendario**: Vistas diaria, semanal y mensual con turnos codificados por color según estado
- **Gestión de turnos**: Creación manual, edición, cancelación
- **Clientes**: Listado con búsqueda, detalle con historial
- **Servicios**: CRUD completo con activación/desactivación
- **Configuración**: Horarios de atención y bloqueos
- **Login**: Formulario simple de username/password

### Página de Cliente — cliente.html (HTML/JS vanilla)
- Vista de estado de turno
- Información de contacto del negocio

## Diseño Responsivo

### Breakpoints
- Móvil: < 768px — Layout single-column, menú hamburguesa
- Tablet: 768px - 1024px — Layout dos columnas
- Desktop: > 1024px — Layout multi-columna, sidebar de navegación

### Principios
- Mobile-first: estilos base para móvil, media queries para pantallas mayores
- Touch targets: mínimo 44x44px en dispositivos táctiles
- Tipografía fluida: rem units con escala responsiva

## Seguridad

- Autenticación simple: comparación directa de username/password contra la tabla admins en la base de datos
- Sesión almacenada en localStorage (username autenticado)
- Validación de entrada en frontend y backend
- Protección contra SQL injection vía consultas parametrizadas con pg pool ($1, $2, etc.)
- Rate limiting en endpoints de autenticación
- CORS configurado para dominios permitidos
- Conexión SSL a PostgreSQL en producción (Render)

**Nota**: Esta implementación de autenticación es simple y adecuada para un MVP con acceso limitado. Para producción con múltiples administradores o datos sensibles, se recomienda migrar a bcrypt + JWT en el futuro.

## Despliegue (Render)

### Estructura de deploy
- **Web Service**: Node.js/Express que sirve la API y los archivos estáticos (panel.html, cliente.html, build de React)
- **PostgreSQL Database**: Plan free de Render con SSL habilitado
- **Variables de entorno**: DATABASE_URL, NODE_ENV, PORT

### Configuración
- El backend sirve los archivos estáticos del frontend (React build + HTMLs)
- En desarrollo: Vite dev server para React, Express en puerto separado
- En producción: Express sirve todo desde una única URL

### Vercel (configuración alternativa)
- Existe vercel.json como configuración alternativa pero el deploy activo es en Render

## Propiedades de Correctitud

### Propiedad 1: Consistencia de disponibilidad
Para toda franja horaria marcada como disponible, no debe existir ningún turno confirmado ni bloqueo que se solape con ella.

### Propiedad 2: Integridad de turnos
Todo turno debe cumplir: start_time < end_time, la fecha debe corresponder a un día laborable según la configuración de horarios, y el servicio asociado debe existir.

### Propiedad 3: Idempotencia de cálculo de disponibilidad
Calcular la disponibilidad múltiples veces para la misma fecha y servicio sin cambios intermedios debe retornar el mismo resultado.

### Propiedad 4: No doble reserva
Para cualquier fecha y rango horario, no pueden existir dos turnos con estado 'confirmed' que se solapen.

### Propiedad 5: Asociación correcta de clientes
Cuando un cliente se registra con un email o teléfono existente, el turno se asocia al registro existente. El número total de registros de cliente no aumenta.

### Propiedad 6: Preservación de historial
Desactivar un servicio o modificar datos de un cliente no debe eliminar ni alterar los turnos históricos asociados.
