const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../server/controllers/performanceController.js');
const content = fs.readFileSync(targetFile, 'utf8');

console.log('--- Bolt Performance Check: N+1 Detection ---');

// More precise regex: check if await prisma is used inside the BODY of a loop
// This is a simple heuristic: if await prisma exists, and we find a .map(.. => { ... await prisma ... })
// We use a simplified check: search for 'await prisma' and see if it is preceded by a loop start without a closing brace.

function checkN1(code) {
    const lines = code.split('\n');
    let inLoop = false;
    let braceLevel = 0;
    let loopBraceLevel = -1;
    let violations = [];

    const loopRegex = /\.(map|forEach|filter|reduce)\s*\(|for\s*\(|while\s*\(/;

    lines.forEach((line, index) => {
        if (loopRegex.test(line)) {
            inLoop = true;
            loopBraceLevel = braceLevel;
        }

        if (line.includes('{')) braceLevel++;
        if (line.includes('}')) {
            braceLevel--;
            if (inLoop && braceLevel <= loopBraceLevel) {
                inLoop = false;
                loopBraceLevel = -1;
            }
        }

        if (inLoop && /await\s+prisma\./.test(line)) {
            violations.push(index + 1);
        }
    });

    return violations;
}

const violations = checkN1(content);

if (violations.length === 0) {
    console.log('✅ PASS: No N+1 query patterns detected in performanceController.js');
    process.exit(0);
} else {
    console.error(`❌ FAIL: "await prisma" found inside loop at lines: ${violations.join(', ')}`);
    process.exit(1);
}
