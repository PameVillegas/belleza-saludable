# Guía de Despliegue y Configuración — Belleza Saludable

## Requisitos previos

- **Node.js** 18 o superior
- **npm** 9 o superior
- **PostgreSQL** 14 o superior (en producción se usa el servicio de Render)
- Cuenta en [Render](https://render.com) (plan $7/mes recomendado)

---

## Variables de entorno

Copiá `.env.example` a `.env` y completá los valores:

```
DATABASE_URL=postgresql://usuario:contraseña@host:5432/belleza_saludable
NODE_ENV=development
PORT=3000

# Email — opcional, si no se configura los emails se omiten sin error
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_cuenta@gmail.com
SMTP_PASS=xxxx_xxxx_xxxx_xxxx   # contraseña de aplicación de Google
SMTP_FROM_NAME=Belleza Saludable
```

### Variables en producción (Render)

En el dashboard de Render → tu servicio → **Environment** → agregar:

| Variable       | Valor                                             |
|----------------|---------------------------------------------------|
| `NODE_ENV`     | `production`                                      |
| `DATABASE_URL` | Se configura automáticamente desde el DB de Render |
| `SMTP_HOST`    | (opcional) servidor SMTP                          |
| `SMTP_PORT`    | (opcional) 587                                    |
| `SMTP_USER`    | (opcional) email remitente                        |
| `SMTP_PASS`    | (opcional) contraseña de aplicación               |

---

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/PameVillegas/belleza-saludable.git
cd belleza-saludable

# 2. Instalar dependencias del backend
npm install

# 3. Instalar dependencias del frontend
cd frontend && npm install && cd ..

# 4. Copiar variables de entorno
cp .env.example .env
# Editar .env con los valores correctos

# 5. Ejecutar la migración de base de datos
npm run migrate

# 6. (Opcional) Ejecutar el seed inicial
npm run seed

# 7. Compilar el frontend
npm run build

# 8. Iniciar el servidor
npm start
```

La app queda disponible en `http://localhost:3000`.  
Panel admin: `http://localhost:3000/panel.html`

---

## Base de datos

### Migración

```bash
npm run migrate
```

Ejecuta `backend/db/schema.sql` y crea todas las tablas si no existen. Es seguro ejecutarlo múltiples veces (usa `CREATE TABLE IF NOT EXISTS`).

### Seed inicial

```bash
npm run seed
```

Crea el admin por defecto, horarios de atención y servicios de ejemplo.  
**Nota**: borra los turnos y servicios existentes. Usarlo solo en una instalación nueva.

### Setup automático al arrancar

Al iniciar el servidor, se ejecuta automáticamente un setup que:
- Crea las tablas si no existen
- Crea el admin `Bsaludable` / `Marif26` si no hay admins
- Crea los horarios Lun–Vie 9-12 y 14-19 si no hay horarios configurados

---

## Despliegue en Render

El repositorio incluye `render.yaml` con la configuración lista.

### Pasos para el primer deploy

1. En [render.com](https://render.com) → **New** → **Blueprint**
2. Conectar el repositorio de GitHub
3. Render detecta automáticamente `render.yaml` y crea:
   - El web service `belleza-saludable`
   - La base de datos PostgreSQL `belleza-saludable-db`
4. Esperar que el build termine (~3-5 minutos)
5. La app queda disponible en `https://belleza-saludable.onrender.com`

### Configuración del build en Render

```yaml
buildCommand: npm install && cd frontend && npm install && npm run build
startCommand: node backend/server.js
```

---

## Dominio personalizado (DonWeb)

Una vez que el dominio está activo en DonWeb:

1. **En Render**: Settings → Custom Domains → Add Custom Domain
   - Agregar `bellezasaludable.com.ar`
   - Agregar `www.bellezasaludable.com.ar`
   - Render muestra los valores DNS necesarios

2. **En DonWeb**: Nameservers y Zona DNS → Configurar manualmente → Crear zona DNS

   | Tipo  | Nombre                     | Valor                            |
   |-------|----------------------------|----------------------------------|
   | A     | `bellezasaludable.com.ar`  | `216.24.57.1`                    |
   | CNAME | `www.bellezasaludable.com.ar` | `belleza-saludable.onrender.com` |

3. Esperar propagación DNS (15 min – 2 horas)
4. Render verificará automáticamente y activará SSL

---

## WhatsApp (Baileys)

El sistema usa `@whiskeysockets/baileys` para enviar recordatorios automáticos 30 minutos antes de cada turno.

### Vincular WhatsApp

1. Ingresar al panel admin → sección **WhatsApp**
2. Click en **"Conectar WhatsApp"**
3. Esperar que aparezca el código QR (~5-10 segundos)
4. En el celular: WhatsApp → ⋮ → **Dispositivos vinculados** → **Vincular un dispositivo**
5. Escanear el QR

La sesión se guarda en disco (`wa_session/`). Si el servidor se reinicia, reconecta automáticamente sin necesitar escanear de nuevo.

**Para cambiar de número** (al entregar a Mariana):
1. Click en **Desconectar** en el panel admin
2. Escanear con el nuevo celular

---

## Configuración inicial (checklist)

Al hacer el primer deploy o entregar la app:

- [ ] Cambiar credenciales del admin en el panel → sección **Administradores**
  - Usuario: `Bsaludable`, Contraseña: `Marif26` (por defecto)
- [ ] Verificar horarios de atención en panel → **Turnos** → **Horarios**
- [ ] Cargar los servicios con su foto desde panel → **Servicios** → **Tratamientos**
- [ ] Cargar productos si corresponde → **Servicios** → **Productos**
- [ ] Conectar WhatsApp desde panel → **WhatsApp**
- [ ] Verificar que el dominio esté apuntando correctamente

---

## Tests

```bash
# Ejecutar todos los tests
npm test

# Tests específicos
npm test -- --testPathPattern="availability"
npm test -- --testPathPattern="conflicts"
npm test -- --testPathPattern="api.integration"
```

Los tests son unitarios e de integración y no requieren conexión a base de datos real.

---

## Mantenimiento

### Actualizar dependencias

```bash
npm audit
npm audit fix
```

### Backup de la base de datos (Render)

En el dashboard de Render → base de datos → **Backups**.  
Render hace backups automáticos diarios en el plan pago.

### Ver logs en producción

En Render → tu servicio → **Logs** (disponibles en tiempo real).

---

## Estructura del proyecto

```
belleza-saludable/
├── backend/
│   ├── db/           # schema, migrate, seed
│   ├── middleware/   # auth
│   ├── routes/       # api endpoints
│   ├── tests/        # jest tests
│   ├── utils/        # pure helpers
│   ├── email.js      # email service
│   ├── reminders.js  # WhatsApp reminders cron
│   ├── whatsapp.js   # Baileys client
│   └── server.js     # express app
├── frontend/
│   └── src/          # React components & pages
├── public/
│   ├── panel.html    # admin panel
│   └── js/panel.js
├── .env.example
├── render.yaml
└── DEPLOYMENT.md
```
