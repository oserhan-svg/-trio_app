const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function benchmark() {
    console.log('🚀 Starting Performance Benchmark...');

    // Ensure we have some consultants
    const consultants = await prisma.user.findMany({
        where: { role: 'consultant' }
    });

    if (consultants.length === 0) {
        console.log('⚠️ No consultants found. Creating test consultants...');
        for (let i = 0; i < 5; i++) {
            await prisma.user.create({
                data: {
                    email: `test_consultant_${i}@example.com`,
                    name: `Consultant ${i}`,
                    role: 'consultant',
                    password_hash: 'hash'
                }
            });
        }
    }

    const start = Date.now();

    // Simulate the controller logic
    const consultantsToProcess = await prisma.user.findMany({
        where: { role: 'consultant' },
        select: {
            id: true,
            email: true,
            _count: {
                select: {
                    clients: true,
                    agenda_items: true,
                    properties: true
                }
            },
            name: true
        }
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const performanceData = await Promise.all(consultantsToProcess.map(async (c) => {
        const saleCount = await prisma.property.count({
            where: { assigned_user_id: c.id, listing_type: 'sale' }
        });

        const rentCount = await prisma.property.count({
            where: { assigned_user_id: c.id, listing_type: 'rent' }
        });

        const newPortfolioCount = await prisma.property.count({
            where: { assigned_user_id: c.id, created_at: { gte: startOfMonth } }
        });

        const interactionCount = await prisma.interaction.count({
            where: { client: { consultant_id: c.id }, date: { gte: startOfMonth } }
        });

        const completedTasks = await prisma.agendaItem.count({
            where: { user_id: c.id, status: 'completed', start_at: { gte: startOfMonth } }
        });

        return { id: c.id, stats: { saleCount, rentCount, newPortfolioCount, interactionCount, completedTasks } };
    }));

    const end = Date.now();
    console.log(`⏱️ Current implementation took: ${end - start}ms for ${consultantsToProcess.length} consultants`);
    console.log(`Total queries executed (approx): ${1 + consultantsToProcess.length * 5}`);

    await prisma.$disconnect();
}

benchmark().catch(console.error);
