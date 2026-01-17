const { getProperties } = require('./controllers/propertyController');

const req = {
    query: {
        rooms: '3+1'
    }
};

const res = {
    json: (data) => {
        console.log(`Response received: ${data.length} items`);
        data.slice(0, 3).forEach(d => console.log(`${d.id}: ${d.rooms}`));
    },
    status: (code) => {
        console.log('Status set to:', code);
        return res;
    }
};

console.log('Testing getProperties directly with rooms=3+1');
getProperties(req, res);
