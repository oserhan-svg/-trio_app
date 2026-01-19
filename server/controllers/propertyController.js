const prisma = require('../db');
const { jsonBigInt } = require('../utils/responseHelper');

// Helper to upgrade image quality on the fly
const upgradeImages = (images) => {
    if (!images || !Array.isArray(images)) return [];
    return images.map(src => {
        // Hepsiemlak: Remove /mnresize/width/height/
        if (src.includes('hemlak.com') && src.includes('/mnresize/')) {
            return src.replace(/\/mnresize\/\d+\/\d+\//, '/');
        }
        return src;
    });
};

const getProperties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const { minPrice, maxPrice, rooms, district, opportunity_filter, category, listingType, seller_type, sort } = req.query;

        const where = { AND: [] };

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
        const total = await prisma.property.count({ where });
        const properties = await prisma.property.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: { history: true },
            skip: skip,
            take: limit
        });

        // Upgrade images on the fly
        const propertiesWithHighResImages = properties.map(p => ({
            ...p,
            images: upgradeImages(p.images)
        }));

        // JS Room Filtering Removed - Now handled in DB
        let filteredProperties = propertiesWithHighResImages;

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

                // Auto-Sort: Best Opportunities First
                // Criteria: Score (Desc) -> Deviation (Desc) -> Price (Asc)
            }

            // Universal Sorting
            if (sort === 'score') {
                propertiesWithScore.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
            } else if (sort === 'price_asc') {
                propertiesWithScore.sort((a, b) => a.price - b.price);
            } else if (sort === 'price_desc') {
                propertiesWithScore.sort((a, b) => b.price - a.price);
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
        }

        // Use safe serializer for potential BigInts in Data or Meta
        jsonBigInt(res, {
            data: propertiesWithScore,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(Number(total) / limit)
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
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

        res.json(upgradedProperty);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch property details' });
    }
};

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
