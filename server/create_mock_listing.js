
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createListing() {
    try {
        // Find existing listing first
        const existingListing = await prisma.propertyListing.findFirst();
        if (existingListing) {
            console.log('Listing found. Token:', existingListing.share_token);
            return;
        }

        const property = await prisma.property.findFirst();
        if (!property) {
            console.log('No property found to create listing.');
            return;
        }

        const token = Math.random().toString(36).substring(7);
        const listing = await prisma.propertyListing.create({
            data: {
                property_id: property.id,
                share_token: token,
                // marketing_content: { instagram: "Test", stories: [], hashtags: ["#emlak"] }
            }
        });
        console.log('Listing Created!');
        console.log('Token:', listing.share_token);
    } catch (error) {
        console.error('Error creating listing:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createListing();
