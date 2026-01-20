const prisma = require('../db');

const getMarketStats = async () => {
    // 1. Get all properties to calculate medians/outliers
    const properties = await prisma.property.findMany({
        where: { price: { gt: 0 }, size_m2: { gt: 0 } },
        select: { neighborhood: true, district: true, price: true, size_m2: true }
    });

    const neighborhoodGroups = {};
    const districtGroups = {};

    properties.forEach(p => {
        const m2Price = Number(p.price) / Number(p.size_m2);

        // Neighborhood group
        if (p.neighborhood) {
            if (!neighborhoodGroups[p.neighborhood]) neighborhoodGroups[p.neighborhood] = { m2Prices: [], district: p.district };
            neighborhoodGroups[p.neighborhood].m2Prices.push(m2Price);
        }

        // District group
        if (p.district) {
            if (!districtGroups[p.district]) districtGroups[p.district] = [];
            districtGroups[p.district].push(m2Price);
        }
    });

    const calculateCleanStats = (m2Prices) => {
        if (m2Prices.length === 0) return { avg: 0, count: 0 };
        if (m2Prices.length < 5) return { avg: m2Prices.reduce((a, b) => a + b, 0) / m2Prices.length, count: m2Prices.length };

        // Sort and exclude top/bottom 10%
        const sorted = [...m2Prices].sort((a, b) => a - b);
        const cut = Math.floor(sorted.length * 0.1);
        const clean = sorted.slice(cut, sorted.length - cut);

        return {
            avg: clean.reduce((a, b) => a + b, 0) / clean.length,
            count: m2Prices.length
        };
    };

    const neighborhoodStats = Object.keys(neighborhoodGroups).map(name => {
        const group = neighborhoodGroups[name];
        const stats = calculateCleanStats(group.m2Prices);
        return {
            name,
            district: group.district,
            avgPricePerM2: stats.avg,
            count: stats.count
        };
    });

    const districtStats = Object.keys(districtGroups).map(name => {
        const m2Prices = districtGroups[name];
        const stats = calculateCleanStats(m2Prices);
        return {
            name,
            avgPricePerM2: stats.avg,
            count: stats.count
        };
    });

    return {
        neighborhoods: neighborhoodStats,
        districts: districtStats
    };
};

const getSupplyDemandStats = async () => {
    // 1. Get Property Counts (Supply)
    const demandStats = await prisma.demand.groupBy({
        by: ['neighborhood'],
        _count: { id: true }
    });

    // 2. Get Listing Counts (Supply)
    const propertyStats = await prisma.property.groupBy({
        by: ['neighborhood'],
        _count: { id: true },
        where: { listing_type: 'sale' }
    });

    const neighborhoods = [...new Set([
        ...demandStats.map(d => d.neighborhood),
        ...propertyStats.map(p => p.neighborhood)
    ])].filter(Boolean);

    return neighborhoods.map(n => {
        const demand = Number(demandStats.find(d => d.neighborhood === n)?._count.id || 0);
        const supply = Number(propertyStats.find(p => p.neighborhood === n)?._count.id || 0);
        return {
            name: n,
            supply,
            demand,
            ratio: demand > 0 ? (supply / demand).toFixed(1) : supply // High ratio = Supply heavy, Low ratio = Demand heavy
        };
    }).sort((a, b) => b.demand - a.demand);
};

const checkOpportunity = async (property) => {
    if (!property.neighborhood || !property.price) return false;

    // Simplified check for now - rely on scoreProperty for full logic
    // This function might be deprecated or needs to use the same shared logic
    const statsMap = await getNeighborhoodStatsMap();
    const analysis = scoreProperty(property, statsMap);
    return analysis.label.includes('Fırsat') || analysis.label.includes('Kelepir');
};

const NEIGHBORHOOD_COORDS = {
    'Ali Çetinkaya Mah.': { lat: 39.3100, lng: 26.7150 },
    'Ali Çetinkaya': { lat: 39.3100, lng: 26.7150 },
    '150 Evler Mah.': { lat: 39.3250, lng: 26.7050 },
    '150 Evler': { lat: 39.3250, lng: 26.7050 },
    'Altınova Mah.': { lat: 39.2250, lng: 26.7800 },
    'Küçükköy Mah.': { lat: 39.2750, lng: 26.6500 },
    'Fevzipaşa-Vehbibey Mah.': { lat: 39.3180, lng: 26.6950 },
    'Sarımsaklı': { lat: 39.2780, lng: 26.6600 },
    'Cunda': { lat: 39.3330, lng: 26.6500 },
    'Namık Kemal': { lat: 39.3350, lng: 26.6450 }
};

let cachedStatsMap = null;
let lastCacheTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const getNeighborhoodStatsMap = async () => {
    const now = Date.now();
    if (cachedStatsMap && (now - lastCacheTime < CACHE_DURATION)) {
        return cachedStatsMap;
    }

    const { neighborhoods, districts } = await getMarketStats();
    const map = {};

    // 1. Populate Neighborhoods
    neighborhoods.forEach(s => {
        if (s.avgPricePerM2 > 0) {
            map[s.name] = s.avgPricePerM2;
        }
    });

    // 2. Populate Districts
    districts.forEach(s => {
        if (s.avgPricePerM2 > 0) {
            map[`DISTRICT:${s.name}`] = s.avgPricePerM2;
        }
    });

    // Heatmap data
    const heatmapData = neighborhoods.map(s => {
        let coords = { lat: 39.3190, lng: 26.6970 };
        if (NEIGHBORHOOD_COORDS[s.name]) {
            coords = NEIGHBORHOOD_COORDS[s.name];
        } else {
            const key = Object.keys(NEIGHBORHOOD_COORDS).find(k => s.name.includes(k) || k.includes(s.name));
            if (key) coords = NEIGHBORHOOD_COORDS[key];
        }
        return {
            neighborhood: s.name,
            avgPricePerM2: s.avgPricePerM2,
            count: s.count,
            lat: coords.lat,
            lng: coords.lng
        };
    });

    map._heatmapData = heatmapData;

    // Update Cache
    cachedStatsMap = map;
    lastCacheTime = now;

    return map;
};

const calculateROI = (price) => {
    if (!price || price <= 0) return { amortizationYears: 20, estimatedMonthlyRent: 0 };
    const amortizationYears = 20;
    const annualRent = price / amortizationYears;
    const monthlyRent = annualRent / 12;
    return {
        amortizationYears,
        estimatedMonthlyRent: Math.round(monthlyRent)
    };
};

const scoreProperty = (property, statsMap, history = []) => {
    if (!property.size_m2 || property.size_m2 <= 0 || !property.price) {
        return { score: 0, label: 'Veri Yok', comparisonBasis: 'None', comparisonPrice: 0 };
    }

    // --- PRICE DROP CHECK ---
    const hasRecentPriceDrop = !!(Array.isArray(history) && history.length > 0 && history.find(h =>
        h.change_type === 'price_decrease' &&
        new Date(h.changed_at) > new Date(new Date().setDate(new Date().getDate() - 30))
    ));
    // ------------------------

    // STRICT OWNER FILTER: Only owner listings are eligible for opportunity scoring
    if (property.seller_type !== 'owner') {
        return {
            score: 0,
            label: 'Emlak Ofisi',
            comparisonBasis: 'None',
            comparisonPrice: 0,
            hasRecentPriceDrop: hasRecentPriceDrop // Ensure this is returned
        };
    }

    let avgM2Price = statsMap[property.neighborhood];
    let comparisonBasis = 'Neighborhood';

    // Fallback to District
    if (!avgM2Price && property.district) {
        avgM2Price = statsMap[`DISTRICT:${property.district}`];
        comparisonBasis = 'District';
    }

    if (!avgM2Price) {
        return {
            score: 5,
            label: 'Yetersiz Veri',
            comparisonBasis: 'None',
            comparisonPrice: 0,
            hasRecentPriceDrop: hasRecentPriceDrop
        };
    }

    const propertyM2Price = property.price / property.size_m2;
    let ratio = propertyM2Price / avgM2Price;

    // --- KEYWORD EMOTION / URGENCY ANALYSIS ---
    let urgencyBoost = 1.0;
    const urgencyKeywords = /acil|acele|sıkışık|ihtiyaçtan|fiyatı düştü|kelepir|son fırsat/i;
    const combinedText = `${property.title || ''} ${property.description || ''}`;

    if (urgencyKeywords.test(combinedText)) {
        urgencyBoost = 0.95; // 5% Boost for urgent keywords
    }
    ratio *= urgencyBoost;
    // ------------------------------------------

    // --- PREMIUM FEATURE DETECTION ---
    let isPremium = false;
    const premiumKeywords = /havuz|deniz manzaralı|lüks|müstakil|özel tasarım|panorami/i;
    if (Array.isArray(property.features)) {
        isPremium = property.features.some(f => premiumKeywords.test(f));
    }
    if (!isPremium && premiumKeywords.test(combinedText)) {
        isPremium = true;
    }
    // ---------------------------------

    // --- PRICE DROP BOOST ---
    if (hasRecentPriceDrop) {
        ratio *= 0.95; // 5% Boost score
    }
    // ------------------------

    // --- AGE CORRECTION (Regex) ---
    // Zero/New buildings are naturally more expensive. 
    // We shouldn't penalize them for being 10-15% above average.
    // We "discount" their ratio to make them comparable to the average stock.
    let age = 10; // Default old
    if (Array.isArray(property.features)) {
        // Look for features containing age-related keywords
        const ageFeature = property.features.find(f => /yaş|bina yaşı|durumu|yapım yılı/i.test(f));

        if (ageFeature) {
            // Strict regex with word boundaries to avoid matching "10" as "0"
            if (/\b(0|sıfır|yeni)\b/i.test(ageFeature)) age = 0;
            else if (/\b(1|bir)\b/i.test(ageFeature)) age = 1;
            else if (/\b(2|iki)\b/i.test(ageFeature)) age = 2;
            else if (/\b(3|üç)\b/i.test(ageFeature)) age = 3;
            else if (/\b(4|dört)\b/i.test(ageFeature)) age = 4;
            else if (/\b(5-10)\b/.test(ageFeature)) age = 8;
        }
    }

    if (age === 0) ratio *= 0.85;
    else if (age <= 4) ratio *= 0.90;
    // ----------------------

    let score = 5;
    let label = 'Normal';

    if (ratio <= 0.75) {
        score = 10;
        label = '🔥 Kelepir'; // >25% cheaper
    } else if (ratio <= 0.85) {
        score = 8;
        label = '⚡ Fırsat'; // >15% cheaper
    } else if (ratio <= 0.95) {
        score = 7;
        label = '✅ Uygun'; // >5% cheaper
    } else if (propertyM2Price > avgM2Price * 1.25) {
        score = 2;
        label = isPremium ? 'Premium' : 'pahalı';
    } else if (propertyM2Price > avgM2Price * 1.15) {
        score = 4;
        label = isPremium ? 'Premium' : 'Yüksek';
    }

    return {
        score,
        label,
        deviation: Math.round((1 - ratio) * 100),
        roi: calculateROI(property.price),
        comparisonBasis,
        comparisonPrice: Math.round(avgM2Price),
        hasRecentPriceDrop: hasRecentPriceDrop,
        isPremium: isPremium
    };
};

module.exports = { getMarketStats, checkOpportunity, getNeighborhoodStatsMap, scoreProperty, calculateROI, getSupplyDemandStats };
