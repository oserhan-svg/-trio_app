const { exec } = require('child_process');

const PORT = 5000;

const command = process.platform === 'win32'
    ? `netstat -ano | findstr :${PORT}`
    : `lsof -i :${PORT} -t`;

exec(command, (err, stdout, stderr) => {
    if (err) {
        console.log('No process found on port', PORT);
        return;
    }

    const lines = stdout.trim().split('\n');
    lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];

        if (pid && /^\d+$/.test(pid)) {
            console.log(`Killing PID: ${pid}`);
            exec(`taskkill /F /PID ${pid}`, (kErr, kOut) => {
                if (kErr) console.error('Kill failed:', kErr.message);
                else console.log('Process killed successfully');
            });
        }
    });
});
