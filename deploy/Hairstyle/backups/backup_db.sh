#!/usr/bin/env bash
#
#  BACKUP DIARIO - HairStyle Abii
#  =============================
#  Genera un dump comprimido de la base y lo guarda por 7 dias.
#  Pro-tip: configura tambien una copia a otro lugar (rclone a Google Drive,
#  otro server, o bucket S3) para que sea un backup real fuera del server.

set -euo pipefail

DB_NAME="hairstyle"
DB_USER="postgres"           # El mismo usuario que use la app en su .env
BACKUP_DIR="/var/backups/hairstyle"
KEEP_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M)
DUMP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# Dump compactado
PGPASSWORD="CAMBIAR_PASSWORD_SEGURA" pg_dump \
    -U "${DB_USER}" \
    -h localhost \
    -d "${DB_NAME}" \
    --format=plain \
    --no-owner \
    --no-privileges \
    | gzip > "${DUMP_FILE}"

echo "Backup generado: ${DUMP_FILE} ($(du -h "${DUMP_FILE}" | cut -f1))"

# --- OPCIONAL: copia remota (descomenta y configura) ---
# rclone copy "${DUMP_FILE}" remote:hairstyle-backups/ 2>/dev/null || echo "AVISO: sin copia remota"

# Borrar backups viejos
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +${KEEP_DAYS} -delete

echo "Backup completado. ${KEEP_DAYS} dias de retencion."
