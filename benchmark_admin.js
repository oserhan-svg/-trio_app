const { execSync } = require('child_process');
const adminController = require('./server/controllers/adminController');

// Mock req and res
const req = {};
let resData = null;
const res = {
    json: (data) => {
        resData = data;
    },
    status: (code) => {
        return {
            json: (data) => {
                resData = data;
            }
        };
    }
};

async function run() {
    const start = Date.now();
    await adminController.getDashboardStats(req, res);
    const end = Date.now();
    console.log(`Execution time: ${end - start}ms`);
}

run();
