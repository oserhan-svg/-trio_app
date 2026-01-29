const prisma = require('../db');

class AppraisalService {

    async calculateAppraisal(propertyId) {
        /**
         * Calculates Fair Market Value (FMV) based on:
         * - Internal comparable listings
         * - Scraped market data for district
         * - Historical sales (Deals)
         * - Property-specific adjustments (m2, rooms, features)
         */

        const property = await prisma.property.findUnique({
            where: { id: parseInt(propertyId) },
            include: {
                history: true
            }
        });

        if (!property) throw new Error('Property not found');

        // 1. Get Comparables (Internal + Scraped)
        // We look for same district, same room count, within 20% size difference
        const minSize = property.size_m2 ? parseFloat(property.size_m2) * 0.8 : 0;
        const maxSize = property.size_m2 ? parseFloat(property.size_m2) * 1.2 : 9999;

        const comparables = await prisma.property.findMany({
            where: {
                district: property.district,
                rooms: property.rooms,
                size_m2: { gte: minSize, lte: maxSize },
                status: 'active',
                id: { not: property.id }
            },
            select: {
                price: true,
                size_m2: true
            }
        });

        // 2. Statistics from Comparables
        if (comparables.length < 3) {
            // Fallback: broaden search to district only
            const districtComps = await prisma.property.findMany({
                where: {
                    district: property.district,
                    rooms: property.rooms,
                    status: 'active'
                },
                select: { price: true, size_m2: true },
                take: 20
            });
            comparables.push(...districtComps);
        }

        const m2Prices = comparables
            .filter(c => c.size_m2 && parseFloat(c.size_m2) > 0)
            .map(c => parseFloat(c.price) / parseFloat(c.size_m2));

        if (m2Prices.length === 0) return this.generateFallbackAppraisal(property);

        const avgM2Price = m2Prices.reduce((a, b) => a + b, 0) / m2Prices.length;
        const medianM2Price = m2Prices.sort((a, b) => a - b)[Math.floor(m2Prices.length / 2)];

        // 3. Fair Market Value Calculation
        const fmv = avgM2Price * parseFloat(property.size_m2 || 0);
        const currentPrice = parseFloat(property.price);
        const positioning = ((currentPrice - fmv) / fmv) * 100;

        // 4. Confidence Level
        const confidence = comparables.length > 10 ? 'high' : comparables.length > 5 ? 'medium' : 'low';

        // 5. Optimization Suggestion
        let suggestion = null;
        if (positioning > 15) {
            suggestion = {
                action: 'price_reduction',
                reason: `İlan bölge ortalamasının %${positioning.toFixed(1)} üzerinde. Hızlı satış için fiyatı %10-15 aşağı çekmelisiniz.`,
                target: fmv * 1.05
            };
        } else if (positioning < -15) {
            suggestion = {
                action: 'premium_positioning',
                reason: `İlan bölge ortalamasının %${Math.abs(positioning).toFixed(1)} altında. Bu bir 'Fırsat' ilanıdır.`,
                target: currentPrice
            };
        } else {
            suggestion = {
                action: 'maintain',
                reason: 'Fiyatlandırma piyasa rayicinde. Mevcut durum korunabilir.',
                target: currentPrice
            };
        }

        return {
            propertyId: property.id,
            currentPrice,
            fairMarketValue: Math.round(fmv),
            avgM2Price: Math.round(avgM2Price),
            medianM2Price: Math.round(medianM2Price),
            positioning: parseFloat(positioning.toFixed(2)), // % above/below FMV
            confidence,
            comparableCount: comparables.length,
            suggestion,
            districtAvg: Math.round(avgM2Price * 100) // Normalized 100m2 index
        };
    }

    generateFallbackAppraisal(property) {
        return {
            propertyId: property.id,
            currentPrice: parseFloat(property.price),
            fairMarketValue: parseFloat(property.price),
            positioning: 0,
            confidence: 'none',
            suggestion: { action: 'insufficient_data', reason: 'Yeterli karşılaştırılabilir veri bulunamadı.' }
        };
    }

    async getDistrictPerformance() {
        /**
         * Aggregates market trends across key districts
         */
        const stats = await prisma.property.groupBy({
            by: ['district'],
            _avg: { price: true, size_m2: true },
            _count: { id: true },
            where: { status: 'active' }
        });

        return stats.map(s => ({
            district: s.district,
            avgPrice: Math.round(s._avg.price),
            avgSize: Math.round(s._avg.size_m2),
            avgM2Price: Math.round(s._avg.price / s._avg.size_m2),
            totalListings: s._count.id
        })).sort((a, b) => b.avgM2Price - a.avgM2Price);
    }
}

module.exports = new AppraisalService();
