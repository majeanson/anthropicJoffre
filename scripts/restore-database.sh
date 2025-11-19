#!/bin/bash
# Database Restore Script
# Sprint 18 Phase 1 Task 1.4
#
# Usage: ./scripts/restore-database.sh backups/joffre_backup_20251118_143022.sql.gz
# Restores database from a compressed SQL backup

set -e  # Exit on error

# Check arguments
if [ -z "$1" ]; then
  echo "❌ Usage: $0 <backup-file.sql.gz>"
  echo "   Example: $0 backups/joffre_backup_20251118_143022.sql.gz"
  exit 1
fi

BACKUP_FILE=$1

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Confirm before proceeding
echo "⚠️  WARNING: This will OVERWRITE the current database!"
echo "📁 Backup file: $BACKUP_FILE"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Restore cancelled."
  exit 0
fi

# Get database URL
if [ -f .env.local ]; then
  export $(cat .env.local | grep DATABASE_URL | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not found in .env.local"
  echo "   Please set DATABASE_URL in .env.local or environment variables"
  exit 1
fi

# Decompress backup
TEMP_FILE="/tmp/restore_temp.sql"
echo "📦 Decompressing backup..."
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

# Drop existing connections (optional, for clean restore)
echo "🔌 Closing existing connections..."
psql "$DATABASE_URL" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();" 2>/dev/null || true

# Restore database
echo "🔄 Restoring database..."
psql "$DATABASE_URL" < "$TEMP_FILE"

# Verify restore
if [ $? -eq 0 ]; then
  echo "✅ Database restored successfully!"

  # Run verification query
  COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
  echo "📊 Users table count: $COUNT"
else
  echo "❌ Restore failed!"
  exit 1
fi

# Cleanup
rm "$TEMP_FILE"

echo "✨ Restore process complete!"
