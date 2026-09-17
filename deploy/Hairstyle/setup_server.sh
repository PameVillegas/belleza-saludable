#!/usr/bin/env bash
#
#  SETUP SERVER DONWEB - HairStyle Abii (2da app)
#  =============================================
#  Ejecutar como root sobre Ubuntu 22.04/24.04 LTS:
#      sudo bash setup_server.sh
#
#  Instala: Node.js 20 LTS, PM2, Nginx, PostgreSQL 16, Certbot, backups.
#  Idempotente (puede ejecutarse varias veces).

set -euo pipefail

APP_DIR="/var/www/hairstyle"
APP_NAME="hairstyle-abii"
DB_NAME="hairstyle"
DB_USER="postgres"
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
pm2 startup systemd -u root --hp /root || true
pm2 save || true

# ---------- 5) PostgreSQL 16 ----------
log "Instalando PostgreSQL 16"
if ! command -v psql >/dev/null; then
  sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
  apt-get update -y
  apt-get install -y postgresql-16 postgresql-client-16
fi

# ---------- 6) Poner password al usuario postgres y crear DB ----------
log "Configurando usuario postgres y base de datos"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'CAMBIAR_PASSWORD_SEGURA';"
# Crear DB si no existe
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres createdb -O postgres ${DB_NAME}
echo "Base ${DB_NAME} lista. Usuario postgres con password configurada."

# ---------- 7) Preparar carpetas ----------
log "Preparando carpetas de la app"
mkdir -p "${APP_DIR}"
mkdir -p "/var/log/${APP_NAME}"
# IMPORTANTE: las imagenes /fotos se sirven desde client/public y client/dist
#  -> hay que asegurarse de subir esas carpetas (ver MIGRATION.md paso 1)

# ---------- 8) Nginx config ----------
log "Configurando Nginx"
cp "$(dirname "$0")/nginx/hairstyle.conf" /etc/nginx/sites-available/${APP_NAME}.conf 2>/dev/null || \
  echo "AVISO: no se encontro nginx/hairstyle.conf, copialo manualmente."
ln -sf /etc/nginx/sites-available/${APP_NAME}.conf /etc/nginx/sites-enabled/${APP_NAME}.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ---------- 9) Certbot SSL ----------
log "Instalando Certbot para SSL"
apt-get install -y certbot python3-certbot-nginx
if [ "${DOMAIN}" != "TU_DOMINIO" ]; then
  echo "--- Para SSL ejecuta (despues de apuntar el DNS): ---"
  echo "    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
fi

# ---------- 10) Backups diarios ----------
log "Configurando backup diario de la base"
mkdir -p /var/backups/hairstyle
cp "$(dirname "$0")/backups/backup_db.sh" /usr/local/bin/backup_hairstyle.sh 2>/dev/null || true
chmod +x /usr/local/bin/backup_hairstyle.sh 2>/dev/null || true
( crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup_hairstyle.sh" ) | crontab -
echo "Cron de backup configurado."

log "SETUP COMPLETO."
echo ""
echo "Siguientes pasos manuales:"
echo "  1) Configurar server/.env (ver MIGRATION.md -> DATABASE_URL/DB_* )"
echo "  2) Subir codigo + carpetas client/public y client/dist a ${APP_DIR}"
echo "  3) npm install (server y client) && build del client"
echo "  4) pm2 start ecosystem.config.js"
echo "  5) pm2 save"
