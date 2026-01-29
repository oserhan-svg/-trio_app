// Smart Deduplication Helper for Portfolio Sync
// This prevents duplicate listings from being marked as primary

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Detect and mark duplicates in newly scraped listings
 * @param {Array} newListings - Freshly scraped listings
 * @returns {Array} - Listings with correct is_primary flags
 */
async function deduplicateListings(newListings) {
    if (!newListings || newListings.length === 0) return [];

    console.log(`🔍 Deduplicating ${newListings.length} listings...`);

    // Fetch existing active listings from the database
    const existingListings = await prisma.property.findMany({
        where: {
            status: 'active',
            seller_name: { contains: 'trio', mode: 'insensitive' }
        },
        select: {
            id: true,
            external_id: true,
            url: true,
            title: true,
            price: true,
            neighborhood: true,
            rooms: true,
            group_id: true,
            is_primary: true
        }
    });

    // Create lookup maps for fast matching
    const externalIdMap = new Map();
    const urlMap = new Map();

    existingListings.forEach(listing => {
        if (listing.external_id) {
            externalIdMap.set(listing.external_id, listing);
        }
        externalIdMap.set(listing.url, listing);
    });

    const deduplicatedListings = [];
    const duplicateCount = { exact: 0, similar: 0 };

    for (const newListing of newListings) {
        let isDuplicate = false;
        let matchedListing = null;

        // 1. Check for exact match by external_id
        if (newListing.external_id && externalIdMap.has(newListing.external_id)) {
            matchedListing = externalIdMap.get(newListing.external_id);
            isDuplicate = true;
            duplicateCount.exact++;
        }

        // 2. Check for exact match by URL
        if (!isDuplicate && urlMap.has(newListing.url)) {
            matchedListing = urlMap.get(newListing.url);
            isDuplicate = true;
            duplicateCount.exact++;
        }

        // 3. Check for similar listing (same price, neighborhood, rooms)
        if (!isDuplicate) {
            const similarListing = existingListings.find(existing =>
                Math.abs(existing.price - newListing.price) < 100 &&
                existing.neighborhood === newListing.neighborhood &&
                existing.rooms === newListing.rooms &&
                calculateTitleSimilarity(existing.title, newListing.title) > 0.7
            );

            if (similarListing) {
                matchedListing = similarListing;
                isDuplicate = true;
                duplicateCount.similar++;
            }
        }

        // Mark as primary or non-primary based on duplicate status
        if (isDuplicate && matchedListing) {
            // This is a duplicate - mark as non-primary
            // Use the existing group_id if available
            deduplicatedListings.push({
                ...newListing,
                is_primary: false,
                group_id: matchedListing.group_id || generateGroupId()
            });
        } else {
            // This is unique - mark as primary
            deduplicatedListings.push({
                ...newListing,
                is_primary: true,
                group_id: generateGroupId()
            });
        }
    }

    console.log(`✅ Deduplication complete:`);
    console.log(`   - Exact duplicates: ${duplicateCount.exact}`);
    console.log(`   - Similar duplicates: ${duplicateCount.similar}`);
    console.log(`   - Unique listings: ${deduplicatedListings.filter(l => l.is_primary).length}`);

    return deduplicatedListings;
}

/**
 * Calculate similarity between two titles (0-1 score)
 */
function calculateTitleSimilarity(title1, title2) {
    const normalize = (str) => str
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const t1 = normalize(title1);
    const t2 = normalize(title2);

    const words1 = new Set(t1.split(' '));
    const words2 = new Set(t2.split(' '));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
}

/**
 * Generate a unique group ID for related listings
 */
function generateGroupId() {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

module.exports = { deduplicateListings };
