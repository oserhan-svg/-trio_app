
const { saveListings } = require('./services/scraperService');
const prisma = require('./db');

async function debugSave() {
    console.log('--- DEBUG: saveListings START ---');

    // Create a mock new listing that definitely doesn't exist
    const randomId = 'TEST-' + Math.floor(Math.random() * 1000000);
    const mockListing = {
        external_id: randomId,
        title: "DEBUG TEST Ilan " + randomId,
        price: 5000000,
        url: "https://example.com/" + randomId,
        district: "Ayvalık",
        neighborhood: "Merkez Mah.",
        rooms: "3+1",
        size_m2: 120,
        listing_date: '2026-01-27', // String date to test conversion
        seller_type: 'owner',
        listing_type: 'sale',
        category: 'residential',
        description: "Debug test listing"
    };

    console.log(`Attempting to save listing: ${randomId}`);
    try {
        await saveListings([mockListing]);

        // Verify it was saved
        const saved = await prisma.property.findUnique({
            where: { external_id: randomId }
        });

        if (saved) {
            console.log('✅ SUCCESS: Listing was saved to DB!');
            console.log('Saved Listing:', JSON.stringify(saved, null, 2));

            // Clean up
            await prisma.property.delete({ where: { id: saved.id } });
            console.log('🧹 Cleanup: Test listing deleted.');
        } else {
            console.error('❌ FAILURE: Listing was NOT found in DB after save attempt.');
        }

    } catch (e) {
        console.error('❌ CRITICAL ERROR in saveListings:', e);
    } finally {
        await prisma.$disconnect();
    }
}

debugSave();
