const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../server/controllers/performanceController.js');
const content = fs.readFileSync(filePath, 'utf8');

function checkNPlusOne() {
    console.log('--- N+1 Query Static Analysis ---');

    // Check for consultants.map(...) containing await prisma
    const consultantMapMatch = /consultants\.map\(.*?async.*?=>.*?\{([\s\S]*?)\}\)/g;
    let match;
    let foundNPlusOne = false;

    while ((match = consultantMapMatch.exec(content)) !== null) {
        const body = match[1];
        if (body.includes('await prisma.')) {
            console.error('❌ Found N+1 query in consultants.map loop!');
            foundNPlusOne = true;
        }
    }

    // Check for months.map(...) containing await prisma
    const monthsMapMatch = /months\.map\(.*?async.*?=>.*?\{([\s\S]*?)\}\)/g;
    while ((match = monthsMapMatch.exec(content)) !== null) {
        const body = match[1];
        if (body.includes('await prisma.')) {
            console.error('❌ Found N+1 query in months.map loop!');
            foundNPlusOne = true;
        }
    }

    if (!foundNPlusOne) {
        console.log('✅ No N+1 query patterns detected in loops.');
        return true;
    }
    return false;
}

if (checkNPlusOne()) {
    process.exit(0);
} else {
    process.exit(1);
}
