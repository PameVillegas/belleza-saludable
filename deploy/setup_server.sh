#!/usr/bin/env bash
#
#  SETUP SERVER DONWEB - BILLEZA SALUDABLE (1er app de prueba)
#  =========================================================
#  Ejecutar como root sobre Ubuntu 22.04/24.04 LTS:
#      sudo bash setup_server.sh
#
#  Instala: Node.js 20 LTS, PM2, Nginx, PostgreSQL 16, Certbot, backups.
#  Este script es idempotente (puede ejecutarse varias veces sin problema).

set -euo pipefail

APP_DIR="/var/www/belleza-saludable"
APP_NAME="belleza-saludable"
DB_USER="belleza"
DB_NAME="belleza_saludable"
DOMAIN="TU_DOMINIO"   # <- CAMBIAR por tu dominio real

log() { echo -e "\n\033[1;32m==> $1\033[0m"; }

# ---------- 1) Actualizar sistema ----------
log "Actualizando sistema"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# ---------- 2) Dependencias base ----------
log "Instalando dependencias base"
apt-get install -y curl git build-essential ca-certificates gnupg nginx ufw
# ufw en DonWeb puede ser gestionado por el firewall del panel; lo dejamos opcional.

# ---------- 3) Node.js 20 LTS ----------
log "Instalando Node.js 20 LTS"
if ! command -v node >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

# ---------- 4) PM2 ----------
log "Instalando PM2"
npm install -g pm2
# PM2 arranque automático al reiniciar
pm2 startup systemd -u root --hp /root || true
pm2 save || true

# ---------- 5) PostgreSQL 16 ----------
log "Instalando PostgreSQL 16"
if ! command -v psql >/dev/null; then
  # Repositorio oficial de PostgreSQL
  sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
  apt-get update -y
  apt-get install -y postgresql-16 postgresql-client-16
fi

# ---------- 6) Crear base y usuario ----------
log "Creando base de datos y usuario"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD 'CAMBIAR_PASSWORD_SEGURA';
  END IF;
END \$\$;
SQL
# Crear DB si no existe
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres createdb -O ${DB_USER} ${DB_NAME}
# También crear la DB que usa la app en su conexión local
sudo -u postgres psql -c "ALTER USER ${DB_USER} PASSWORD 'CAMBIAR_PASSWORD_SEGURA';"
echo "Base ${DB_NAME} y usuario ${DB_USER} listos."

# ---------- 7) Preparar carpeta de la app ----------
log "Preparando carpeta de la app"
mkdir -p "${APP_DIR}"
mkdir -p "/var/log/${APP_NAME}"
chown -R root:root "${APP_DIR}"

# ---------- 8) Nginx config ----------
log "Configurando Nginx"
cp "$(dirname "$0")/nginx/belleza-saludable.conf" /etc/nginx/sites-available/${APP_NAME}.conf 2>/dev/null || \
  echo "AVISO: no se encontro nginx/belleza-saludable.conf, copialo manualmente."
ln -sf /etc/nginx/sites-available/${APP_NAME}.conf /etc/nginx/sites-enabled/${APP_NAME}.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ---------- 9) Certbot SSL ----------
log "Instalando Certbot para SSL"
apt-get install -y certbot python3-certbot-nginx
if [ "${DOMAIN}" != "TU_DOMINIO" ]; then
  echo "--- Para generar SSL ejecutá (después de apuntar el DNS al server): ---"
  echo "    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
fi

# ---------- 10) Backups diarios ----------
log "Configurando backup diario de la base"
mkdir -p /var/backups/belleza
# Copiar script de backup (lo deja este kit en deploy/backups)
cp "$(dirname "$0")/backups/backup_db.sh" /usr/local/bin/backup_belleza.sh 2>/dev/null || true
chmod +x /usr/local/bin/backup_belleza.sh 2>/dev/null || true
# Cron: todos los dias a las 03:00
( crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup_belleza.sh" ) | crontab -
echo "Cron de backup configurado."

log "SETUP COMPLETO."
echo ""
echo "Siguientes pasos manuales:"
echo "  1) Configurar .env en ${APP_DIR}/.env  (ver DEPLOYMENT.md -> variable DATABASE_URL)"
echo "  2) npm install && npm run build (frontend)"
echo "  3) pm2 start ecosystem.config.js"
echo "  4) pm2 save"
echo "  5) git pull / subir codigo de esta app a ${APP_DIR}"
