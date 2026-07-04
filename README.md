# Belleza Saludable - Sistema de Gestión de Turnos

## Paso a paso para poner en marcha el proyecto

### Requisitos previos

- **Node.js** versión 18 o superior → [Descargar](https://nodejs.org)
- **PostgreSQL** instalado localmente o una base de datos en Render/Neon/Supabase
- **Git** (opcional, para control de versiones)

---

### Paso 1: Instalar dependencias

Abrí una terminal en la carpeta del proyecto (`belleza saludable`) y ejecutá:

```bash
npm install
cd frontend
npm install
cd ..
```

---

### Paso 2: Crear el archivo .env

Creá un archivo `.env` en la raíz del proyecto (al lado de package.json) con este contenido:

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/belleza_saludable
NODE_ENV=development
PORT=3000
```

Reemplazá `usuario`, `password` y el host según tu configuración de PostgreSQL.

**Si usás Render**, copiá la "Internal Database URL" que te da Render al crear la base.

---

### Paso 3: Crear la base de datos

Si estás usando PostgreSQL local, creá la base de datos:

```bash
psql -U postgres
CREATE DATABASE belleza_saludable;
\q
```

---

### Paso 4: Ejecutar la migración (crear tablas)

```bash
npm run migrate
```

Deberías ver: `Migración ejecutada correctamente.`

---

### Paso 5: Ejecutar el seed (datos iniciales)

```bash
npm run seed
```

Esto crea:
- Un **admin** con usuario `admin` y contraseña `admin123`
- **Horarios** de Lunes a Viernes (9:00-18:00) y Sábados (9:00-13:00)
- **5 servicios** de ejemplo (Corte, Tintura, Manicura, Pedicura, Limpieza facial)

---

### Paso 6: Iniciar el backend

```bash
npm run dev
```

El servidor arranca en `http://localhost:3000`

---

### Paso 7: Iniciar el frontend (modo desarrollo)

En otra terminal:

```bash
cd frontend
npm run dev
```

El frontend arranca en `http://localhost:5173` con proxy automático al backend.

---

### Paso 8: Acceder a la aplicación

| URL | Descripción |
|-----|-------------|
| `http://localhost:5173` | Formulario de reserva online (React) |
| `http://localhost:3000/panel.html` | Panel de administración |
| `http://localhost:3000/cliente.html` | Consulta de turnos para clientes |

**Credenciales del panel admin:**
- Usuario: `admin`
- Contraseña: `admin123`

---

## Despliegue en Render

### Paso 1: Crear la base de datos

1. Ir a [Render](https://render.com) → New → PostgreSQL
2. Nombre: `belleza-saludable-db`
3. Plan: Free
4. Crear y copiar la **Internal Database URL**

### Paso 2: Crear el Web Service

1. New → Web Service
2. Conectar tu repositorio de GitHub/GitLab
3. Configuración:
   - **Build Command**: `npm install && cd frontend && npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node

### Paso 3: Variables de entorno

Agregar en la sección "Environment" del Web Service:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | (la Internal URL de tu base PostgreSQL) |
| `NODE_ENV` | `production` |

### Paso 4: Ejecutar migración y seed

Una vez desplegado, abrí la Shell del servicio en Render y ejecutá:

```bash
npm run migrate
npm run seed
```

---

## Estructura del proyecto

```
├── backend/           → API con Express
│   ├── server.js      → Servidor principal
│   ├── db/            → Base de datos (pool, schema, seed)
│   ├── middleware/    → Auth middleware
│   └── routes/        → Endpoints de la API
├── frontend/          → React SPA (reserva online)
│   └── src/           → Componentes y páginas
├── public/            → Archivos estáticos
│   ├── panel.html     → Panel admin (JS vanilla)
│   ├── cliente.html   → Consulta de turnos
│   └── js/panel.js    → Lógica del panel
├── .env.example       → Plantilla de variables de entorno
├── render.yaml        → Configuración de Render
└── vercel.json        → Configuración alternativa de Vercel
```

---

## Funcionalidades

- ✅ Reserva online de turnos (3 pasos: servicio → fecha/hora → datos)
- ✅ Panel admin para gestionar agenda, clientes y servicios
- ✅ Carga manual de turnos (para clientes por teléfono)
- ✅ Gestión de horarios y bloqueos
- ✅ Base de datos de clientes con historial
- ✅ Diseño responsivo (celular, tablet, PC)
- ✅ Autenticación simple para el panel admin
- ✅ Prevención de doble reserva
- ✅ Deploy listo para Render (plan free)
