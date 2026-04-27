#!/usr/bin/env bash
# ============================================================
# backup.sh — نسخ احتياطي مشفّر لقاعدة البيانات
#
# الاستخدام:
#   ./scripts/backup.sh
#
# المتطلبات:
#   - pg_dump (PostgreSQL client)
#   - age (أداة تشفير: https://age-encryption.org)
#   - AGE_RECIPIENTS في البيئة (public key للتشفير)
#
# الجدولة (cron):
#   0 3 * * * /app/scripts/backup.sh >> /var/log/baity-backup.log 2>&1
# ============================================================

set -euo pipefail

# ── الإعدادات ──
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_URL="${DATABASE_URL:?DATABASE_URL مطلوب}"
AGE_RECIPIENTS="${AGE_RECIPIENTS:?AGE_RECIPIENTS مطلوب}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/baity_${TIMESTAMP}.sql.gz.age"

# ── إنشاء مجلد النسخ ──
mkdir -p "${BACKUP_DIR}"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] بدء النسخ الاحتياطي..."

# ── نسخ احتياطي + ضغط + تشفير بـ age ──
pg_dump "${DB_URL}" \
  --no-password \
  --format=plain \
  --no-owner \
  --no-acl \
  | gzip -9 \
  | age --recipient="${AGE_RECIPIENTS}" \
  > "${BACKUP_FILE}"

SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ✓ تم الحفظ: ${BACKUP_FILE} (${SIZE})"

# ── حذف النسخ القديمة ──
find "${BACKUP_DIR}" -name "baity_*.sql.gz.age" -mtime "+${RETENTION_DAYS}" -delete
REMAINING=$(find "${BACKUP_DIR}" -name "baity_*.sql.gz.age" | wc -l)
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] النسخ المحفوظة: ${REMAINING}"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ✓ اكتمل النسخ الاحتياطي"
