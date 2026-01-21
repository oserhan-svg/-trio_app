const { getProperties } = require('../controllers/propertyController');

// Mock Express Req/Res
const req = {
    query: {
        page: 1,
        limit: 10,
        source: 'hepsiemlak'
    }
};

const res = {
    status: function (code) {
        this.statusCode = code;
        return this;
    },
    json: function (data) {
        console.log('--- Controller Response ---');
        console.log('Status Code:', this.statusCode || 200);
        if (data.data) {
            console.log('Data Count:', data.data.length);
            if (data.data.length > 0) {
                console.log('First Item Source/URL:', data.data[0].url);
            } else {
                console.log('Data is empty.');
            }
        } else if (data.error) {
            console.error('Error:', data.error);
        } else {
            console.log('Response:', data);
        }
    },
    // Mock response for jsonBigInt helper if used
    send: function (body) {
        try {
            const json = JSON.parse(body);
            this.json(json);
        } catch (e) {
            console.log('Sent body:', body);
        }
    },
    setHeader: () => { }
};

// We need to mock jsonBigInt use in controller or ensure it works.
// The controller uses `jsonBigInt(res, ...)` helper.
// We might need to mock that helper too if it's imported in the controller.
// But the controller imports it via `require('../utils/responseHelper')`.
// So it should work if we run this script from the correct location.

async function run() {
    try {
        await getProperties(req, res);
    } catch (e) {
        console.error('Execution Failed:', e);
    }
}

run();
