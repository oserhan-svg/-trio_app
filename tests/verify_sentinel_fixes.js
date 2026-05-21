const fs = require('fs');
const path = require('path');

function checkFile(filepath, patterns) {
    const content = fs.readFileSync(path.join(__dirname, '..', filepath), 'utf8');
    let allPassed = true;
    patterns.forEach(pattern => {
        const matches = content.match(pattern.regex);
        const success = pattern.shouldExist ? !!matches : !matches;
        if (!success) {
            console.error(`❌ Check failed for ${filepath}: ${pattern.message}`);
            allPassed = false;
        } else {
            console.log(`✅ Check passed for ${filepath}: ${pattern.message}`);
        }
    });
    return allPassed;
}

const checks = [
    {
        filepath: 'server/routes/dealRoutes.js',
        patterns: [
            {
                regex: /router\.get\('\/internal\/migrate',\s*authenticateToken,\s*authorizeRole\('admin'\),\s*dealController\.runInternalMigration\)/,
                shouldExist: true,
                message: 'Internal migration route is secured with authenticateToken and authorizeRole'
            }
        ]
    },
    {
        filepath: 'server/routes/adminRoutes.js',
        patterns: [
            {
                regex: /router\.get\('\/stats',\s*authenticateToken,\s*authorizeRole\('admin'\),\s*getDashboardStats\)/,
                shouldExist: true,
                message: 'Admin stats route is secured with authorizeRole'
            }
        ]
    },
    {
        filepath: 'server/scripts/createAdminPrisma.js',
        patterns: [
            {
                regex: /require\('dotenv'\)\.config\(\)/,
                shouldExist: true,
                message: 'dotenv is loaded in createAdminPrisma.js'
            },
            {
                regex: /const email = 'admin@emlak22\.com'/,
                shouldExist: false,
                message: 'Hardcoded admin email is removed'
            },
            {
                regex: /const password = '1234'/,
                shouldExist: false,
                message: 'Hardcoded admin password is removed'
            },
            {
                regex: /const email = process\.env\.ADMIN_EMAIL/,
                shouldExist: true,
                message: 'Admin email uses environment variable'
            },
            {
                regex: /const password = process\.env\.ADMIN_PASSWORD/,
                shouldExist: true,
                message: 'Admin password uses environment variable'
            }
        ]
    },
    {
        filepath: 'server/controllers/userController.js',
        patterns: [
            {
                regex: /console\.log\(`\[UPDATE USER\] ID: \$\{id\}, Body:`, req\.body\)/,
                shouldExist: false,
                message: 'Unsanitized log in updateUser is removed'
            },
            {
                regex: /if \(sanitizedBody\.password\) sanitizedBody\.password = '\*\*\*MASKED\*\*\*'/,
                shouldExist: true,
                message: 'Log sanitization is implemented in updateUser'
            }
        ]
    }
];

let totalSuccess = true;
checks.forEach(check => {
    if (!checkFile(check.filepath, check.patterns)) {
        totalSuccess = false;
    }
});

if (totalSuccess) {
    console.log('\n✨ All security verification checks passed!');
    process.exit(0);
} else {
    console.error('\n🚨 Some security verification checks failed!');
    process.exit(1);
}
