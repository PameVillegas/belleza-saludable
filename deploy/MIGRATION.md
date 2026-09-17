# Migración a DonWeb (EasyPanel) — Belleza Saludable

Guía completa para pasar esta app (Node.js + Express + PostgreSQL + WhatsApp +
frontend React) desde Render/Neon/Supabase a **un Cloud Server DonWeb con
EasyPanel** (Docker, interfaz gráfica).

> Estrategia: migrar **solo esta app primero** como piloto. Probar a fondo en
> paralelo con los servicios actuales y, recién cuando esté perfecta, cortar el
> DNS y cancelar los planes pagos. Los dominios siguen tuyos (los pagás aparte
> por un año) — acá solo se **apunta** el registro A al server nuevo.

---

## 0. Antes de arrancar: entender EasyPanel

EasyPanel es un panel web (basado en Docker) que te deja crear proyectos y
desplegar apps y bases de datos con clics. Esto es lo que tenés que saber:

- Cada **app** y cada **base de datos** se crea como un **servicio** dentro de un
  **proyecto**.
- Las apps se despliegan **desde un repositorio Git** (más limpio) o subiendo
  archivos. Este kit incluye un **Dockerfile** listo para que EasyPanel arme la
  app solo.
- Los **certificados SSL** y el **dominio** se configuran desde el panel con un
  clic (EasyPanel pide Let's Encrypt automáticamente).
- **LICENCIAS importantísimo:** el **plan gratuito** de EasyPanel limita a
  **3 proyectos** y **sin backups automáticos**. Como querés 3 apps, evaluá el
  **plan pago (~US$15/mes)** que da proyectos ilimitados + backups + soporte.
  Tenelo en cuenta al decidir.
- DonWeb Cloud ya trae **Redundancia RAID 1** sobre el disco + **snapshots**,
  así que el hardware está protegido igual.

---

## 1. Contratar el Cloud Server en DonWeb

1. En donweb.com → **Cloud** → **Easypanel Hosting Cloud**.
2. Elegí el plan que viste: **4 vCPU / 8 GB RAM / SSD / 1 TB** (o el que quieras;
   es escalable con un clic después).
3. Desplegá la imagen **EasyPanel "Click and GO"** (trae Docker/Git listos).
4. Te asignan una **IP** y el acceso para el panel.

> Ojo con el **disco**: si el plan trae 20 GB, revisá que alcance. Belleza es
> liviana (las imágenes de belleza se sirven desde `public/`, son pequeños PNG/JPG).
> HAIRSTYLE (con `/fotos`) es la que más disco consume.

---

## 2. Acceso inicial al panel EasyPanel (importante, hacer YA)

1. Entrá a `http://TU_IP_CLOUD` desde el navegador.
2. **Creá el usuario administrador del panel** el primer día. Si no lo hacés,
   cualquiera con la IP podría tomar el control.
3. En **Ajustes → General → Dominio del Panel**, configurá un subdominio para
   entrar al panel (ej. `panel.tudominio.com`) apuntando a la IP. EasyPanel le
   pone SSL solo.

---

## 3. Crear la base de datos PostgreSQL

En EasyPanel, dentro de tu proyecto:

1. **Nuevo proyecto** → nombre: `belleza`.
2. **Agregar servicio → Base de datos → PostgreSQL** (versión 16).
3. Configurá:
   - **Usuario**: `belleza`
   - **Password**: elegí una segura (anotala)
   - **Database**: `belleza_saludable`
4. Guardá. EasyPanel te muestra el **host/url de conexión** interno (ej.
   `postgres://belleza:...@postgres:5432/belleza_saludable`).
   Anotalo porque va en la app.

> La sesión de WhatsApp de esta app se guarda en la tabla `wa_sessions` **dentro
> de la base**. Por eso, al migrar la DB no perdés el WhatsApp conectado.

---

## 4. Crear la app (Belleza) en EasyPanel

1. En el mismo proyecto, **Agregar servicio → App o "New App"**.
2. **Source / Origen**: conectá el **repositorio Git** donde vive esta app
   (el repo ya es Git). EasyPanel despliega desde git, o podés indicarle que use
   el `Dockerfile` de este kit.
3. Indicá que use el **Dockerfile** que está en la **raíz del repo**
   (`Dockerfile`). EasyPanel arma el contenedor: instala dependencias y compila
   el frontend React solo.
4. **Variables de entorno** (sección "Variables"):

   | Variable | Valor |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
   | `DATABASE_URL` | la URL interna de Postgres del paso 3 |
   | `SMTP_HOST` | (opcional) ej. `smtp.gmail.com` |
   | `SMTP_PORT` | (opcional) `587` |
   | `SMTP_USER` | (opcional) tu email |
   | `SMTP_PASS` | (opcional) tu contraseña de app |
   | `SMTP_FROM_NAME` | `Belleza Saludable` |

5. **Puerto/Port**: `3000` (el mismo que usa `server.js`).
6. **Desplegar/Deploy**. Al terminar, EasyPanel te da una URL/dominio temporal
   (ej. `https://belleza.algo.easypanel...`).

---

## 5. Probar la app en internet (SIN tocar tu dominio real)

Este es el paso clave de "deja todo listo y probá antes de migrar":

1. Abrí la **URL temporal** que te dio EasyPanel desde tu teléfono (otro wifi).
2. Verificá:
   - Carga la portada / `index` de React
   - `/panel` → login admin
   - `/cliente` → reservar un turno
   - El **WhatsApp** conectado (estado en `/api/admin/whatsapp/status`)
   - Los **emails** (si configuraste SMTP)
3. Si algo falla, se arregla ACÁ. **Nada de tu producción actual cambió.**

> Como esta app usa baileys (WhatsApp), EasyPanel paga con backups/carpetas
> persistentes es un plus grande: la sesión no se pierde entre reinicios
> (a diferencia de la memoria efímera de Render).

---

## 6. Apuntar TU dominio al server (el corte)

1. **2-3 días antes**: en tu registrador, bajá el **TTL** del registro A a `300`.
2. Cambiá el registro **A** (y `www`) → **IP del Cloud Server**.
3. En EasyPanel: agregá tu dominio al servicio de la app ("Domain" → agrega
   `tudominio.com` y `www.tudominio.com`). EasyPanel emite el **SSL** solo.
4. Validá https en tu dominio real.

**Regla de oro:** No canceles Render/Neon/Supabase hasta **48h después** de que
todo funcione en tu dominio real.

---

## 7. Migrar los datos reales

El esquema lo crea el propio `server.js` al arrancar por primera vez (tablas,
admin, horarios). Si arrancás con la DB vacía, la app queda funcionando lista.

Para traer los datos reales de la base vieja (Neon/Supabase/Render):

1. Desde tu PC exportá: `pg_dump "URL_DB_VIEJA" --no-owner -Fc > belleza_old.dump`
2. En el panel, ejecutá un comando SQL en la base new, o importá el dump con una
   consola de postgres (la URL interna la ves en la config del servicio DB).
   Ej básico:
   `pg_restore --no-owner --no-privileges -U belleza -h localhost -d belleza_saludable belleza_old.dump`
3. Reiniciá la app.

> Si preferís arrancar limpio (sin datos viejos), no hace falta nada: la DB ya
> se crea con admin y horarios.

---

## 8. Backups

- **EasyPanel pago** incluye **backups automáticos** de bases de datos → activalos
  en la config del servicio Postgres.
- DonWeb Cloud: **RAID 1** (disco duplicado) + **snapshots a demanda**.
- Extra recomendado: el script `deploy/backups/backup_db.sh` te genera un
  `pg_dump` diario si querés una copia fuera del panel. Podés correrlo vía
  cron/SSH si tenés acceso, o simplemente confiar en los backups de EasyPanel+
  DonWeb.

---

## 9. Monitoreo

- **UptimeRobot (gratis)** sobre `https://tudominio`: te avisa si la app se cae.
- EasyPanel muestra consumo de CPU/RAM/red en su dashboard.

---

## Checklist final

- [ ] Panel EasyPanel con tu usuario admin creado (YA)
- [ ] Servicio Postgres creado (belleza/belleza_saludable)
- [ ] App desplegada desde el Dockerfile, variables configuradas
- [ ] Dominio temporal de prueba anda en otro wifi
- [ ] Login admin OK (`Bsaludable`)
- [ ] Reserva de turno en `/cliente` OK
- [ ] WhatsApp conectado + probar envío
- [ ] Emails OK (si aplica)
- [ ] TU dominio apuntando + SSL verde
- [ ] Datos migrados correctos
- [ ] Backups activados (EasyPanel) + verificar
- [ ] 48h OK → **cancelar Render/Neon/Supabase** (el dominio NO se da de baja)
