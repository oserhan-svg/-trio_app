const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Creates a timestamped PostgreSQL dump
 */
async function backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    const fileName = `backup-${timestamp}.sql`;
    const filePath = path.join(backupDir, fileName);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // Assuming we are running inside or alongside the container
    // For Dockerized setup, we'd use: docker exec emlak22_db pg_dump -U user emlak22 > backup.sql
    const command = `pg_dump ${process.env.DATABASE_URL} > ${filePath}`;

    console.log(`🚀 Starting database backup: ${fileName}...`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Backup failed: ${error.message}`);
            return;
        }
        if (stderr) {
            console.warn(`⚠️ Backup warning: ${stderr}`);
        }
        console.log(`✅ Backup completed successfully: ${filePath}`);

        // Retention policy: Keep only last 7 backups
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup-'))
            .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 7) {
            files.slice(7).forEach(f => {
                fs.unlinkSync(path.join(backupDir, f.name));
                console.log(`🗑️ Deleted old backup: ${f.name}`);
            });
        }
    });
}

// Run if called directly
if (require.main === module) {
    backupDatabase();
}

module.exports = backupDatabase;
