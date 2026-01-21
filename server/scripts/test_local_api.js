
const http = require('http');

function checkLocalApi() {
    console.log('Checking http://localhost:5000/api/properties?ids=5172,5171,5088,5087 ...');

    // Using http.get to avoid dependencies
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/properties?ids=5172,5171,5088,5087',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                const list = parsed.data || parsed; // Handle { data: [...] } or [...]

                if (Array.isArray(list)) {
                    console.log(`STATUS: Local Backend is UP. Returned ${list.length} listings.`);
                    if (list.length === 4) {
                        console.log("RESULT: Local Backend has the FIX.");
                    } else {
                        console.log("RESULT: Local Backend is running OLD CODE.");
                    }
                } else {
                    console.log("STATUS: Response is not array.", data.substring(0, 100));
                }
            } catch (e) {
                console.log("STATUS: Failed to parse JSON.", data.substring(0, 100));
            }
        });
    });

    req.on('error', (e) => {
        console.log(`STATUS: Local Backend Connection Failed. Error: ${e.message}`);
    });

    req.end();
}

checkLocalApi();
