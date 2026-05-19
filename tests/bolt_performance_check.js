
// Static Analysis verification for N+1 queries
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../server/controllers/performanceController.js');
const content = fs.readFileSync(filePath, 'utf8');

console.log('--- Bolt Performance Check ---');

const consultantsLoop = content.includes('consultants.map(async');
const monthsLoop = content.includes('months.map(async');

let score = 100;
let issues = [];

if (consultantsLoop) {
    score -= 50;
    issues.push('N+1 Query Pattern: Found "consultants.map(async" which likely performs DB queries in a loop.');
} else {
    console.log('✅ getConsultantPerformance optimized: No async map on consultants.');
}

if (monthsLoop) {
    score -= 30;
    issues.push('N+1 Query Pattern: Found "months.map(async" which likely performs DB queries in a loop.');
} else {
    console.log('✅ getConsultantDetail optimized: No async map on months.');
}

const awaitPrismaCount = (content.match(/await prisma\./g) || []).length;
console.log(`Total 'await prisma' calls: ${awaitPrismaCount}`);

if (awaitPrismaCount > 15) {
    score -= 20;
    issues.push(`High number of direct prisma calls (${awaitPrismaCount}). Potential for further aggregation.`);
}

console.log(`\nPerformance Score: ${score}/100`);
if (issues.length > 0) {
    console.log('Issues found:');
    issues.forEach(issue => console.log(`- ${issue}`));
    process.exit(1);
} else {
    console.log('🚀 Optimization verified! No N+1 patterns detected in performanceController.js');
    process.exit(0);
}
