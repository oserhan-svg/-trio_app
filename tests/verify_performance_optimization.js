const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, '../server/controllers/performanceController.js');
const content = fs.readFileSync(controllerPath, 'utf8');

console.log('--- Static Performance Analysis: performanceController.js ---');

function analyzeFunction(funcName) {
    const startIdx = content.indexOf(`exports.${funcName}`);
    if (startIdx === -1) return;

    let endIdx = content.indexOf('exports.', startIdx + 1);
    if (endIdx === -1) endIdx = content.length;

    const funcBody = content.substring(startIdx, endIdx);
    console.log(`\nAnalyzing function: ${funcName}`);

    // Count prisma calls including raw SQL
    const awaits = (funcBody.match(/await prisma/g) || []).length;
    console.log(`Total prisma calls (including raw): ${awaits}`);

    const hasRaw = funcBody.includes('$queryRaw');
    const hasGroupBy = funcBody.includes('.groupBy');
    console.log(`Uses bulk operations: ${hasRaw || hasGroupBy ? 'Yes' : 'No'} ($queryRaw: ${hasRaw}, .groupBy: ${hasGroupBy})`);

    const mapMatches = funcBody.match(/\.map\(async/g);
    if (mapMatches) {
        console.log(`Found ${mapMatches.length} async loops.`);
        const loopStart = funcBody.indexOf('.map(async');
        const loopEnd = funcBody.lastIndexOf('}))');
        const loopBody = funcBody.substring(loopStart, loopEnd);
        const loopAwaits = (loopBody.match(/await prisma/g) || []).length;

        console.log(`Prisma calls inside loop: ${loopAwaits}`);
        if (loopAwaits > 0) {
            console.log('❌ N+1 Bottleneck STILL DETECTED');
        } else {
            console.log('✅ N+1 Bottleneck REMOVED (O(1) achieved)');
        }
    } else {
        console.log('✅ No async loops found. Function is O(1) regarding input size.');
    }
}

analyzeFunction('getConsultantPerformance');
analyzeFunction('getConsultantDetail');
