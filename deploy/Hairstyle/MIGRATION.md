# Migración a DonWeb (EasyPanel) — HairStyle Abii

Guía completa para pasar esta app (Node.js + Express ESM + PostgreSQL + frontend
React estático + fotos en disco) desde Render/Vercel/Railway a **un Cloud Server
DonWeb con EasyPanel** (Docker, interfaz gráfica).

> Estrategia: migrar esta app en paralelo sin tocar los servicios actuales,
> probar a fondo y recién cortar el DNS cuando esté OK. Los dominios siguen
> tuyos — acá solo apuntás el registro A al server nuevo.

---

## Diferencias CLAVE de esta app (leer antes de empezar)

1. **ES modules** (`"type": "module"`): el comando de arranque es
   `node server/server.js`.
2. **Las imágenes `/fotos` viven en el disco** (`client/public/fotos` y
   `client/dist`), servidas con `express.static` (`server/server.js:32-34`).
   Por eso el **Dockerfile copia `client/public`** al contenedor. Las fotos
   vienen con el repo → **no necesitás un bucket** ni nada extra.
3. `database.js` crea todo solo al arrancar: tablas, admin (`Abitu`/`Abitu26`),
   cliente de prueba y tratamientos base. Con la DB vacía ya queda funcionando.
4. No usa WhatsApp ni cron → es la más simple de tus 3 apps.

---

## 1. Contratar el Cloud Server en DonWeb

1. donweb.com → **Cloud** → **Easypanel Hosting Cloud**.
2. Plan **4 vCPU / 8 GB RAM / SSD / 1 TB** (escalable con un clic después).
3. Imagen **EasyPanel "Click and GO"**.

> Esta app consume **más disco** que las demás por las fotos. Revisá que el plan
> tenga disco suficiente (si va a crecer mucho, subí el almacenamiento).

---

## 2. Acceso inicial al panel (hacer YA)

1. `http://TU_IP_CLOUD` → **creá tu usuario admin** del panel el primer día.
2. **Ajustes → General → Dominio del Panel**: subdominio para entrar al panel
   (ej. `panel.tudominio.com`) + SSL.

---

## 3. Crear la base PostgreSQL

1. **Nuevo proyecto** → `hairstyle`.
2. **Agregar servicio → Base de datos → PostgreSQL 16**.
   - Usuario: `postgres` (o el que quieras, anotalo)
   - Password: segura
   - Database: `hairstyle`
3. Anotá la **URL/host de conexión** interna.

---

## 4. Crear la app (HairStyle)

1. **Agregar servicio → App**, origen: **repositorio Git** de esta app.
2. Indicá que use el **Dockerfile** que está en la **raíz del repo**
   (`Dockerfile`). Compila el frontend y copia las fotos solo.
3. **Variables de entorno** (la app acepta `DATABASE_URL` **o** las sueltas):

   | Variable | Valor |
   |----------|-------|
   | `DB_HOST` | `localhost` (o el host interno de EasyPanel) |
   | `DB_PORT` | `5432` |
   | `DB_USER` | `postgres` (el del paso 3) |
   | `DB_PASSWORD` | la password del paso 3 |
   | `DB_NAME` | `hairstyle` |
   | `PORT` | `3000` |

   > Si usás `DATABASE_URL` (URL completa), la app la toma y fuerza SSL; y si la
   > base es interna de EasyPanel, preferí las variables sueltas `DB_*` para
   > evitar problemas de SSL local.

4. **Port**: `3000`.
5. **Deploy**. EasyPanel te da una URL temporal.

---

## 5. Probar en internet (sin tocar tu dominio real)

Probá la **URL temporal** desde el teléfono (otro wifi):

- Abre `index.html` / portada
- `/admin.html` → login admin (`Abitu` / `Abitu26`)
- `/cliente.html` → que un cliente vea tratamientos y reserve un turno
- Verificá que **las fotos `/fotos/...` carguen** (ej. `/fotos/logo.png`,
  `/fotos/facial.jpg`) — es el punto crítico de esta app
- `/panel.html`, `/entrar.html`, `/registro.html`

Si algo falla, se arregla ACÁ. La app de producción no cambia.

---

## 6. Apuntar TU dominio (el corte)

1. Bajá el **TTL** a `300` (2-3 días antes) en tu registrador.
2. Registro **A** (y `www`) → IP del Cloud Server.
3. En EasyPanel: agrega tu dominio al servicio + SSL automático.
4. Validá https + fotos en tu dominio real.

**No canceles Vercel/Render/Railway hasta 48h después de todo OK.**

---

## 7. Migrar los datos reales (cuando estés lista)

El esquema se crea solo al arrancar (tablas, admin, tratamientos). Con la DB
vacía ya queda lista y sin datos viejos.

Para traer los datos reales de la DB vieja:

1. Exportá: `pg_dump "URL_DB_VIEJA" --no-owner -Fc > hairstyle_old.dump`
2. Importá en la base new (consola Postgres del panel):
   `pg_restore --no-owner --no-privileges -U postgres -h localhost -d hairstyle hairstyle_old.dump`

---

## 8. Backups

Los datos de esta app son: **la base** + **las fotos**.

- **Base**: activá los **backups automáticos de EasyPanel** (plan pago) en el
  servicio Postgres.
- **Fotos**: como están en el repo (`client/public/fotos`), cualquier copia del
  repo ya las respalda. Si subís fotos nuevas por el panel/filesystem, sumalas a
  una copia remota.
- DonWeb Cloud: RAID 1 + snapshots a demanda.

---

## 9. Monitoreo

- UptimeRobot gratis sobre `https://tudominio`.
- Dashboard de EasyPanel (CPU/RAM/red).

---

## Checklist final

- [ ] Panel con tu admin creado (YA)
- [ ] Servicio Postgres `hairstyle` creado
- [ ] App desplegada desde el Dockerfile (raiz del repo)
- [ ] URL temporal anda en otro wifi
- [ ] Login admin (`Abitu`) OK
- [ ] Cliente reserva turno OK
- [ ] **Fotos `/fotos/...` cargan** (crítico)
- [ ] TU dominio apuntando + SSL verde
- [ ] Datos migrados correctos (si aplica)
- [ ] Backups activados (base + fotos)
- [ ] 48h OK → cancelar Vercel/Render/Railway (dominio NO se da de baja)
