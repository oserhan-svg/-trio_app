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
        const { minPrice, maxPrice, rooms, district, opportunity_filter } = req.query;
        // console.log('Incoming params:', req.query); // Reduced log spam

        const where = { AND: [] };

        if (minPrice) {
            where.AND.push({ price: { gte: parseFloat(minPrice) } });
        }
        if (maxPrice) {
            where.AND.push({ price: { lte: parseFloat(maxPrice) } });
        }
        // Room filtering is now handled in JS post-fetch for better accuracy with non-standard formats

        if (district) {
            where.AND.push({
                OR: [
                    { district: { contains: district, mode: 'insensitive' } },
                    { neighborhood: { contains: district, mode: 'insensitive' } },
                    { title: { contains: district, mode: 'insensitive' } }
                ]
            });
        }

        if (req.query.source) {
            where.AND.push({
                url: { contains: req.query.source, mode: 'insensitive' }
            });
        }

        if (req.query.seller_type && req.query.seller_type !== 'all') {
            if (req.query.seller_type === 'owner') {
                where.AND.push({ seller_type: 'owner' });
            } else {
                where.AND.push({ seller_type: { not: 'owner' } });
            }
        }

        // console.log('Fetching properties...');
        const properties = await prisma.property.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: { history: true } // Fetch history for price drop analysis
        });

        // Upgrade images on the fly
        const propertiesWithHighResImages = properties.map(p => ({
            ...p,
            images: upgradeImages(p.images)
        }));

        // Secondary JS filter for rooms to ensure absolute accuracy with non-standard strings
        // ... (room filtering code skipped for brevity, keeps existing logic) ...

        // Wait, I need to keep the room filtering logic here, but I can't just skip lines in replacement tool.
        // It's safer to just modify the findMany call and the mapping loop separately if they were far apart, 
        // but here I'm replacing a block.
        // Let's rewrite the block carefully.

        // Secondary JS filter for rooms
        let filteredProperties = propertiesWithHighResImages;
        if (rooms && rooms !== 'Tümü' && rooms !== '') {
            const normalizedFilter = rooms.trim().replace(/\s/g, '+');
            filteredProperties = propertiesWithHighResImages.filter(p => {
                // ... reusing existing logic ...
                const rawRoom = (p.rooms || '').trim();
                const roomStr = rawRoom.replace(/\s/g, '');
                const match = roomStr.match(/^(\d+)/);
                if (!match && !roomStr.toLowerCase().includes('stüdyo')) return false;
                const propertyRooms = match ? parseInt(match[1]) : (roomStr.toLowerCase().includes('stüdyo') ? 1 : 0);

                if (normalizedFilter === '5+') return propertyRooms >= 5;
                else if (normalizedFilter === '4+') return propertyRooms === 4;
                else {
                    const filterTarget = parseInt(normalizedFilter.split('+')[0]);
                    return propertyRooms === filterTarget;
                }
            });
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
                        roi: analysis.roi,
                        comparison_basis: analysis.comparisonBasis, // Exposed to frontend
                        comparison_price: analysis.comparisonPrice,
                        has_recent_price_drop: analysis.hasRecentPriceDrop
                    };
                } catch (innerErr) {
                    return p; // Return property without score if failed
                }
            });

            // Post-Scoring Filter
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
                propertiesWithScore.sort((a, b) => {
                    if ((b.opportunity_score || 0) !== (a.opportunity_score || 0)) {
                        return (b.opportunity_score || 0) - (a.opportunity_score || 0); // Higher score first
                    }
                    if ((b.deviation || 0) !== (a.deviation || 0)) {
                        return (b.deviation || 0) - (a.deviation || 0); // Higher deviation first
                    }
                    return a.price - b.price; // Cheaper first
                });
            }
        } catch (analyticsErr) {
            console.error('DEBUG: Analytics Service Failed:', analyticsErr.message);
        }

        try {
            jsonBigInt(res, propertiesWithScore);
        } catch (jsonErr) {
            console.error('CRITICAL: JSON Serialization Failed:', jsonErr);
            res.status(500).json({ error: 'JSON Serialization Error: ' + jsonErr.message });
        }

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
                ...(details.seller_name && { seller_name: details.seller_name })
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Scrape Details Error:', error);
        res.status(500).json({ error: 'Failed to scrape details: ' + error.message });
    }
};

module.exports = { getProperties, getPropertyHistory, getPropertyById, scrapePropertyDetails };
