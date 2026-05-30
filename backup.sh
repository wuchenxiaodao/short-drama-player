#!/bin/bash
# Short Drama Platform - Data Backup Script
# Usage: ./backup.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

BACKUP_DIR="$SCRIPT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="drama_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

MYSQL_CONTAINER="drama-mysql"
MYSQL_DATABASE="${MYSQL_DATABASE:-drama_player}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-drama2024}"

KEEP_DAYS=7

mkdir -p "$BACKUP_PATH"

info "Starting backup: $BACKUP_NAME"
info "Backup directory: $BACKUP_PATH"

backup_mysql() {
    info "Backing up MySQL database: $MYSQL_DATABASE..."

    if ! docker ps --format '{{.Names}}' | grep -q "^${MYSQL_CONTAINER}$"; then
        warn "MySQL container ($MYSQL_CONTAINER) is not running. Skipping database backup."
        return
    fi

    docker exec "$MYSQL_CONTAINER" mysqldump \
        -u root \
        -p"$MYSQL_ROOT_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        "$MYSQL_DATABASE" > "$BACKUP_PATH/database.sql" 2>/dev/null

    if [ $? -eq 0 ]; then
        info "MySQL backup completed: database.sql"
    else
        warn "MySQL backup failed. Check if the container is running and credentials are correct."
    fi
}

backup_videos() {
    info "Backing up video files..."

    local video_dir="$SCRIPT_DIR/videos"
    if [ -d "$video_dir" ]; then
        cp -r "$video_dir" "$BACKUP_PATH/videos"
        info "Video files backup completed."
    else
        info "No video directory found, skipping."
    fi
}

backup_uploads() {
    info "Backing up uploaded files..."

    local upload_dir="$SCRIPT_DIR/uploads"
    if [ -d "$upload_dir" ]; then
        cp -r "$upload_dir" "$BACKUP_PATH/uploads"
        info "Upload files backup completed."
    else
        info "No uploads directory found, skipping."
    fi
}

compress_backup() {
    info "Compressing backup files..."

    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    rm -rf "$BACKUP_NAME"

    local size
    size=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
    info "Backup compressed: ${BACKUP_NAME}.tar.gz ($size)"
}

cleanup_old_backups() {
    info "Cleaning up backups older than $KEEP_DAYS days..."

    find "$BACKUP_DIR" -name "drama_backup_*.tar.gz" -type f -mtime +$KEEP_DAYS -delete

    local count
    count=$(find "$BACKUP_DIR" -name "drama_backup_*.tar.gz" -type f | wc -l)
    info "Remaining backups: $count"
}

show_summary() {
    local size
    size=$(du -sh "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)

    echo ""
    echo "============================================"
    echo "  Backup Complete!"
    echo "============================================"
    echo "  File: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
    echo "  Size: $size"
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "============================================"
}

main() {
    backup_mysql
    backup_videos
    backup_uploads
    compress_backup
    cleanup_old_backups
    show_summary
}

main "$@"
