const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupIncorrectConsultants() {
    console.log('🧹 Starting Cleanup of Non-Trio Consultants...');

    try {
        // Find users created recently (simple check: those with default password hash or specific IDs if known, 
        // but here we filter by name NOT containing "Trio" and role "consultant")

        // Safety: We only target 'consultant' role.
        // And we exclude known admins or system accounts.

        const users = await prisma.user.findMany({
            where: {
                role: 'consultant',
                NOT: {
                    name: {
                        contains: 'Trio'
                    }
                }
            }
        });

        console.log(`Found ${users.length} consultants to potentially delete.`);

        if (users.length > 0) {
            console.log('Deleting...');
            const result = await prisma.user.deleteMany({
                where: {
                    id: {
                        in: users.map(u => u.id)
                    }
                }
            });
            console.log(`✅ Deleted ${result.count} users.`);
        } else {
            console.log('No incorrect consultants found.');
        }

    } catch (error) {
        console.error('❌ Cleanup Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupIncorrectConsultants();
