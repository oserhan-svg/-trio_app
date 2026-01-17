const prisma = require('../db');

const getMarketStats = async () => {
    // 1. Group by Neighborhood
    const neighborhoodStats = await prisma.property.groupBy({
        by: ['neighborhood', 'district'], // Include district for mapping
        _avg: { price: true, size_m2: true },
        _count: { id: true }
    });

    // 2. Group by District (Fallback)
    const districtStats = await prisma.property.groupBy({
        by: ['district'],
        _avg: { price: true, size_m2: true },
        _count: { id: true }
    });

    const formatStats = (s, key) => ({
        name: s[key] || 'Bilinmiyor',
        district: s.district || null, // Only for neighborhoods
        avgPrice: s._avg.price || 0,
        avgM2: s._avg.size_m2 || 0,
        count: s._count.id,
        avgPricePerM2: (s._avg.size_m2 && s._avg.size_m2 > 0) ? (s._avg.price / s._avg.size_m2) : 0
    });

    return {
        neighborhoods: neighborhoodStats.map(s => formatStats(s, 'neighborhood')),
        districts: districtStats.map(s => formatStats(s, 'district'))
    };
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

const getNeighborhoodStatsMap = async () => {
    const { neighborhoods, districts } = await getMarketStats();
    const map = {};

    // 1. Populate Neighborhoods
    neighborhoods.forEach(s => {
        if (s.avgPricePerM2 > 0) {
            map[s.name] = s.avgPricePerM2;
        }
    });

    // 2. Populate Districts (prefixed or separate lookup?)
    // We will store them with a special prefix "DISTRICT:" to avoid collision
    districts.forEach(s => {
        if (s.avgPricePerM2 > 0) {
            map[`DISTRICT:${s.name}`] = s.avgPricePerM2;
        }
    });

    // Heatmap data (legacy support for now)
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

    let avgM2Price = statsMap[property.neighborhood];
    let comparisonBasis = 'Neighborhood';

    // Fallback to District
    if (!avgM2Price && property.district) {
        avgM2Price = statsMap[`DISTRICT:${property.district}`];
        comparisonBasis = 'District';
    }

    if (!avgM2Price) {
        return { score: 5, label: 'Yetersiz Veri', comparisonBasis: 'None', comparisonPrice: 0 };
    }

    const propertyM2Price = property.price / property.size_m2;
    let ratio = propertyM2Price / avgM2Price;

    // --- PRICE DROP BOOST ---
    // If price dropped recently (last 30 days), it's a "Hot" opportunity
    if (Array.isArray(history) && history.length > 0) {
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

        const recentDrop = history.find(h =>
            h.change_type === 'price_decrease' &&
            new Date(h.changed_at) > oneMonthAgo
        );

        if (recentDrop) {
            ratio *= 0.95; // 5% Boost score (making ratio smaller = better)
        }
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
        label = 'pahalı';
    } else if (propertyM2Price > avgM2Price * 1.15) {
        score = 4;
        label = 'Yüksek';
    }

    return {
        score,
        label,
        deviation: Math.round((1 - ratio) * 100),
        roi: calculateROI(property.price),
        comparisonBasis,
        comparisonPrice: Math.round(avgM2Price),
        hasRecentPriceDrop: !!(Array.isArray(history) && history.length > 0 && history.find(h =>
            h.change_type === 'price_decrease' &&
            new Date(h.changed_at) > new Date(new Date().setDate(new Date().getDate() - 30))
        ))
    };
};

module.exports = { getMarketStats, checkOpportunity, getNeighborhoodStatsMap, scoreProperty, calculateROI };
