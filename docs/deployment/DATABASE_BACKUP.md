# Database Backup & Recovery Strategy
**Sprint 18 Phase 1 Task 1.4**

This document describes the backup strategy, restore procedures, and disaster recovery plan for the PostgreSQL database.

---

## Overview

**Database**: PostgreSQL (hosted on Railway/Neon)
**Backup Frequency**: Automatic daily + manual on-demand
**Retention**: 30 days (automatic), 90 days (critical backups)
**RTO** (Recovery Time Objective): < 1 hour
**RPO** (Recovery Point Objective): < 24 hours

---

## Automatic Backups (Railway/Neon)

### Railway Automatic Backups

**Frequency**: Daily at 2:00 AM UTC
**Retention**: 7 days (free tier), 30 days (paid tier)
**Storage**: Railway infrastructure

### Backup Schedule:
```
Daily: 2:00 AM UTC
Weekly: Sunday 2:00 AM UTC (retained longer)
Monthly: 1st of month 2:00 AM UTC (retained 90 days)
```

### Verify Automatic Backups:
```bash
# Check Railway backup status via CLI
railway status

# Or via Dashboard:
# https://railway.app/project/YOUR_PROJECT/database/backups
```

---

## Manual Backup Procedures

### Full Database Backup

**When to Run**:
- Before major deployments
- Before schema migrations
- Before bulk data operations
- Weekly (recommended)

**Backup Command**:
```bash
#!/bin/bash
# File: scripts/backup-database.sh

# Set variables
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/joffre_backup_$TIMESTAMP.sql"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Get database URL from environment
if [ -f .env.local ]; then
  export $(cat .env.local | grep DATABASE_URL | xargs)
fi

# Perform backup
echo "🔄 Starting database backup..."
pg_dump $DATABASE_URL \
  --no-owner \
  --no-acl \
  --format=plain \
  --file=$BACKUP_FILE

# Compress backup
echo "📦 Compressing backup..."
gzip $BACKUP_FILE

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
find $BACKUP_DIR -name "joffre_backup_*.sql.gz" -mtime +30 -delete

echo "✨ Backup process complete!"
```

**Usage**:
```bash
cd /path/to/project
chmod +x scripts/backup-database.sh
./scripts/backup-database.sh
```

---

### Schema-Only Backup

For quick schema backups before migrations:

```bash
#!/bin/bash
# File: scripts/backup-schema.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
SCHEMA_FILE="$BACKUP_DIR/schema_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

# Backup schema only (no data)
pg_dump $DATABASE_URL \
  --schema-only \
  --no-owner \
  --no-acl \
  --file=$SCHEMA_FILE

gzip $SCHEMA_FILE

echo "✅ Schema backup: $SCHEMA_FILE.gz"
```

---

### Data-Only Backup

For backing up data without schema:

```bash
#!/bin/bash
# File: scripts/backup-data.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DATA_FILE="$BACKUP_DIR/data_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

# Backup data only (no schema)
pg_dump $DATABASE_URL \
  --data-only \
  --no-owner \
  --no-acl \
  --file=$DATA_FILE

gzip $DATA_FILE

echo "✅ Data backup: $DATA_FILE.gz"
```

---

## Restore Procedures

### Full Database Restore

**⚠️ WARNING**: This will overwrite existing data!

```bash
#!/bin/bash
# File: scripts/restore-database.sh

# Usage: ./restore-database.sh backups/joffre_backup_20251118_143022.sql.gz

if [ -z "$1" ]; then
  echo "❌ Usage: $0 <backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Confirm before proceeding
echo "⚠️  WARNING: This will OVERWRITE the current database!"
echo "📁 Backup file: $BACKUP_FILE"
echo -n "Continue? (yes/no): "
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Restore cancelled."
  exit 0
fi

# Get database URL
if [ -f .env.local ]; then
  export $(cat .env.local | grep DATABASE_URL | xargs)
fi

# Decompress backup
TEMP_FILE="/tmp/restore_temp.sql"
echo "📦 Decompressing backup..."
gunzip -c $BACKUP_FILE > $TEMP_FILE

# Drop existing connections (optional, for clean restore)
echo "🔌 Closing existing connections..."
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();"

# Restore database
echo "🔄 Restoring database..."
psql $DATABASE_URL < $TEMP_FILE

# Verify restore
if [ $? -eq 0 ]; then
  echo "✅ Database restored successfully!"

  # Run verification query
  COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users;")
  echo "📊 Users table count: $COUNT"
else
  echo "❌ Restore failed!"
  exit 1
fi

# Cleanup
rm $TEMP_FILE

echo "✨ Restore process complete!"
```

**Usage**:
```bash
cd /path/to/project
chmod +x scripts/restore-database.sh
./scripts/restore-database.sh backups/joffre_backup_20251118_143022.sql.gz
```

---

### Partial Restore (Single Table)

To restore just one table:

```bash
#!/bin/bash
# File: scripts/restore-table.sh
# Usage: ./restore-table.sh backups/backup.sql.gz users

TABLE_NAME=$2
BACKUP_FILE=$1

gunzip -c $BACKUP_FILE | \
  psql $DATABASE_URL \
  --single-transaction \
  --table=$TABLE_NAME

echo "✅ Table $TABLE_NAME restored"
```

---

## Backup Validation

**Critical**: Always verify backups can be restored!

```bash
#!/bin/bash
# File: scripts/validate-backup.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Usage: $0 <backup-file.sql.gz>"
  exit 1
fi

echo "🔍 Validating backup: $BACKUP_FILE"

# 1. Check file exists and is readable
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ File not found: $BACKUP_FILE"
  exit 1
fi

# 2. Check file size (should be > 1KB)
SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
if [ $SIZE -lt 1024 ]; then
  echo "❌ Backup file too small: $SIZE bytes"
  exit 1
fi

echo "✅ File size: $(du -h $BACKUP_FILE | cut -f1)"

# 3. Verify gzip integrity
echo "🔍 Checking gzip integrity..."
gunzip -t $BACKUP_FILE 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Gzip file corrupted!"
  exit 1
fi

echo "✅ Gzip file valid"

# 4. Check SQL syntax (basic check)
echo "🔍 Checking SQL syntax..."
TEMP_FILE="/tmp/backup_validate.sql"
gunzip -c $BACKUP_FILE > $TEMP_FILE

# Count key SQL statements
CREATE_COUNT=$(grep -c "CREATE TABLE" $TEMP_FILE)
INSERT_COUNT=$(grep -c "INSERT INTO" $TEMP_FILE)
COPY_COUNT=$(grep -c "COPY.*FROM" $TEMP_FILE)

echo "📊 SQL Statistics:"
echo "  - CREATE TABLE statements: $CREATE_COUNT"
echo "  - INSERT statements: $INSERT_COUNT"
echo "  - COPY statements: $COPY_COUNT"

rm $TEMP_FILE

if [ $CREATE_COUNT -lt 5 ]; then
  echo "⚠️  Warning: Fewer tables than expected"
fi

echo "✅ Backup validation complete!"
```

**Usage**:
```bash
./scripts/validate-backup.sh backups/joffre_backup_20251118_143022.sql.gz
```

---

## Disaster Recovery Plan

### Scenario 1: Database Corruption

**Symptoms**: Query errors, data inconsistencies
**RTO**: 30 minutes
**RPO**: Last backup (max 24 hours)

**Recovery Steps**:
1. Stop all writes to database (maintenance mode)
2. Export current corrupted data (for analysis)
3. Restore from most recent validated backup
4. Verify data integrity
5. Resume normal operations
6. Analyze corruption cause

**Commands**:
```bash
# 1. Enable maintenance mode (set in Railway env vars)
railway env set MAINTENANCE_MODE=true

# 2. Export corrupted data
pg_dump $DATABASE_URL > corrupted_export.sql

# 3. Restore from backup
./scripts/restore-database.sh backups/latest_backup.sql.gz

# 4. Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 5. Disable maintenance mode
railway env set MAINTENANCE_MODE=false
```

---

### Scenario 2: Accidental Data Deletion

**Symptoms**: Missing user data, deleted records
**RTO**: 1 hour
**RPO**: Last backup (max 24 hours)

**Recovery Steps**:
1. Identify deleted data and timestamp
2. Find backup before deletion occurred
3. Restore to temporary database
4. Export only deleted records
5. Import into production database
6. Verify data integrity

**Commands**:
```bash
# 1. Create temporary database
createdb temp_recovery

# 2. Restore backup to temp database
gunzip -c backup.sql.gz | psql postgresql://localhost/temp_recovery

# 3. Export deleted users
psql postgresql://localhost/temp_recovery -c "
  COPY (SELECT * FROM users WHERE user_id IN (123, 456, 789))
  TO '/tmp/deleted_users.csv' CSV HEADER;
"

# 4. Import to production
psql $DATABASE_URL -c "
  COPY users FROM '/tmp/deleted_users.csv' CSV HEADER;
"

# 5. Cleanup
dropdb temp_recovery
```

---

### Scenario 3: Complete Database Loss

**Symptoms**: Database server unreachable, data center failure
**RTO**: 2 hours
**RPO**: Last backup (max 24 hours)

**Recovery Steps**:
1. Provision new database (Railway/Neon)
2. Restore from most recent backup
3. Update DATABASE_URL in all services
4. Verify all tables and data
5. Resume operations
6. Monitor for issues

**Commands**:
```bash
# 1. Create new Railway database
railway db create postgresql

# 2. Get new DATABASE_URL
NEW_DB_URL=$(railway env get DATABASE_URL)

# 3. Restore backup
gunzip -c backup.sql.gz | psql $NEW_DB_URL

# 4. Update environment variables
railway env set DATABASE_URL=$NEW_DB_URL

# 5. Restart services
railway restart
```

---

## Backup Best Practices

### Daily Operations:
- [ ] Automatic backups running daily
- [ ] Manual backup before deployments
- [ ] Manual backup before migrations
- [ ] Test restore weekly

### Weekly Tasks:
- [ ] Validate one random backup
- [ ] Review backup logs
- [ ] Check backup storage usage
- [ ] Clean up old backups (> 30 days)

### Monthly Tasks:
- [ ] Full disaster recovery test
- [ ] Review RTO/RPO objectives
- [ ] Update restore procedures
- [ ] Train team on restore process

---

## Backup Storage

### Local Backups:
**Location**: `./backups/`
**Retention**: 30 days
**Size**: ~5-20 MB compressed per backup

### Remote Backups (Recommended):
**Options**:
1. **AWS S3**: Low cost, high durability
2. **Google Cloud Storage**: Similar to S3
3. **Backblaze B2**: Cheapest option

**Example S3 Upload**:
```bash
#!/bin/bash
# Upload backup to S3 after creation

BACKUP_FILE=$1
S3_BUCKET="s3://your-backup-bucket/joffre/"

aws s3 cp $BACKUP_FILE $S3_BUCKET \
  --storage-class STANDARD_IA \
  --server-side-encryption AES256

echo "✅ Uploaded to S3: $S3_BUCKET$(basename $BACKUP_FILE)"
```

---

## Monitoring Backup Health

### Automated Health Check:
```bash
#!/bin/bash
# File: scripts/backup-health-check.sh

BACKUP_DIR="./backups"
MAX_AGE_HOURS=26  # Alert if no backup in 26 hours

# Find most recent backup
LATEST=$(ls -t $BACKUP_DIR/joffre_backup_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  echo "❌ No backups found!"
  exit 1
fi

# Check age
AGE_SECONDS=$(( $(date +%s) - $(stat -f%m "$LATEST" 2>/dev/null || stat -c%Y "$LATEST") ))
AGE_HOURS=$(( AGE_SECONDS / 3600 ))

echo "📁 Latest backup: $(basename $LATEST)"
echo "⏰ Age: $AGE_HOURS hours"

if [ $AGE_HOURS -gt $MAX_AGE_HOURS ]; then
  echo "❌ Backup too old! Create new backup."
  exit 1
else
  echo "✅ Backup health: OK"
fi
```

---

## Emergency Contacts

**Database Issues**:
- Railway Support: https://railway.app/help
- Neon Support: https://neon.tech/docs/introduction/support

**Team Contacts**:
- Primary DBA: `YOUR_EMAIL@example.com`
- Backup DBA: `BACKUP_EMAIL@example.com`
- On-Call: `ONCALL_EMAIL@example.com`

---

## Quick Reference

**Backup Command**:
```bash
./scripts/backup-database.sh
```

**Restore Command**:
```bash
./scripts/restore-database.sh backups/joffre_backup_YYYYMMDD_HHMMSS.sql.gz
```

**Validate Backup**:
```bash
./scripts/validate-backup.sh backups/joffre_backup_YYYYMMDD_HHMMSS.sql.gz
```

**Health Check**:
```bash
./scripts/backup-health-check.sh
```

---

*Last Updated: 2025-11-18*
*Sprint 18 Phase 1 Task 1.4*
*Status: Documentation Complete - Scripts Need Creation*
