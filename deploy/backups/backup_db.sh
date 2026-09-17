#!/usr/bin/env bash
#
#  BACKUP DIARIO - Billeza Saludable
#  ================================
#  Genera un dump comprimido de la base y lo guarda por 7 dias.
#  PRO-TIP: configuralo tambien para copiar el archivo a otro lugar
#  (Google Drive, otro server, o un bucket S3) para que sea un backup real.

set -euo pipefail

DB_NAME="belleza_saludable"
DB_USER="belleza"
BACKUP_DIR="/var/backups/belleza"
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

# --- OPCIONAL: subir a otro lugar (descomenta y configura) ---
# Ejemplo con rclone a Google Drive:
# rclone copy "${DUMP_FILE}" remote:belleza-backups/ 2>/dev/null || echo "AVISO: no se pudo subir copia remota"

# Borrar backups viejos
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +${KEEP_DAYS} -delete

echo "Backup completado. ${KEEP_DAYS} dias de retencion."
