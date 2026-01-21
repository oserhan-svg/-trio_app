const prisma = require('../db');
const { jsonBigInt } = require('../utils/responseHelper');

// Helper to upgrade image quality on the fly
const upgradeImages = (images) => {
    if (!images || !Array.isArray(images)) return [];
    const processed = images
        .filter(img => typeof img === 'string')
        .filter(img => !img.startsWith('data:image/gif')) // Remove lazy-load placeholders
        .map(src => {
            let clean = src;
            // Hepsiemlak: Remove /mnresize/width/height/ (Handles hecdn and hemlak domains)
            if (clean && (clean.includes('hemlak.com') || clean.includes('hecdn.com')) && clean.includes('/mnresize/')) {
                clean = clean.replace(/\/mnresize\/\d+\/\d+\//, '/');
            }
            return clean;
        });

    // Deduplicate aggressively
    const unique = [];
    const seen = new Set();

    processed.forEach(src => {
        let key = src;
        // For Hepsiemlak numeric filenames (timestamp-listingId.jpg), use listingId as key to prevent visual clones
        // Example: 1768843594696-45955610.jpg -> 45955610.jpg
        if (src.includes('hemlak.com') || src.includes('hecdn.com')) {
            const hMatch = src.match(/\/(\d+)-(\d+)\.jpg/);
            if (hMatch) {
                // Key is: directory_path + listingId
                // We keep the first occurrence of each listingId in the same path
                key = src.replace(/\/\d+-(\d+)\.jpg/, '/$1.jpg');
            }
        }

        if (!seen.has(key)) {
            seen.add(key);
            unique.push(src);
        }
    });

    return unique;
};

// ... (getProperties remains the same)

const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await prisma.property.findUnique({
            where: { id: parseInt(id) },
            include: {
                history: { orderBy: { changed_at: 'asc' } }
            }
        });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Upgrade images
        const upgradedProperty = {
            ...property,
            images: upgradeImages(property.images)
        };

        if (id == 4826) {
            console.log('DEBUG 4826 IMAGES:', upgradedProperty.images.slice(0, 3));
        }


        // 3. Fetch other listings in the same group
        let otherListings = [];
        try {
            if (property.group_id) {
                otherListings = await prisma.property.findMany({
                    where: {
                        group_id: property.group_id,
                        id: { not: parseInt(id) }
                    },
                    select: {
                        id: true,
                        url: true,
                        price: true,
                        external_id: true,
                        listing_date: true
                    }
                });


                // Deduplicate by URL (Aggressive Normalization)
                // Deduplicate by Domain (Show only 1 per portal, prioritizing newest)
                const domainMap = new Map();

                // 1. Identify Current Domain
                let currentDomain = '';
                if (property.url) {
                    if (property.url.includes('sahibinden.com')) currentDomain = 'sahibinden';
                    else if (property.url.includes('hemlak') || property.url.includes('hepsiemlak')) currentDomain = 'hepsiemlak';
                    else if (property.url.includes('emlakjet')) currentDomain = 'emlakjet';
                }

                // 2. Process other listings
                otherListings = otherListings.filter(l => {
                    if (!l.url) return false;

                    let domain = 'other';
                    if (l.url.includes('sahibinden.com')) domain = 'sahibinden';
                    else if (l.url.includes('hemlak') || l.url.includes('hepsiemlak')) domain = 'hepsiemlak';
                    else if (l.url.includes('emlakjet')) domain = 'emlakjet';

                    // If same domain as current property, we generally skip unless it's a wildly different valid listing.
                    // But usually "Other Portals" implies *other* portals. 
                    // User feedback suggests they see "Hepsiemlak" multiple times.
                    // Let's strictly limit to 1 per domain.

                    const existing = domainMap.get(domain);
                    if (!existing) {
                        domainMap.set(domain, l);
                        return true;
                    } else {
                        // Keep the newer one (sort logic in memory)
                        const existingDate = new Date(existing.listing_date || 0);
                        const currentDate = new Date(l.listing_date || 0);
                        if (currentDate > existingDate) {
                            domainMap.set(domain, l);
                            // We need to re-filter the array effectively or just build a new one from map values.
                            // Since filter runs once, we can't easily swap. 
                            // Better strategy: Sort first, then pick unique domains.
                            return false;
                        }
                        return false;
                    }
                });

                // Re-do correctly: Sort by date desc, then uniq by domain
                otherListings.sort((a, b) => new Date(b.listing_date) - new Date(a.listing_date));
                const distinctListings = [];
                const seenDomains = new Set();

                // Add current domain to seen if we want to hide same-portal generic duplicates
                // seenDomains.add(currentDomain); 
                // Actually, sometimes seeing a duplicate on the same site is useful if it's a different price?
                // The user said "Wrong", implying they don't want the noise.
                // Let's showing 1 per external domain. And maybe 1 from same domain if it's substantially different?
                // Simplest fix for "Wrong": One per domain.

                if (currentDomain) seenDomains.add(currentDomain); // Don't show same portal links in "Other Portals"

                for (const l of otherListings) {
                    let domain = 'other';
                    if (l.url.includes('sahibinden.com')) domain = 'sahibinden';
                    else if (l.url.includes('hemlak') || l.url.includes('hepsiemlak')) domain = 'hepsiemlak';
                    else if (l.url.includes('emlakjet')) domain = 'emlakjet';

                    if (!seenDomains.has(domain)) {
                        seenDomains.add(domain);
                        distinctListings.push(l);
                    }
                }
                otherListings = distinctListings;

                // 4. Combined Price History
                const groupIds = [property.id, ...otherListings.map(l => l.id)];
                const allHistories = await prisma.propertyHistory.findMany({
                    where: { property_id: { in: groupIds } },
                    orderBy: { changed_at: 'asc' }
                });

                // If we have multiple listings, we might have duplicate "initial" entries. 
                // We'll keep them as they show when each portal picked it up.
                property.merged_history = allHistories;
            } else {
                property.merged_history = property.history;
            }
        } catch (groupError) {
            console.error('Group processing error:', groupError);
            // Fallback to basic history if grouping fails
            property.merged_history = property.history;
        }

        // Use safe serializer
        jsonBigInt(res, {
            ...upgradedProperty,
            other_listings: otherListings,
            merged_history: property.merged_history
        });
    } catch (error) {
        console.error('Get Property Detail Error:', error);
        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(__dirname, '..', 'crash_log.txt');
            fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] Error in getPropertyById: ${error.message}\nStack: ${error.stack}\n`);
        } catch (fError) { console.error('Failed to write log', fError); }

        res.status(500).json({ error: 'Failed to fetch property details: ' + error.message });
    }
};

const getProperties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const { minPrice, maxPrice, rooms, district, opportunity_filter, category, listingType, seller_type, source, sort, status } = req.query;

        const where = { AND: [] };

        // Support for specific IDs (Priority High)
        // If IDs are requested, we generally want exactly these records, regardless of primary status.
        let isSpecificIdRequest = false;
        if (req.query.ids !== undefined) {
            isSpecificIdRequest = true;
            const idList = req.query.ids.split(',').map(id => parseInt(id)).filter(n => !isNaN(n));

            if (idList.length > 0) {
                where.AND.push({ id: { in: idList } });
                // If specific IDs are requested, we bypass the default limit
                if (!req.query.limit) {
                    req.query.limit = idList.length;
                }
            } else {
                where.AND.push({ id: -1 });
            }
        }

        if (status && status !== 'all') {
            where.AND.push({ status: status });
        } else if (!req.query.show_all && !isSpecificIdRequest && !req.query.ids) {
            // Default to active unless show_all is requested OR specific IDs are requested
            where.AND.push({ status: 'active' });
        }

        // IDs handled at top level now


        if (category && category !== 'all') {
            const catLower = category.toLowerCase();
            if (catLower === 'daire') {
                where.AND.push({
                    category: { in: ['daire', 'residential', 'Daire'] }
                });
            } else {
                where.AND.push({ category: category });
            }
        }

        if (listingType && listingType !== 'all') {
            where.AND.push({ listing_type: listingType });
        }

        if (seller_type && seller_type !== 'all') {
            where.AND.push({ seller_type: seller_type });
        }

        if (source && source !== 'all') {
            if (source === 'sahibinden') {
                where.AND.push({ url: { contains: 'sahibinden.com' } });
            } else if (source === 'hepsiemlak' || source === 'hemlak') {
                where.AND.push({ url: { contains: 'hemlak.com' } });
            } else if (source === 'emlakjet') {
                where.AND.push({ url: { contains: 'emlakjet.com' } });
            }
        }

        if (minPrice) {
            where.AND.push({ price: { gte: parseFloat(minPrice) } });
        }
        if (maxPrice) {
            where.AND.push({ price: { lte: parseFloat(maxPrice) } });
        }
        if (rooms && rooms !== 'Tümü' && rooms !== '') {
            // DB-Level Room Filtering
            const normalized = rooms.trim().replace(/\s/g, ''); // e.g. "2+1"

            // Special cases
            if (normalized === '4+') {
                where.AND.push({
                    OR: [
                        { rooms: { startsWith: '4' } },
                        { rooms: { startsWith: '5' } },
                        { rooms: { startsWith: '6' } },
                        { rooms: { startsWith: '7' } },
                        { rooms: { startsWith: '8' } },
                        { rooms: { startsWith: '9' } },
                        { rooms: { startsWith: '10' } }
                    ]
                });
            } else if (normalized === '5+') {
                where.AND.push({
                    OR: [
                        { rooms: { startsWith: '5' } },
                        { rooms: { startsWith: '6' } },
                        { rooms: { startsWith: '7' } },
                        { rooms: { startsWith: '8' } },
                        { rooms: { startsWith: '9' } },
                        { rooms: { startsWith: '10' } },
                        { rooms: { startsWith: '11' } },
                        { rooms: { startsWith: '12' } }
                    ]
                });
            } else {
                // Standard Case: "2+1", "3+1", etc.
                // We use 'contains' to be safe against spaces like "2 + 1", or exact match if clean
                where.AND.push({
                    rooms: { startsWith: normalized } // Most reliable based on analysis
                });
            }
        }

        // console.log('Fetching properties...');
        const baseWhere = { ...where };
        if (!req.query.show_all && !isSpecificIdRequest) {
            where.AND.push({ is_primary: true });
        }

        console.log('DEBUG: Final Where Clause:', JSON.stringify(where, null, 2));

        // If opportunity_filter is used, we need to fetch ALL potentially matching properties
        // because scoring happens in JS, not in DB.
        // For a small-medium dataset (1000-5000), this is acceptable.

        let properties;
        let total;

        if (req.query.opportunity_filter) {
            // Fetch everything that matches the base filters
            properties = await prisma.property.findMany({
                where,
                orderBy: { created_at: 'desc' },
                include: { history: true }
            });
            // Total will be updated after in-memory filtering
        } else {
            total = await prisma.property.count({ where });
            properties = await prisma.property.findMany({
                where,
                orderBy: { created_at: 'desc' },
                include: { history: true },
                skip: skip,
                take: limit
            });
        }

        // Upgrade images on the fly
        const propertiesWithHighResImages = properties.map(p => ({
            ...p,
            images: upgradeImages(p.images)
        }));

        // JS Room Filtering Removed - Now handled in DB
        let filteredProperties = propertiesWithHighResImages;

        // EMERGENCY SAFETY NET:
        // Ensure that if specific IDs were requested, result ONLY contains those IDs.
        // This protects against any logic errors in the SQL construction or fallback defaults.
        if (isSpecificIdRequest && req.query.ids) {
            const requestedIds = req.query.ids.split(',').map(Number);
            const beforeCount = filteredProperties.length;
            filteredProperties = filteredProperties.filter(p => requestedIds.includes(p.id));
            console.log(`DEBUG: Safety Net. Requested: ${requestedIds.length}, Fetched: ${beforeCount}, Filtered: ${filteredProperties.length}`);
        }

        // Calculate Opportunity Scores
        let propertiesWithScore = filteredProperties;
        try {
            const { getNeighborhoodStatsMap, scoreProperty } = require('../services/analyticsService');

            // console.log('DEBUG: Calculating Neighborhood Stats...');
            const statsMap = await getNeighborhoodStatsMap();

            propertiesWithScore = filteredProperties.map(p => {
                try {
                    const analysis = scoreProperty(p, statsMap, p.history);
                    return {
                        ...p,
                        opportunity_score: analysis.score,
                        opportunity_label: analysis.label,
                        deviation: analysis.deviation,
                        roi: analysis.roi,
                        comparison_basis: analysis.comparisonBasis, // Exposed to frontend
                        comparison_price: analysis.comparisonPrice,
                        has_recent_price_drop: analysis.hasRecentPriceDrop
                    };
                } catch (innerErr) {
                    return p; // Return property without score if failed
                }
            });

            // Post-Scoring Filter (Opportunity Filter)
            if (req.query.opportunity_filter) {
                const filter = req.query.opportunity_filter;
                propertiesWithScore = propertiesWithScore.filter(p => {
                    if (filter === 'price_drop') return p.has_recent_price_drop;
                    if (filter === 'opportunity') return p.opportunity_label && (p.opportunity_label.includes('Fırsat') || p.opportunity_label.includes('Kelepir'));
                    if (filter === 'bargain') return p.opportunity_label && p.opportunity_label.includes('Kelepir');
                    return true;
                });

                // Update total for pagination
                total = propertiesWithScore.length;

                // Manual Paginate
                propertiesWithScore = propertiesWithScore.slice(skip, skip + limit);
            }

            // Universal Sorting
            if (sort === 'score') {
                propertiesWithScore.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
            } else if (sort === 'price_asc') {
                propertiesWithScore.sort((a, b) => Number(a.price) - Number(b.price));
            } else if (sort === 'price_desc') {
                propertiesWithScore.sort((a, b) => Number(b.price) - Number(a.price));
            } else if (sort === 'deviation') {
                propertiesWithScore.sort((a, b) => (b.deviation || 0) - (a.deviation || 0));
            } else if (sort === 'newest' || sort === 'date_desc') {
                propertiesWithScore.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } else if (sort === 'date_asc') {
                propertiesWithScore.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            } else if (sort === 'location_asc') {
                propertiesWithScore.sort((a, b) => {
                    const distA = a.district || '';
                    const distB = b.district || '';
                    const distCompare = distA.localeCompare(distB, 'tr');
                    if (distCompare !== 0) return distCompare;

                    const neighA = a.neighborhood || '';
                    const neighB = b.neighborhood || '';
                    return neighA.localeCompare(neighB, 'tr');
                });
            } else if (sort === 'location_desc') {
                propertiesWithScore.sort((a, b) => {
                    const distA = a.district || '';
                    const distB = b.district || '';
                    const distCompare = distB.localeCompare(distA, 'tr');
                    if (distCompare !== 0) return distCompare;

                    const neighA = a.neighborhood || '';
                    const neighB = b.neighborhood || '';
                    return neighB.localeCompare(neighA, 'tr');
                });
            } else if (req.query.opportunity_filter) {
                // Default sorting for opportunity filter if no explicit sort
                propertiesWithScore.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
            }
        } catch (analyticsErr) {
            console.error('DEBUG: Analytics Service Failed:', analyticsErr.message);
            // Continue without sorting if analytics fails, or better, return error to debug
            return res.status(500).json({ error: 'Analytics Error: ' + analyticsErr.message });
        }

        // Use safe serializer for potential BigInts in Data or Meta
        try {
            jsonBigInt(res, {
                data: propertiesWithScore,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(Number(total) / limit),
                    server_version: 'patched_safe_net_v1', // Verify server update
                    debug_ids: req.query.ids || 'none'
                }
            });
        } catch (jsonErr) {
            console.error('CRITICAL: JSON Serialization Failed:', jsonErr);
            res.status(500).json({ error: 'JSON Serialization Error: ' + jsonErr.message });
        }

    } catch (error) {
        console.error('CRITICAL SERVER ERROR:', error);
        res.status(500).json({
            error: 'Server Error: ' + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const getPropertyHistory = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await prisma.propertyHistory.findMany({
            where: { property_id: parseInt(id) },
            orderBy: { changed_at: 'asc' }
        });
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const { scrapeDetails } = require('../services/scraperService');



const scrapePropertyDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await prisma.property.findUnique({ where: { id: parseInt(id) } });

        if (!property) return res.status(404).json({ error: 'Property not found' });

        const details = await scrapeDetails(property.url);

        const updated = await prisma.property.update({
            where: { id: property.id },
            data: {
                description: details.description,
                images: details.images,
                features: details.features,
                ...(details.size_m2 > 0 && { size_m2: details.size_m2 }),
                ...(details.rooms && { rooms: details.rooms }),
                ...(details.district && { district: details.district }),
                ...(details.district && { district: details.district }),
                ...(details.neighborhood && { neighborhood: details.neighborhood }),
                ...(details.seller_name && { seller_name: details.seller_name }),
                ...(details.seller_phone && { seller_phone: details.seller_phone }),
                building_age: details.building_age || property.building_age,
                heating_type: details.heating_type || property.heating_type,
                floor_location: details.floor_location || property.floor_location
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Scrape Details Error:', error);

        if (error.code === 'LISTING_REMOVED' || error.message.includes('ListingRemoved')) {
            await prisma.property.update({
                where: { id: parseInt(id) },
                data: { status: 'removed' }
            });
            return res.json({ message: 'İlan yayından kalkmış olarak tespit edildi ve güncellendi.', status: 'removed' });
        }

        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(__dirname, '..', 'crash_log.txt');
            fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] Error in scrapePropertyDetails: ${error.message}\nStack: ${error.stack}\n`);
        } catch (fError) { }
        res.status(500).json({ error: 'Failed to scrape details: ' + error.message });
    }
};

const assignProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const { consultant_id } = req.body; // use consultant_id to match client model naming convention if preferred, but schema uses assigned_user_id

        const updated = await prisma.property.update({
            where: { id: parseInt(id) },
            data: {
                assigned_user_id: consultant_id ? parseInt(consultant_id) : null
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Assign Property Error:', error);
        res.status(500).json({ error: 'Failed to assign property' });
    }
};

module.exports = { getProperties, getPropertyHistory, getPropertyById, scrapePropertyDetails, assignProperty };
