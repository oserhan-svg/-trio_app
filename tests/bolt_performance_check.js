
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../server/controllers/performanceController.js');
const content = fs.readFileSync(filePath, 'utf8');

console.log('--- Bolt Performance Check ---');

// Check for getConsultantPerformance optimization
const consultantsMapMatch = content.match(/consultants\.map/g);
const prismaCallsInMap = content.match(/consultants\.map\(\s*c\s*=>\s*\{[\s\S]*?await\s+prisma\./g);

if (consultantsMapMatch && !prismaCallsInMap) {
    console.log('✅ getConsultantPerformance: No await prisma calls found inside consultants.map');
} else {
    console.log('❌ getConsultantPerformance: Possible N+1 query detected in consultants.map');
}

// Check for getConsultantDetail optimization
const monthsMapMatch = content.match(/months\.map/g);
const prismaCallsInMonthsMap = content.match(/months\.map\(\s*m\s*=>\s*\{[\s\S]*?await\s+prisma\./g);

if (monthsMapMatch && !prismaCallsInMonthsMap) {
    console.log('✅ getConsultantDetail: No await prisma calls found inside months.map');
} else {
    console.log('❌ getConsultantDetail: Possible N+1 query detected in months.map');
}

// Check for bulk queries
const groupByCount = (content.match(/prisma\..*?\.groupBy/g) || []).length;
const queryRawCount = (content.match(/prisma\.\$queryRaw/g) || []).length;

console.log(`Summary: Found ${groupByCount} groupBy calls and ${queryRawCount} $queryRaw calls.`);

if (groupByCount >= 3 && queryRawCount >= 3) {
    console.log('✅ Bulk aggregation pattern verified.');
} else {
    console.log('❌ Bulk aggregation pattern missing or incomplete.');
}
