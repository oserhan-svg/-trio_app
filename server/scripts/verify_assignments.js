const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAssignments() {
    const totalProperties = await prisma.property.count();

    const assignedProperties = await prisma.property.count({
        where: { assigned_user_id: { not: null } }
    });

    const trioProperties = await prisma.property.count({
        where: { seller_name: { contains: 'Trio', mode: 'insensitive' } }
    });

    const trioAssigned = await prisma.property.count({
        where: {
            seller_name: { contains: 'Trio', mode: 'insensitive' },
            assigned_user_id: { not: null }
        }
    });

    console.log('--- Assignment Verification ---');
    console.log(`Total Properties: ${totalProperties}`);
    console.log(`Assigned Properties: ${assignedProperties}`);
    console.log(`Agency (Trio) Properties: ${trioProperties}`);
    console.log(`Agency Properties Assigned: ${trioAssigned}`);
    console.log(`Pending Agency Assignments: ${trioProperties - trioAssigned}`);

    // Detail breakdown
    const consultants = await prisma.user.findMany({
        where: { role: 'consultant' },
        include: {
            _count: {
                select: { properties: true }
            }
        }
    });

    console.log('\n--- Consultant Breakdown ---');
    consultants.forEach(c => {
        console.log(`${c.name}: ${c._count.properties} listings`);
    });

    await prisma.$disconnect();
}

verifyAssignments();
