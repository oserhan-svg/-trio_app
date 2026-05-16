const fs = require('fs');
const path = require('path');

const performanceControllerPath = path.join(__dirname, '../server/controllers/performanceController.js');
const content = fs.readFileSync(performanceControllerPath, 'utf8');

const loops = ['consultants.map', 'months.map'];
let issues = [];

loops.forEach(loop => {
    if (content.includes(loop)) {
        const loopStart = content.indexOf(loop);
        const loopEnd = content.indexOf(');', loopStart + loop.length); // Adjusted end detection
        const loopContent = content.substring(loopStart, loopEnd);

        if (loopContent.includes('await prisma.')) {
            issues.push(`Potential N+1 query found in ${loop}`);
        }
    }
});

if (issues.length > 0) {
    console.log('❌ Performance issues found:');
    issues.forEach(issue => console.log('  -', issue));
    process.exit(1);
} else {
    console.log('✅ No N+1 queries detected in performanceController.js loops.');
    process.exit(0);
}
