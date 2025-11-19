#!/bin/bash
# Database Backup Script
# Sprint 18 Phase 1 Task 1.4
#
# Usage: ./scripts/backup-database.sh
# Creates a compressed SQL backup of the PostgreSQL database

set -e  # Exit on error

# Set variables
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/joffre_backup_$TIMESTAMP.sql"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Get database URL from environment
if [ -f .env.local ]; then
  export $(cat .env.local | grep DATABASE_URL | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not found in .env.local"
  echo "   Please set DATABASE_URL in .env.local or environment variables"
  exit 1
fi

# Perform backup
echo "🔄 Starting database backup..."
echo "📁 Backup file: $BACKUP_FILE"
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-acl \
  --format=plain \
  --file="$BACKUP_FILE"

# Compress backup
echo "📦 Compressing backup..."
gzip "$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_FILE.gz" ]; then
  SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
  echo "✅ Backup completed: $BACKUP_FILE.gz ($SIZE)"
else
  echo "❌ Backup failed!"
  exit 1
fi

# Clean up old backups (keep last 30 days)
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "joffre_backup_*.sql.gz" -mtime +30 -delete

echo "✨ Backup process complete!"
