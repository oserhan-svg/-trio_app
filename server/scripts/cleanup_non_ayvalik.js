const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting cleanup of Non-Ayvalık listings...');

    // 1. Explicitly outside districts (e.g. Burhaniye, etc.)
    // We get all distinct districts first to be precise
    const allDistricts = await prisma.property.groupBy({
        by: ['district'],
    });

    const districtsToDelete = allDistricts
        .map(d => d.district)
        .filter(d => d && d.trim().length > 0) // Filter out empty/null
        .filter(d => {
            const name = d.toLowerCase();
            // Whitelist of Ayvalık areas
            if (name.includes('ayvalık') || name.includes('ayvalik')) return false;
            // if (name.includes('küçükköy')) return false; // usually appears as neighborhood
            // if (name.includes('altınova')) return false;
            // if (name.includes('cunda')) return false;

            // If it is NOT in the whitelist, it is a candidate for deletion
            return true;
        });

    console.log('Districts identified for deletion:', districtsToDelete);

    if (districtsToDelete.length > 0) {
        const deleteResult = await prisma.property.deleteMany({
            where: {
                district: {
                    in: districtsToDelete
                }
            }
        });
        console.log(`🗑️ Deleted ${deleteResult.count} listings with explicit outside districts.`);
    }

    // 2. Ambiguous listings (Empty/Null district) that DO NOT contain Ayvalık keywords
    console.log('🔍 Checking ambiguous listings (empty district)...');

    const keywords = [
        'ayvalık', 'ayvalik',
        'cunda', 'alibey',
        'küçükköy', 'kucukkoy',
        'altınova', 'altinova',
        'sarımsaklı', 'sarimsakli',
        'armutçuk', 'armutcuk',
        '150 evler', 'ali çetinkaya', 'ali cetinkaya'
    ];

    // We fetch them and filter in JS for complex "contains" logic across fields, 
    // or use Raw query. Prisma `contains` is cleaner but multiple ORs can be verbose.
    // Let's use deleteMany with OR logic.

    const orConditions = keywords.flatMap(k => [
        { url: { contains: k, mode: 'insensitive' } },
        { title: { contains: k, mode: 'insensitive' } },
        { description: { contains: k, mode: 'insensitive' } },
        // Note: description might be null, but contains handles that? No, check prisma docs.
        // Actually description is nullable. 
    ]);

    // Logic: Delete listings where district is empty AND NONE of the keywords match.
    // Prisma deleteMany DOES NOT support "NOT OR" nicely in one go efficiently if the list is huge.
    // Better to Select IDs first.

    const ambiguousProps = await prisma.property.findMany({
        where: {
            OR: [
                { district: '' },
                { district: null }
            ]
        },
        select: { id: true, url: true, title: true, description: true }
    });

    const idsToDelete = [];
    for (const prop of ambiguousProps) {
        const textToCheck = `${prop.url} ${prop.title} ${prop.description || ''}`.toLowerCase();

        const hasKeyword = keywords.some(k => textToCheck.includes(k));

        if (!hasKeyword) {
            idsToDelete.push(prop.id);
        }
    }

    console.log(`Found ${idsToDelete.length} ambiguous listings without Ayvalık keywords.`);

    if (idsToDelete.length > 0) {
        // Delete in batches to be safe
        const batchSize = 1000;
        for (let i = 0; i < idsToDelete.length; i += batchSize) {
            const batch = idsToDelete.slice(i, i + batchSize);
            const res = await prisma.property.deleteMany({
                where: {
                    id: { in: batch }
                }
            });
            console.log(`🗑️ Batch ${i / batchSize + 1}: Deleted ${res.count} listings.`);
        }
    }

    console.log('✅ Cleanup complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
