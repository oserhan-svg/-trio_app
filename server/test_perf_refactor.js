const fs = require('fs');
let code = fs.readFileSync('server/controllers/performanceController.js', 'utf8');

// Replace in getConsultantPerformance
code = code.replace(
    /const saleCount = await prisma\.property\.count\(\{[\s\S]*?const completedTasks = await prisma\.agendaItem\.count\(\{[\s\S]*?\}\);/m,
    `const [saleCount, rentCount, newPortfolioCount, interactionCount, completedTasks] = await Promise.all([
                prisma.property.count({
                    where: {
                        assigned_user_id: c.id,
                        listing_type: 'sale'
                    }
                }),
                prisma.property.count({
                    where: {
                        assigned_user_id: c.id,
                        listing_type: 'rent'
                    }
                }),
                prisma.property.count({
                    where: {
                        assigned_user_id: c.id,
                        created_at: { gte: startOfMonth }
                    }
                }),
                prisma.interaction.count({
                    where: {
                        client: { consultant_id: c.id },
                        date: { gte: startOfMonth }
                    }
                }),
                prisma.agendaItem.count({
                    where: {
                        user_id: c.id,
                        status: 'completed',
                        start_at: { gte: startOfMonth }
                    }
                })
            ]);`
);

// Replace in getConsultantDetail
code = code.replace(
    /const propertiesCount = await prisma\.property\.count\(\{[\s\S]*?const interactionsCount = await prisma\.interaction\.count\(\{[\s\S]*?\}\);/m,
    `const [propertiesCount, interactionsCount] = await Promise.all([
                prisma.property.count({
                    where: {
                        assigned_user_id: consultantId,
                        created_at: { gte: m.start, lte: m.end }
                    }
                }),
                prisma.interaction.count({
                    where: {
                        client: { consultant_id: consultantId },
                        date: { gte: m.start, lte: m.end }
                    }
                })
            ]);`
);

fs.writeFileSync('server/controllers/performanceController.tmp.js', code);
