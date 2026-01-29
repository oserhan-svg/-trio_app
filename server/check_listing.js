
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkListing() {
    try {
        const listing = await prisma.propertyListing.findFirst({
            orderBy: { created_at: 'desc' },
            include: { property: true }
        });

        if (listing) {
            console.log('Listing Found:');
            console.log('Token:', listing.public_token);
            console.log('Property ID:', listing.property_id);
            console.log('Property Title:', listing.property?.title);
        } else {
            console.log('No listings found in PropertyListing table.');

            // Eğer listing yoksa property tablosuna bakalım
            const property = await prisma.property.findFirst();
            if (property) {
                console.log('But properties exist. Property ID:', property.id);
            } else {
                console.log('No properties found either.');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkListing();
