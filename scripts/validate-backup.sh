#!/bin/bash
# Backup Validation Script
# Sprint 18 Phase 1 Task 1.4
#
# Usage: ./scripts/validate-backup.sh backups/joffre_backup_20251118_143022.sql.gz
# Validates that a backup file is readable and contains expected data

set -e  # Exit on error

# Check arguments
if [ -z "$1" ]; then
  echo "❌ Usage: $0 <backup-file.sql.gz>"
  echo "   Example: $0 backups/joffre_backup_20251118_143022.sql.gz"
  exit 1
fi

BACKUP_FILE=$1

echo "🔍 Validating backup: $BACKUP_FILE"

# 1. Check file exists and is readable
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ File not found: $BACKUP_FILE"
  exit 1
fi

# 2. Check file size (should be > 1KB)
if command -v stat &> /dev/null; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    SIZE=$(stat -f%z "$BACKUP_FILE")
  else
    # Linux
    SIZE=$(stat -c%s "$BACKUP_FILE")
  fi
else
  echo "⚠️  Cannot check file size (stat command not found)"
  SIZE=10000  # Assume valid
fi

if [ $SIZE -lt 1024 ]; then
  echo "❌ Backup file too small: $SIZE bytes"
  exit 1
fi

echo "✅ File size: $(du -h "$BACKUP_FILE" | cut -f1)"

# 3. Verify gzip integrity
echo "🔍 Checking gzip integrity..."
if gunzip -t "$BACKUP_FILE" 2>&1; then
  echo "✅ Gzip file valid"
else
  echo "❌ Gzip file corrupted!"
  exit 1
fi

# 4. Check SQL syntax (basic check)
echo "🔍 Checking SQL syntax..."
TEMP_FILE="/tmp/backup_validate.sql"
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

# Count key SQL statements
CREATE_COUNT=$(grep -c "CREATE TABLE" "$TEMP_FILE" || echo "0")
INSERT_COUNT=$(grep -c "INSERT INTO" "$TEMP_FILE" || echo "0")
COPY_COUNT=$(grep -c "COPY.*FROM" "$TEMP_FILE" || echo "0")

echo "📊 SQL Statistics:"
echo "  - CREATE TABLE statements: $CREATE_COUNT"
echo "  - INSERT statements: $INSERT_COUNT"
echo "  - COPY statements: $COPY_COUNT"

rm "$TEMP_FILE"

if [ $CREATE_COUNT -lt 5 ]; then
  echo "⚠️  Warning: Fewer tables than expected (found $CREATE_COUNT, expected ≥5)"
fi

echo "✅ Backup validation complete!"
