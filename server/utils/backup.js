const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const BACKUP_DIR = path.join(__dirname, '../backups');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

const performBackup = () => {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_DIR, `data_backup_${timestamp}.json`);

        fs.copyFileSync(DATA_FILE, backupFile);
        console.log(`[Backup] Data saved to ${backupFile}`);

        // Clean up old backups (keep last 7 days) - Simple logic
        // readdir and delete old ones if needed... implementation left simple for now.
        return backupFile;
    } else {
        console.warn('[Backup] No data file found to back up.');
        return null;
    }
};

module.exports = { performBackup };
