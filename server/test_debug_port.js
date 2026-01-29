const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 9222,
    path: '/json/version',
    method: 'GET'
};

const req = http.request(options, res => {
    console.log(`StatusCode: ${res.statusCode}`);
    res.on('data', d => {
        process.stdout.write(d);
    });
});

req.on('error', error => {
    console.error('Connection Error:', error.message);
});

req.end();
