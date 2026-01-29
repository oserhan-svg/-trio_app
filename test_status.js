require('dotenv').config({ path: './server/.env' });
async function test() {
    try {
        const { getSessionManager } = require('./server/services/sessionManager');
        const sm = getSessionManager();
        const prisma = require('./server/db');

        const latestProp = await prisma.property.findFirst({
            orderBy: { last_scraped: 'desc' },
            select: { last_scraped: true }
        });
        console.log('Latest Prop from DB:', latestProp);

        const response = {
            success: true,
            session: sm.getStats(),
            database: {
                latestSync: latestProp ? latestProp.last_scraped : null
            }
        };
        console.log('Full Response Mock:', JSON.stringify(response, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
