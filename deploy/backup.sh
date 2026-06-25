# 数据库自动备份脚本 (crontab)
# 添加定时任务: crontab -e
# 每天凌晨3点备份: 0 3 * * * /var/www/shenjiaben/deploy/backup.sh

#!/bin/bash
BACKUP_DIR="/var/backups/shenjiaben"
DATA_DIR="/var/www/shenjiaben/data"
RETENTION_DAYS=30

mkdir -p ${BACKUP_DIR}

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/shenjiaben_${DATE}.tar.gz"

# 备份数据库和数据文件
tar -czf ${BACKUP_FILE} -C /var/www/shenjiaben data/

# 删除旧备份
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup created: ${BACKUP_FILE} ($(du -h ${BACKUP_FILE} | cut -f1))"
