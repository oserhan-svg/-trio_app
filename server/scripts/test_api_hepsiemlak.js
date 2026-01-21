const http = require('http');

const url = 'http://localhost:5000/api/properties?source=hepsiemlak';

console.log(`Testing API: ${url}`);

http.get(url, (res) => {
    let data = '';

    console.log('Status Code:', res.statusCode);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.data) {
                console.log('Data Count:', json.data.length);
                if (json.data.length > 0) {
                    console.log('First Item URL:', json.data[0].url);
                } else {
                    console.log('Data array is empty.');
                }
            } else {
                console.log('No data field in response. Keys:', Object.keys(json));
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw body:', data.substring(0, 100));
        }
    });

}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
