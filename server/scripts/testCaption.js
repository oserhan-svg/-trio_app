const http = require('http');

// valid property ID is needed. I'll pick 1 or something from the DB if I can.
// But first let's just send a dummy request. 
// If it returns 404 (Property not found), then the route works!
// If it returns 500, we have a server error.
// If it hangs/refused, we have a network error.

const data = JSON.stringify({
    propertyId: 99999, // likely not found
    platform: 'instagram'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai/generate-caption',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
        // No token? It requires auth. 
        // I need to bypass auth or get 401. 
        // If I get 401, the server is UP and the route is REGISTERED.
    }
};

console.log('Sending request to /api/ai/generate-caption...');

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data.');
    });
});

req.on('error', (e) => {
    console.error(`PROBLEM: ${e.message}`);
});

req.write(data);
req.end();
