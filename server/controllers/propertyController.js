const prisma = require('../db');
const { jsonBigInt } = require('../utils/responseHelper');
const analyticsService = require('../services/analyticsService');
const CacheService = require('../services/cacheService');

// Helper to upgrade image quality on the fly
const upgradeImages = (images) => {
    if (!images || !Array.isArray(images)) return [];
    return images.map(src => {
        if (typeof src !== 'string' || src.startsWith('data:image/gif')) return null;
        if ((src.includes('hemlak.com') || src.includes('hecdn.com')) && src.includes('/mnresize/')) {
            return src.replace(/\/mnresize\/\d+\/\d+\//, '/');
        }
        return src;
    }).filter(Boolean);
};

const buildFilterWhereClause = (query) => {
    const {
        minPrice, maxPrice, minSize, maxSize, rooms, district, neighborhood,
        category, listingType, seller_type, source,
        status, building_age, heating_type, floor_location, search,
        portfolio, assigned_user_id, ids, show_all, radar_category, opportunity_filter
    } = query;

    const where = { AND: [] };

    if (search) {
        where.AND.push({
            OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { external_id: { contains: search, mode: 'insensitive' } },
                { neighborhood: { contains: search, mode: 'insensitive' } },
                { district: { contains: search, mode: 'insensitive' } }
            ]
        });
    }

    const isIdRequest = ids !== undefined && ids !== null && ids !== '';
    if (isIdRequest) {
        const idList = String(ids).split(',').map(id => parseInt(id)).filter(n => !isNaN(n));
        if (idList.length > 0) where.AND.push({ id: { in: idList } });
        else where.AND.push({ id: -1 });
    }

    if (status && status !== 'all') where.AND.push({ status: status });
    else if (!show_all && !isIdRequest) where.AND.push({ status: 'active' });

    if (category && category !== 'all') {
        const catLower = category.toLowerCase();
        if (catLower === 'daire') where.AND.push({ category: { in: ['daire', 'residential', 'Daire'] } });
        else where.AND.push({ category: category });
    }

    if (listingType && listingType !== 'all') where.AND.push({ listing_type: listingType });
    if (seller_type && seller_type !== 'all') where.AND.push({ seller_type: seller_type });

    if (source && source !== 'all') {
        if (source === 'sahibinden') where.AND.push({ url: { contains: 'sahibinden.com' } });
        else if (source === 'hepsiemlak' || source === 'hemlak') {
            where.AND.push({ OR: [{ url: { contains: 'hemlak.com' } }, { url: { contains: 'hepsiemlak.com' } }] });
        }
        else if (source === 'emlakjet') where.AND.push({ url: { contains: 'emlakjet.com' } });
    }

    if (portfolio === 'agency') {
        where.AND.push({
            OR: [
                { seller_type: 'office' },
                { seller_name: { contains: 'Trio', mode: 'insensitive' } },
                { assigned_user_id: { not: null } }
            ]
        });
    } else if (assigned_user_id && assigned_user_id !== 'undefined' && assigned_user_id !== 'null') {
        const uid = parseInt(assigned_user_id);
        if (!isNaN(uid)) where.AND.push({ assigned_user_id: uid });
    }

    if (minPrice) where.AND.push({ price: { gte: parseFloat(minPrice) } });
    if (maxPrice) where.AND.push({ price: { lte: parseFloat(maxPrice) } });
    if (minSize) where.AND.push({ size_m2: { gte: parseInt(minSize) } });
    if (maxSize) where.AND.push({ size_m2: { lte: parseInt(maxSize) } });

    if (district && district !== 'all' && district !== '') where.AND.push({ district: { contains: district, mode: 'insensitive' } });
    if (neighborhood && neighborhood !== 'all' && neighborhood !== '') where.AND.push({ neighborhood: { contains: neighborhood, mode: 'insensitive' } });
    if (building_age && building_age !== '' && building_age !== 'all') where.AND.push({ building_age: { contains: building_age, mode: 'insensitive' } });
    if (heating_type && heating_type !== '' && heating_type !== 'all') where.AND.push({ heating_type: { contains: heating_type, mode: 'insensitive' } });
    if (floor_location && floor_location !== '' && floor_location !== 'all') where.AND.push({ floor_location: { contains: floor_location, mode: 'insensitive' } });

    if (rooms && rooms !== 'Tümü' && rooms !== '') {
        const roomList = Array.isArray(rooms) ? rooms : String(rooms).split(',').filter(Boolean);
        if (roomList.length > 0) {
            const roomFilters = roomList.map(r => {
                const normalized = r.trim().replace(/\s/g, '');
                if (normalized === '4+') return { OR: [{ rooms: { startsWith: '4' } }, { rooms: { startsWith: '5' } }, { rooms: { startsWith: '6' } }, { rooms: { startsWith: '7' } }] };
                if (normalized === '5+') return { OR: [{ rooms: { startsWith: '5' } }, { rooms: { startsWith: '6' } }, { rooms: { startsWith: '7' } }, { rooms: { startsWith: '8' } }] };
                return { rooms: { startsWith: normalized } };
            });
            where.AND.push({ OR: roomFilters });
        }
    }

    // Fırsat Radarı Categories logic
    if (radar_category && radar_category !== 'all') {
        const rc = radar_category.toLowerCase();
        if (rc === 'daire' || rc === 'residence') {
            where.AND.push({ category: { in: ['daire', 'residential', 'Daire'] } });
        } else if (rc === 'villa' || rc === 'müstakil') {
            where.AND.push({
                OR: [
                    { category: { in: ['villa', 'mustakil', 'yaka', 'müstakil'] } },
                    { title: { contains: 'villa', mode: 'insensitive' } },
                    { title: { contains: 'müstakil', mode: 'insensitive' } },
                    { title: { contains: 'yazlık', mode: 'insensitive' } },
                    { description: { contains: 'villa', mode: 'insensitive' } }
                ]
            });
        } else if (rc === 'arsa' || rc === 'land' || rc === 'zeytinlik' || rc === 'tarla') {
            where.AND.push({
                OR: [
                    { category: { in: ['land', 'Arsa', 'arsa', 'tarla', 'zeytinlik', 'bahçe', 'Tarla', 'Zeytinlik'] } },
                    { title: { contains: 'arsa', mode: 'insensitive' } },
                    { title: { contains: 'tarla', mode: 'insensitive' } },
                    { title: { contains: 'zeytin', mode: 'insensitive' } },
                    { title: { contains: 'arazi', mode: 'insensitive' } }
                ]
            });
        } else if (rc === 'commercial' || rc === 'işyeri' || rc === 'tourism') {
            where.AND.push({
                OR: [
                    { category: { in: ['commercial', 'İşyeri', 'dükkan', 'tourism', 'Ticari', 'Turistik'] } },
                    { title: { contains: 'dükkan', mode: 'insensitive' } },
                    { title: { contains: 'mağaza', mode: 'insensitive' } },
                    { title: { contains: 'ofis', mode: 'insensitive' } },
                    { title: { contains: 'otel', mode: 'insensitive' } }
                ]
            });
        }
    }

    if (!show_all && !isIdRequest && !radar_category && !opportunity_filter) where.AND.push({ is_primary: true });
    return where;
};

const getProperties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const { sort, opportunity_filter, radar_category } = req.query;

        const where = buildFilterWhereClause(req.query);
        console.log(`[API] Fetching properties: where=${JSON.stringify(where)}`);
        let properties;
        let total;
        let processed = [];
        let statsMapTask = analyticsService.getNeighborhoodStatsMap();

        // Optional Debug: console.log(`[API] Fetching properties: where=${JSON.stringify(where)}, filter=${opportunity_filter}`);

        if (opportunity_filter) {
            console.log(`[RADAR] Incoming request - filter: ${opportunity_filter}, category: ${radar_category}`);

            // PASS 1: Lightweight fetch for filtering and scoring
            const [rawProps, statsMap] = await Promise.all([
                prisma.property.findMany({
                    where,
                    select: {
                        id: true, price: true, district: true, neighborhood: true,
                        created_at: true, url: true, external_id: true, group_id: true,
                        history: {
                            select: { price: true, changed_at: true },
                            orderBy: { changed_at: 'desc' },
                            take: 2
                        }
                    }
                }),
                analyticsService.getNeighborhoodStatsMap()
            ]);

            console.log(`[RADAR] Found ${rawProps.length} active properties in DB matching "where".`);

            processed = rawProps.filter(p => {
                try {
                    const history = p.history || [];
                    const sortedHistory = [...history].reverse();
                    const analysis = analyticsService.scoreProperty(p, statsMap, sortedHistory);

                    // Attach transient analysis for filtering/sorting
                    p._analysis = analysis;

                    const label = (analysis.label || '').toLocaleUpperCase('tr-TR');
                    // Robust check: includes case-insensitive keywords and Turkish-aware matching
                    const isFirsat = /FIRSAT|KELEP[Iİ]|f\u0131rsat/i.test(label);
                    const isHighScoring = Number(analysis.score) >= 60;

                    if (opportunity_filter === 'price_drop') return analysis.hasRecentPriceDrop;
                    if (opportunity_filter === 'opportunity') return isFirsat || isHighScoring;
                    if (opportunity_filter === 'bargain') return /KELEP[Iİ]/i.test(label);

                    return true;
                } catch (err) {
                    console.error(`[RADAR] Error scoring property ${p.id}:`, err.message);
                    return false;
                }
            });

            // Deduplicate by group_id (preferring high score)
            const seenGroups = new Map();
            const deduplicated = [];

            for (const p of processed) {
                if (!p.group_id) {
                    deduplicated.push(p);
                    continue;
                }
                const existing = seenGroups.get(p.group_id);
                if (!existing || (p._analysis.score > existing._analysis.score)) {
                    seenGroups.set(p.group_id, p);
                }
            }

            // Re-collect deduplicated items
            processed = [...new Set([...deduplicated, ...seenGroups.values()])];

            total = processed.length;
            console.log(`[RADAR] Final count of opportunities after filtering and deduplication: ${total}`);

            // Initial Sort
            if (!sort) processed.sort((a, b) => (b._analysis.score || 0) - (a._analysis.score || 0));
            else applySort(processed, sort); // applySort needs to handle _analysis

            // Paginate
            const slice = processed.slice(skip, skip + limit);
            const sliceIds = slice.map(p => p.id);

            // PASS 2: Detailed fetch for active slice only
            const detailedProperties = await prisma.property.findMany({
                where: { id: { in: sliceIds } },
                include: { history: { orderBy: { changed_at: 'asc' } } }
            });

            // Re-map analysis back to detailed objects
            const idMap = new Map(slice.map(p => [p.id, p._analysis]));
            processed = detailedProperties.map(p => {
                const analysis = idMap.get(p.id) || {};
                return {
                    ...p,
                    images: upgradeImages(p.images),
                    opportunity_score: analysis.score,
                    opportunity_label: analysis.label,
                    deviation: analysis.deviation,
                    roi: analysis.roi,
                    comparison_basis: analysis.comparisonBasis,
                    comparison_price: analysis.comparisonPrice,
                    has_recent_price_drop: analysis.hasRecentPriceDrop
                };
            });

            // Re-apply sort to detailed results to maintain sequence
            if (!sort) processed.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
            else applySort(processed, sort);

        } else {
            // Standard path
            [total, properties] = await Promise.all([
                prisma.property.count({ where }),
                prisma.property.findMany({ where, orderBy: { created_at: 'desc' }, include: { history: { orderBy: { changed_at: 'asc' } } }, skip, take: limit })
            ]);

            const statsMap = await statsMapTask;
            processed = properties.map(p => {
                try {
                    const analysis = analyticsService.scoreProperty(p, statsMap, p.history);
                    return { ...p, images: upgradeImages(p.images), opportunity_score: analysis.score, opportunity_label: analysis.label, deviation: analysis.deviation, roi: analysis.roi, comparison_basis: analysis.comparisonBasis, comparison_price: analysis.comparisonPrice, has_recent_price_drop: analysis.hasRecentPriceDrop };
                } catch (err) {
                    return { ...p, images: upgradeImages(p.images) };
                }
            });

            if (sort) applySort(processed, sort);
        }

        const serialized = processed.map(p => ({ ...p, price: Number(p.price), size_m2: p.size_m2 ? Number(p.size_m2) : null }));
        jsonBigInt(res, { data: serialized, meta: { page, limit, total: Number(total || 0), totalPages: Math.ceil(Number(total || 0) / limit) } });
    } catch (error) {
        console.error('Get Properties Error:', error);
        jsonBigInt(res, { error: 'Backend Error', details: error.message }, 500);
    }
};

const applySort = (list, sort) => {
    if (sort === 'score') list.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
    else if (sort === 'price_asc') list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === 'price_desc') list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === 'newest') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sort === 'date_asc') list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
};

const getPortfolioStats = async (req, res) => {
    try {
        const { opportunity_filter } = req.query;
        const where = buildFilterWhereClause(req.query);

        let totalListings = 0;
        let totalValue = 0;
        let avgPrice = 0;
        let sahibindenCount = 0;
        let hepsiemlakCount = 0;
        let sample = [];

        if (opportunity_filter) {
            // Memory intensive path for scored filters - optimized to fetch only necessary fields
            const [properties, statsMap] = await Promise.all([
                prisma.property.findMany({
                    where,
                    select: {
                        id: true, price: true, district: true, neighborhood: true,
                        created_at: true, url: true, external_id: true,
                        history: {
                            select: { price: true, changed_at: true },
                            orderBy: { changed_at: 'desc' },
                            take: 2
                        }
                    }
                }),
                analyticsService.getNeighborhoodStatsMap()
            ]);

            const filtered = properties.filter(p => {
                const sortedHistory = [...p.history].reverse();
                const analysis = analyticsService.scoreProperty(p, statsMap, sortedHistory);
                const label = (analysis.label || '').toUpperCase();

                if (opportunity_filter === 'price_drop') return analysis.hasRecentPriceDrop;
                if (opportunity_filter === 'opportunity') return label.includes('FIRSAT') || label.includes('KELEPİR');
                if (opportunity_filter === 'bargain') return label.includes('KELEPİR');
                return true;
            });

            totalListings = filtered.length;
            totalValue = filtered.reduce((acc, p) => acc + Number(p.price || 0), 0);
            avgPrice = totalListings > 0 ? totalValue / totalListings : 0;

            filtered.forEach(p => {
                const url = (p.url || '').toLowerCase();
                if (url.includes('sahibinden.com')) sahibindenCount++;
                else if (url.includes('hemlak.com') || url.includes('hepsiemlak.com')) hepsiemlakCount++;
            });

            sample = filtered.slice(0, 200);
        } else {
            // Optimized DB path for standard filters
            const [agg, sah, hep] = await Promise.all([
                prisma.property.aggregate({
                    where,
                    _count: { _all: true },
                    _sum: { price: true },
                    _avg: { price: true }
                }),
                prisma.property.count({ where: { AND: [...(where.AND || []), { url: { contains: 'sahibinden.com' } }] } }),
                prisma.property.count({ where: { AND: [...(where.AND || []), { OR: [{ url: { contains: 'hemlak.com' } }, { url: { contains: 'hepsiemlak.com' } }] }] } })
            ]);

            totalListings = Number(agg?._count?._all || 0);
            totalValue = Number(agg?._sum?.price || 0);
            avgPrice = Number(agg?._avg?.price || 0);
            sahibindenCount = Number(sah || 0);
            hepsiemlakCount = Number(hep || 0);

            sample = await prisma.property.findMany({ where, select: { created_at: true }, take: 200 });
        }

        const now = new Date();
        const totalDays = sample.reduce((acc, p) => acc + Math.ceil(Math.abs(now - new Date(p.created_at)) / (1000 * 60 * 60 * 24)), 0);

        const responseData = {
            totalListings,
            totalValue,
            avgPrice,
            avgDays: sample.length > 0 ? Math.round(totalDays / sample.length) : 0,
            sahibindenCount,
            hepsiemlakCount,
            _v: '1.35'
        };

        console.log('[API] Stats Result delivered:', responseData.totalListings);
        jsonBigInt(res, responseData);
    } catch (error) {
        console.error('[CRITICAL] Stats Aggregation Failed:', error);
        jsonBigInt(res, { error: 'Stats processing error', details: error.message, v: '1.35' }, 500);
    }
};

const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const property = await prisma.property.findUnique({ where: { id: parseInt(id) }, include: { history: { orderBy: { changed_at: 'asc' } } } });
        if (!property) return res.status(404).json({ error: 'Property not found' });

        const upgraded = { ...property, price: Number(property.price), size_m2: property.size_m2 ? Number(property.size_m2) : null, images: upgradeImages(property.images) };

        if (property.group_id) {
            const rawOthers = await prisma.property.findMany({ where: { group_id: property.group_id, id: { not: parseInt(id) } }, select: { id: true, url: true, price: true, external_id: true, listing_date: true } });
            const domainMap = new Map();
            rawOthers.forEach(l => {
                let d = l.url.includes('sahibinden') ? 's' : (l.url.includes('hemlak') || l.url.includes('hepsiemlak') ? 'h' : 'o');
                if (!domainMap.has(d) || new Date(l.listing_date) > new Date(domainMap.get(d).listing_date)) domainMap.set(d, l);
            });
            const others = Array.from(domainMap.values()).map(l => ({ ...l, price: Number(l.price) }));
            upgraded.other_listings = others;
            upgraded.merged_history = await prisma.propertyHistory.findMany({ where: { property_id: { in: [property.id, ...others.map(o => o.id)] } }, orderBy: { changed_at: 'asc' } });
        } else {
            upgraded.merged_history = property.history;
            upgraded.other_listings = [];
        }

        jsonBigInt(res, upgraded);
    } catch (error) {
        console.error('Get Property Detail Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPropertyHistory = async (req, res) => {
    try {
        const result = await prisma.propertyHistory.findMany({ where: { property_id: parseInt(req.params.id) }, orderBy: { changed_at: 'asc' } });
        res.json(result.map(r => ({ ...r, price: Number(r.price) })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const { scrapeDetails } = require('../services/scraperService');

const scrapePropertyDetails = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const prop = await prisma.property.findUnique({ where: { id } });
        if (!prop) return res.status(404).json({ error: 'Not found' });

        const details = await scrapeDetails(prop.url);
        const updated = await prisma.property.update({
            where: { id },
            data: {
                description: details.description,
                images: details.images,
                features: details.features,
                ...(details.size_m2 > 0 && { size_m2: details.size_m2 }),
                ...(details.rooms && { rooms: details.rooms }),
                ...(details.district && { district: details.district }),
                ...(details.neighborhood && { neighborhood: details.neighborhood }),
                ...(details.seller_name && { seller_name: details.seller_name }),
                ...(details.seller_phone && { seller_phone: details.seller_phone }),
                building_age: details.building_age || prop.building_age,
                heating_type: details.heating_type || prop.heating_type,
                floor_location: details.floor_location || prop.floor_location
            }
        });
        res.json(updated);
    } catch (error) {
        if (error.message.includes('ListingRemoved')) {
            await prisma.property.update({ where: { id: parseInt(req.params.id) }, data: { status: 'removed' } });
            return res.json({ message: 'Removed', status: 'removed' });
        }
        res.status(500).json({ error: error.message });
    }
};

const assignProperty = async (req, res) => {
    try {
        const updated = await prisma.property.update({ where: { id: parseInt(req.params.id) }, data: { assigned_user_id: req.body.consultant_id ? parseInt(req.body.consultant_id) : null } });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateProperty = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const prop = await prisma.property.findUnique({ where: { id } });
        if (!prop) return res.status(404).json({ error: 'Not found' });
        if (req.user.role !== 'admin' && prop.assigned_user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        const { auth_doc_url, auth_start_date, auth_end_date, status } = req.body;
        const updated = await prisma.property.update({
            where: { id },
            data: { auth_doc_url, auth_start_date: auth_start_date ? new Date(auth_start_date) : null, auth_end_date: auth_end_date ? new Date(auth_end_date) : null, status }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const syncPortfolio = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        const { syncPortfolio: runSync } = require('../services/scraperService');
        const sessionManager = require('../services/sessionManager').getSessionManager();
        sessionManager.addEvent('Sync started', 'info');
        runSync().catch(err => sessionManager.addEvent(`Sync Error: ${err.message}`, 'error'));
        res.json({ success: true, message: 'Sync started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getFilterMetadata = async (req, res) => {
    try {
        const cacheKey = 'properties_filter_metadata';
        const cached = CacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const where = { status: 'active' };
        const [categories, rooms, districts] = await Promise.all([
            prisma.property.groupBy({ by: ['category'], where, _count: { _all: true } }),
            prisma.property.groupBy({ by: ['rooms'], where, _count: { _all: true } }),
            prisma.property.groupBy({ by: ['district'], where, _count: { _all: true }, orderBy: { _count: { district: 'desc' } }, take: 50 })
        ]);

        const result = {
            categories: categories.map(c => ({ label: c.category, count: c._count._all })),
            rooms: rooms.map(r => ({ label: r.rooms, count: r._count._all })),
            districts: districts.map(d => ({ label: d.district, count: d._count._all }))
        };

        CacheService.set(cacheKey, result, 60 * 60); // 1 hour cache
        res.json(result);
    } catch (error) {
        console.error('Get Filter Metadata Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPropertyTwins = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await prisma.property.findUnique({
            where: { id: parseInt(id) }
        });

        if (!property) return res.status(404).json({ error: 'Property not found' });

        // Criteria for "Twins"
        // 1. Same district and neighborhood (Mahalle bazlı analiz)
        // 2. Same category (Daire, Villa, etc.)
        // 3. Same rooms (Oda sayısı)
        // 4. Size within +/- 30% range
        const size = Number(property.size_m2);
        const minSize = size * 0.7;
        const maxSize = size * 1.3;

        const twins = await prisma.property.findMany({
            where: {
                id: { not: parseInt(id) },
                status: 'active',
                neighborhood: property.neighborhood,
                district: property.district,
                category: property.category,
                rooms: property.rooms,
                size_m2: { gte: minSize, lte: maxSize }
            },
            select: {
                id: true,
                title: true,
                price: true,
                size_m2: true,
                rooms: true,
                url: true,
                created_at: true,
                images: true
            },
            take: 10,
            orderBy: { created_at: 'desc' }
        });

        // Statistics
        const targetPricePerM2 = size > 0 ? Number(property.price) / size : 0;

        let avgPricePerM2 = 0;
        if (twins.length > 0) {
            const sumPricePerM2 = twins.reduce((acc, t) => acc + (Number(t.price) / Number(t.size_m2)), 0);
            avgPricePerM2 = sumPricePerM2 / twins.length;
        }

        const deviation = avgPricePerM2 > 0 ? ((targetPricePerM2 - avgPricePerM2) / avgPricePerM2) * 100 : 0;

        res.json({
            target: {
                id: property.id,
                price: Number(property.price),
                size_m2: size,
                price_per_m2: targetPricePerM2
            },
            market: {
                avg_price_per_m2: avgPricePerM2,
                deviation: Math.round(deviation * 100) / 100, // round to 2 decimals
                sample_size: twins.length
            },
            twins: twins.map(t => ({
                ...t,
                price: Number(t.price),
                size_m2: Number(t.size_m2),
                price_per_m2: Number(t.price) / Number(t.size_m2),
                images: upgradeImages(t.images).slice(0, 1) // Only first image for preview
            }))
        });
    } catch (error) {
        console.error('Get Property Twins Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const generateSocialMediaContent = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await prisma.property.findUnique({ where: { id: parseInt(id) } });
        if (!property) return res.status(404).json({ error: 'Property not found' });

        const GroqService = require('../services/GroqService');
        const content = await GroqService.generateSocialMediaContent(property);
        res.json({ content });
    } catch (error) {
        console.error('Social Media Content Error:', error);
        res.status(500).json({ error: 'İçerik oluşturulurken hata: ' + error.message });
    }
};

module.exports = { getProperties, getPortfolioStats, getPropertyHistory, getPropertyById, scrapePropertyDetails, assignProperty, updateProperty, syncPortfolio, getFilterMetadata, getPropertyTwins, generateSocialMediaContent };
