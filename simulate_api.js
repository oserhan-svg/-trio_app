const prisma = require('./server/db');
const { buildFilterWhereClause } = require('./server/controllers/propertyController');

async function simulate() {
    try {
        console.log('--- API Simulation ---');

        // 1. Simulate Agency Mode (Admin view)
        const agencyQuery = { portfolio: 'agency', status: 'active' };
        const agencyWhere = buildFilterWhereClause(agencyQuery);
        console.log('Agency WHERE:', JSON.stringify(agencyWhere, null, 2));
        const agencyAgg = await prisma.property.aggregate({
            where: agencyWhere,
            _count: { id: true }
        });
        console.log('Agency Stats Count:', agencyAgg._count.id);

        // 2. Simulate Mine Mode (User ID 1)
        const mineQuery = { portfolio: 'mine', status: 'active', assigned_user_id: '1' };
        const mineWhere = buildFilterWhereClause(mineQuery);
        console.log('Mine (ID:1) WHERE:', JSON.stringify(mineWhere, null, 2));
        const mineAgg = await prisma.property.aggregate({
            where: mineWhere,
            _count: { id: true }
        });
        console.log('Mine (ID:1) Stats Count:', mineAgg._count.id);

        // 3. Simulate Mine Mode (User ID 311 - O. Serhan)
        const mineQuery2 = { portfolio: 'mine', status: 'active', assigned_user_id: '311' };
        const mineWhere2 = buildFilterWhereClause(mineQuery2);
        console.log('Mine (ID:311) WHERE:', JSON.stringify(mineWhere2, null, 2));
        const mineAgg2 = await prisma.property.aggregate({
            where: mineWhere2,
            _count: { id: true }
        });
        console.log('Mine (ID:311) Stats Count:', mineAgg2._count.id);

    } catch (error) {
        console.error('Simulation Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

simulate();
