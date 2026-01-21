const http = require('http');

const checkPort = (port) => {
    return new Promise((resolve, reject) => {
        const req = http.request({
            host: 'localhost',
            port: port,
            path: '/',
            method: 'GET',
            timeout: 2000
        }, (res) => {
            console.log(`Port ${port} is responding with status ${res.statusCode}`);
            resolve(true);
        });

        req.on('error', (e) => {
            console.log(`Port ${port} lookup failed: ${e.message}`);
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            console.log(`Port ${port} timed out`);
            resolve(false);
        });

        req.end();
    });
};

checkPort(5000).then((alive) => {
    if (!alive) {
        console.log('CRITICAL: Server is NOT running on port 5000.');
    } else {
        console.log('Server is running.');
    }
});
