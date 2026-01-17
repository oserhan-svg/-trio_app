const { updateClientPropertyStatus } = require('./controllers/clientPropertyController');

// Mock Req/Res
const req = {
    params: { clientId: '3' },
    body: { propertyId: 204, status: 'suggested' }
};

const res = {
    json: (data) => console.log('JSON Response:', data),
    status: (code) => {
        console.log('Status:', code);
        return res; // chainable
    }
};

async function test() {
    console.log('Running test...');
    await updateClientPropertyStatus(req, res);
    console.log('Test done.');
}

test();
