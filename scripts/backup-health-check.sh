#!/bin/bash
# Backup Health Check Script
# Sprint 18 Phase 1 Task 1.4
#
# Usage: ./scripts/backup-health-check.sh
# Checks if recent backups exist and are not too old

set -e  # Exit on error

BACKUP_DIR="./backups"
MAX_AGE_HOURS=26  # Alert if no backup in 26 hours

# Find most recent backup
LATEST=$(ls -t "$BACKUP_DIR"/joffre_backup_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  echo "❌ No backups found in $BACKUP_DIR!"
  echo "   Run: ./scripts/backup-database.sh"
  exit 1
fi

# Check age
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  FILE_TIME=$(stat -f%m "$LATEST")
else
  # Linux
  FILE_TIME=$(stat -c%Y "$LATEST")
fi

CURRENT_TIME=$(date +%s)
AGE_SECONDS=$((CURRENT_TIME - FILE_TIME))
AGE_HOURS=$((AGE_SECONDS / 3600))

echo "📁 Latest backup: $(basename "$LATEST")"
echo "⏰ Age: $AGE_HOURS hours"

if [ $AGE_HOURS -gt $MAX_AGE_HOURS ]; then
  echo "❌ Backup too old! Create new backup."
  echo "   Run: ./scripts/backup-database.sh"
  exit 1
else
  echo "✅ Backup health: OK"
fi
