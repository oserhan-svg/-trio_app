const prisma = require('../db');
const { performance } = require('perf_hooks');

// In-memory property pool cache
let propertyPool = null;
let lastPoolFetch = 0;
const POOL_TTL = 10 * 60 * 1000; // 10 minutes

// Dedicated result cache for matches
const matchingCache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

/**
 * Fetches and caches the entire active property pool (selective fields)
 */
const getPropertyPool = async () => {
    const now = Date.now();
    if (propertyPool && (now - lastPoolFetch < POOL_TTL)) {
        return propertyPool;
    }

    const start = performance.now();
    propertyPool = await prisma.property.findMany({
        where: {
            status: { not: 'removed' }
        },
        select: {
            id: true,
            title: true,
            price: true,
            rooms: true,
            neighborhood: true,
            district: true,
            listing_type: true,
            size_m2: true,
            images: true, // Needed for quality scoring
            created_at: true
        }
    });
    lastPoolFetch = now;
    console.log(`[PROFILE] Property Pool Refreshed: ${(performance.now() - start).toFixed(2)}ms (${propertyPool.length} properties)`);
    return propertyPool;
};

/**
 * Calculates a match score (0-100) between a property and a demand criteria.
 */
/**
 * Calculate Jaccard Similarity between two sets of tokens.
 * @param {string[]} arr1 - Request keywords
 * @param {string[]} arr2 - Property keywords
 */
const calculateSemanticSimilarity = (arr1, arr2) => {
    if (!arr1 || !arr1.length || !arr2 || !arr2.length) return 0;

    // Set 2 for O(1) lookups
    const set2 = new Set(arr2);

    let matches = 0;
    for (const k of arr1) {
        const lowerK = k.toLocaleLowerCase('tr');
        if (set2.has(lowerK)) {
            matches++;
        } else {
            // Partial match fallback
            for (const p of set2) {
                if (p.includes(lowerK) || lowerK.includes(p)) {
                    matches++;
                    break;
                }
            }
        }
    }

    return (matches / arr1.length) * 100;
};

/**
 * Calculates a match score (0-100) between a property and a demand criteria.
 */
/**
 * Calculates a match score (0-100) between a property and a demand criteria.
 * OPTIMIZED VERSION: Strict Filtering + Dynamic Price Curve
 */
const calculateMatchScore = (property, demand, aiSummary = null) => {
    let score = 0;
    const reasons = [];

    // 0. STRICT FILTER: Listing Type (Sale vs Rent) - CRITICAL FIX
    // If demand has a listing_type, it MUST match the property's listing_type.
    // Default legacy demands to 'sale' if undefined.
    const demandType = demand.listing_type || 'sale';
    const propertyType = property.listing_type || 'sale';

    if (demandType.toLocaleLowerCase('tr') !== propertyType.toLocaleLowerCase('tr')) {
        return { score: 0, isViable: false, reasons: ['İlan Tipi Uyumsuz'] };
    }

    // 1. Price Score (Max 35 pts) - DYNAMIC CURVE
    const price = parseFloat(property.price);
    const min = demand.min_price ? parseFloat(demand.min_price) : 0;
    const max = demand.max_price ? parseFloat(demand.max_price) : Infinity;

    // Safety Guard: Avoid matching suspiciously low prices if no min is set (e.g. 20k rent vs 5M sale budget)
    // If max is > 1M, ignore anything below 10% of max unless min is explicit
    if (!demand.min_price && max > 1000000 && price < max * 0.10) {
        return { score: 0, isViable: false, reasons: ['Fiyat çok düşük (Hatalı eşleşme riski)'] };
    }

    // OPTIMIZED: Allow 5% buffer below min price
    const minBuffer = min * 0.95;

    if (price >= minBuffer && price <= max) {
        // Perfect range - Full score
        score += 35;
    } else if (price > max) {
        // Decaying score for over-budget
        const diffPercent = (price - max) / max;
        if (diffPercent <= 0.05) { score += 30; reasons.push('Bütçenin %5 üzerinde'); }
        else if (diffPercent <= 0.10) { score += 20; reasons.push('Bütçenin %10 üzerinde'); }
        else if (diffPercent <= 0.15) { score += 10; reasons.push('Bütçenin %15 üzerinde'); }
        else { reasons.push('Bütçe dışı'); }
    } else if (price < minBuffer) {
        // Under min budget (Rarely bad, but maybe looking for luxury)
        const diffPercent = (minBuffer - price) / minBuffer;
        if (diffPercent <= 0.20) score += 35; // 20% under is great (deal!)
        else score += 25; // Way under is still good usually
    }

    // 2. Neighborhood Score (Max 25 pts)
    if (!demand.neighborhood) {
        score += 25;
    } else {
        const targetNeighborhoods = demand.neighborhood.split(',').map(n => n.trim().toLocaleLowerCase('tr'));
        const propNeighborhood = (property.neighborhood || '').toLocaleLowerCase('tr');

        // Exact or Partial match
        const isMatch = targetNeighborhoods.some(target => propNeighborhood.includes(target));

        if (isMatch) score += 25;
        else {
            // Check district fallback
            if (demand.district && property.district &&
                property.district.toLocaleLowerCase('tr').includes(demand.district.toLocaleLowerCase('tr'))) {
                score += 5; // Partial credit for correct district
                reasons.push('Mahalle farklı, İlçe uyumlu');
            } else {
                reasons.push('Konum uyumsuz');
            }
        }
    }

    // 3. Rooms Score (Max 15 pts) - FUZZY MATCH
    if (!demand.rooms) {
        score += 15;
    } else if (demand.rooms === 'Villa') {
        // STRICT VILLA FILTER
        const isVillaProp =
            (property.category === 'villa' || property.category === 'müstakil') ||
            (property.rooms && property.rooms.toLocaleLowerCase('tr').includes('villa')) ||
            (property.title && /villa|müstakil|malikane|köşk|yal[ıi]/i.test(property.title.toLocaleLowerCase('tr')));

        if (isVillaProp) {
            score += 15;
            reasons.push('Villa/Müstakil Uyumu');
        } else {
            // Heavy penalty for non-villa properties if villa is demanded
            score -= 50;
            reasons.push('Daire/Konut Tipi Uyumsuz (Villa Talebi)');
        }
    } else {
        const cleanPropRooms = (property.rooms || '').replace(/\s/g, '');
        const cleanDemandRooms = demand.rooms.replace(/\s/g, '');

        if (cleanPropRooms === cleanDemandRooms) {
            score += 15;
        } else {
            // Logic: If looking for 3+1, 4+1 is acceptable (upgrade), 2+1 is penalty
            // Simple string check for now, can be improved with regex parsing
            const propBase = parseInt(cleanPropRooms.charAt(0));
            const demandBase = parseInt(cleanDemandRooms.charAt(0));

            if (!isNaN(propBase) && !isNaN(demandBase)) {
                if (propBase > demandBase) {
                    score += 10; // Upgrade is okay-ish
                    reasons.push('Daha fazla oda');
                } else if (propBase === demandBase - 1) {
                    score += 5; // 1 room missing might be convertible
                    reasons.push('1 eksik oda');
                } else {
                    reasons.push('Oda sayısı yetersiz');
                }
            } else {
                if (property.rooms && property.rooms.includes(demand.rooms)) score += 15;
                else reasons.push('Oda tipi farklı');
            }
        }
    }

    // 4. Semantic / AI Score (Max 25 pts)
    if (demand.embedding && Array.isArray(demand.embedding)) {
        const propTokens = [
            property.title,
            property.neighborhood || '',
            property.district || ''
        ].join(' ').toLocaleLowerCase('tr').split(/\s+/);

        const semanticScore = calculateSemanticSimilarity(demand.embedding, propTokens);
        const weightedSemantic = (semanticScore / 100) * 25;

        if (weightedSemantic > 2) {
            score += weightedSemantic;
            reasons.push(`AI Profil Uyumu: %${Math.round(semanticScore)}`);
        }
    } else if (aiSummary) {
        const summaryText = JSON.stringify(aiSummary).toLocaleLowerCase('tr');
        // Simple keyword boosts
        if (summaryText.includes('yatırım') && property.title.toLocaleLowerCase('tr').includes('fırsat')) {
            score += 10;
        }
        if (summaryText.includes('deniz') && property.title.toLocaleLowerCase('tr').includes('deniz')) {
            score += 10;
        }
    }

    // 4b. Category Specific Logic (e.g. Land / Arsa)
    const isLand = property.category === 'land' || property.title.toLocaleLowerCase('tr').includes('arsa') || property.title.toLocaleLowerCase('tr').includes('tarla');
    if (isLand) {
        const landKeywords = ['imar', 'parsel', 'ada', 'müstakil'];
        const propTitleLower = property.title.toLocaleLowerCase('tr');
        const demandNotesLower = (demand.notes || '').toLocaleLowerCase('tr');

        landKeywords.forEach(kw => {
            if (propTitleLower.includes(kw) && demandNotesLower.includes(kw)) {
                score += 5;
                reasons.push(kw.charAt(0).toUpperCase() + kw.slice(1) + ' Uyumu');
            }
        });
    }

    // 5. Deep Keyword Boost (Max 10 pts)
    // Scan description for keywords if notes demand it
    if (demand.notes || aiSummary) {
        const keywords = ['deniz', 'havuz', 'site', 'asansör', 'teras', 'bahçe'];
        const notesLower = (demand.notes || JSON.stringify(aiSummary || {})).toLocaleLowerCase('tr');
        const descLower = (property.description || '').toLocaleLowerCase('tr');

        let keywordMatches = 0;
        keywords.forEach(kw => {
            if (notesLower.includes(kw) && descLower.includes(kw)) {
                keywordMatches++;
            }
        });

        if (keywordMatches > 0) {
            score += Math.min(10, keywordMatches * 5);
            reasons.push(keywordMatches + ' Özel Kriter Uyumu');
        }
    }

    // 6. Freshness Boost (Max 10 pts) - INCREASED
    // Boost specifically new listings (last 5 days)
    const daysOld = (Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld <= 2) {
        score += 10;
        reasons.push('Yeni İlan (Son 48 Saat)');
    } else if (daysOld <= 5) {
        score += 5;
        reasons.push('Yeni İlan (Son 5 Gün)');
    }

    // 7. Visual Quality Check (Critical for AI Portfolio)
    // Penalize listings without images heavily, as they look bad in portfolios
    if (!property.images || property.images.length === 0) {
        score -= 30;
        reasons.push('Görsel Eksik (-30)');
    } else {
        score += 5; // Small bonus for having visuals
    }

    return {
        score: Math.min(100, score),
        isViable: score >= 60,
        reasons
    };
};

/**
 * Finds all properties matching a client's demands (ULTRA-OPTIMIZED)
 */
const findMatchesForClient = async (clientId) => {
    const startTotal = performance.now();

    // 0. Check Result Cache
    const cacheKey = `client:${clientId}`;
    const cached = matchingCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        console.log(`[PROFILE] Full Cache HIT for client ${clientId}: 0.05ms`);
        return cached.data;
    }

    // 1. Get Client & Demands
    const client = await prisma.client.findUnique({
        where: { id: parseInt(clientId) },
        include: { demands: true }
    });

    if (!client || !client.demands.length) return [];

    // 2. Get Property Pool (Memory Cached)
    const pool = await getPropertyPool();
    const allMatches = new Map();

    // 3. In-Memory Batch Scoring
    const startScoring = performance.now();
    for (const demand of client.demands) {
        pool.forEach(prop => {
            const { score, isViable, reasons } = calculateMatchScore(prop, demand, client.ai_summary);
            if (isViable) {
                const existing = allMatches.get(prop.id);
                if (!existing || score > existing.match_quality) {
                    allMatches.set(prop.id, {
                        ...prop,
                        match_quality: score,
                        match_reasons: reasons,
                        demand_id: demand.id
                    });
                }
            }
        });
    }
    console.log(`[PROFILE] In-Memory Scoring: ${(performance.now() - startScoring).toFixed(2)}ms`);

    // 4. Hydrate Result Details
    const startHydrate = performance.now();
    const topMatches = Array.from(allMatches.values())
        .sort((a, b) => b.match_quality - a.match_quality)
        .slice(0, 20);

    if (topMatches.length === 0) return [];

    const topIds = topMatches.map(m => m.id);
    const fullProperties = await prisma.property.findMany({
        where: { id: { in: topIds } },
        select: {
            id: true,
            title: true,
            description: true,
            images: true,
            url: true,
            price: true,
            district: true,
            neighborhood: true,
            rooms: true,
            size_m2: true,
            category: true
        }
    });

    const results = topMatches.map(match => ({
        ...match,
        ...(fullProperties.find(p => p.id === match.id) || {})
    }));

    console.log(`[PROFILE] Hydrate: ${(performance.now() - startHydrate).toFixed(2)}ms`);
    console.log(`[PROFILE] Total findMatchesForClient: ${(performance.now() - startTotal).toFixed(2)}ms`);

    // 5. Store in Result Cache
    matchingCache.set(cacheKey, {
        timestamp: Date.now(),
        data: results
    });

    return results;
};

/**
 * Finds all clients matching a single property
 */
const findMatchesForProperty = async (property) => {
    const activeDemands = await prisma.demand.findMany({
        include: {
            client: {
                select: { id: true, name: true, phone: true, consultant_id: true }
            }
        }
    });

    const matches = [];
    activeDemands.forEach(demand => {
        const { score, isViable } = calculateMatchScore(property, demand);
        if (isViable) {
            matches.push({
                client: demand.client,
                match_quality: score,
                demand_id: demand.id
            });
        }
    });

    return matches.sort((a, b) => b.match_quality - a.match_quality);
};

const invalidateClientCache = (clientId) => {
    matchingCache.delete(`client:${clientId}`);
    console.log(`[CACHE] Invalidated matches for client ${clientId}`);
};

module.exports = {
    findMatchesForClient,
    findMatchesForProperty,
    calculateMatchScore,
    invalidateClientCache
};
