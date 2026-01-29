const prisma = require('./db');

console.log('Available prisma models:');
console.log(Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')));
process.exit(0);
