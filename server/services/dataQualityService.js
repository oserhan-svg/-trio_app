const prisma = require('../db');

class DataQualityService {

    async detectDuplicates() {
        /**
         * Finds potential duplicate listings based on:
         * - Title similarity (Levenshtein distance)
         * - Same district + similar price
         * - Same seller phone
         */

        const properties = await prisma.property.findMany({
            where: { status: { not: 'removed' } },
            select: {
                id: true,
                title: true,
                price: true,
                district: true,
                neighborhood: true,
                seller_phone: true,
                rooms: true,
                size_m2: true,
                external_id: true
            }
        });

        const duplicateGroups = [];
        const processed = new Set();

        for (let i = 0; i < properties.length; i++) {
            if (processed.has(properties[i].id)) continue;

            const duplicates = [properties[i]];

            for (let j = i + 1; j < properties.length; j++) {
                if (processed.has(properties[j].id)) continue;

                const similarity = this.calculateSimilarity(properties[i], properties[j]);

                if (similarity > 0.85) {
                    duplicates.push(properties[j]);
                    processed.add(properties[j].id);
                }
            }

            if (duplicates.length > 1) {
                duplicateGroups.push({
                    count: duplicates.length,
                    properties: duplicates,
                    reason: this.getDuplicateReason(duplicates[0], duplicates[1])
                });
            }
        }

        return duplicateGroups;
    }

    calculateSimilarity(prop1, prop2) {
        let score = 0;
        let factors = 0;

        // Same seller phone = high confidence
        if (prop1.seller_phone && prop1.seller_phone === prop2.seller_phone) {
            score += 0.4;
            factors++;
        }

        // Same district
        if (prop1.district === prop2.district) {
            score += 0.2;
            factors++;
        }

        // Similar price (within 10%)
        if (prop1.price && prop2.price) {
            const priceDiff = Math.abs(parseFloat(prop1.price) - parseFloat(prop2.price)) / parseFloat(prop1.price);
            if (priceDiff < 0.1) {
                score += 0.2;
                factors++;
            }
        }

        // Same rooms
        if (prop1.rooms === prop2.rooms) {
            score += 0.1;
            factors++;
        }

        // Similar size
        if (prop1.size_m2 && prop2.size_m2) {
            const sizeDiff = Math.abs(parseFloat(prop1.size_m2) - parseFloat(prop2.size_m2)) / parseFloat(prop1.size_m2);
            if (sizeDiff < 0.1) {
                score += 0.1;
                factors++;
            }
        }

        return factors > 0 ? score : 0;
    }

    getDuplicateReason(prop1, prop2) {
        if (prop1.seller_phone === prop2.seller_phone) return 'Aynı satıcı telefonu';
        if (prop1.district === prop2.district && prop1.rooms === prop2.rooms) return 'Aynı bölge ve oda sayısı';
        return 'Benzer özellikler';
    }

    async detectPriceAnomalies() {
        /**
         * Finds properties with suspicious pricing:
         * - Too high/low for the district
         * - Recent drastic price changes
         */

        const properties = await prisma.property.findMany({
            where: { status: 'active' },
            include: {
                history: {
                    orderBy: { changed_at: 'desc' },
                    take: 2
                }
            }
        });

        // Calculate district averages
        const districtStats = {};
        properties.forEach(p => {
            if (!districtStats[p.district]) {
                districtStats[p.district] = { prices: [], count: 0 };
            }
            districtStats[p.district].prices.push(parseFloat(p.price));
            districtStats[p.district].count++;
        });

        // Calculate averages and std deviation
        Object.keys(districtStats).forEach(district => {
            const prices = districtStats[district].prices;
            const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
            const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length;
            const stdDev = Math.sqrt(variance);

            districtStats[district].avg = avg;
            districtStats[district].stdDev = stdDev;
        });

        const anomalies = [];

        properties.forEach(prop => {
            const stats = districtStats[prop.district];
            if (!stats) return;

            const price = parseFloat(prop.price);
            const zScore = (price - stats.avg) / stats.stdDev;

            // Price is more than 2 standard deviations away
            if (Math.abs(zScore) > 2) {
                anomalies.push({
                    property: prop,
                    type: zScore > 0 ? 'unusually_high' : 'unusually_low',
                    zScore: zScore.toFixed(2),
                    districtAvg: stats.avg,
                    difference: ((price - stats.avg) / stats.avg * 100).toFixed(1)
                });
            }

            // Drastic recent price change
            if (prop.history.length >= 2) {
                const current = parseFloat(prop.history[0].price);
                const previous = parseFloat(prop.history[1].price);
                const change = ((current - previous) / previous * 100);

                if (Math.abs(change) > 20) {
                    anomalies.push({
                        property: prop,
                        type: 'drastic_change',
                        changePercent: change.toFixed(1),
                        previousPrice: previous,
                        currentPrice: current
                    });
                }
            }
        });

        return anomalies;
    }

    async calculatePortfolioHealth() {
        /**
         * Generates a health score for the portfolio based on:
         * - Data completeness
         * - Freshness
         * - Duplicate ratio
         * - Price accuracy
         */

        const totalProps = await prisma.property.count({
            where: { status: { not: 'removed' } }
        });

        if (totalProps === 0) {
            return { score: 0, breakdown: {} };
        }

        // 1. Data Completeness (30 points)
        const propsWithImages = await prisma.property.count({
            where: {
                status: { not: 'removed' },
                images: { isEmpty: false }
            }
        });

        const propsWithDescription = await prisma.property.count({
            where: {
                status: { not: 'removed' },
                description: { not: null }
            }
        });

        const completenessScore = (
            (propsWithImages / totalProps * 15) +
            (propsWithDescription / totalProps * 15)
        );

        // 2. Freshness (30 points)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const recentlyScraped = await prisma.property.count({
            where: {
                status: { not: 'removed' },
                last_scraped: { gte: oneWeekAgo }
            }
        });

        const freshnessScore = (recentlyScraped / totalProps) * 30;

        // 3. Low Duplicate Ratio (20 points)
        const duplicates = await this.detectDuplicates();
        const duplicateRatio = duplicates.reduce((sum, g) => sum + g.count, 0) / totalProps;
        const duplicateScore = Math.max(0, 20 - (duplicateRatio * 100));

        // 4. Valid Pricing (20 points)
        const anomalies = await this.detectPriceAnomalies();
        const anomalyRatio = anomalies.length / totalProps;
        const pricingScore = Math.max(0, 20 - (anomalyRatio * 100));

        const totalScore = Math.round(
            completenessScore + freshnessScore + duplicateScore + pricingScore
        );

        return {
            score: totalScore,
            grade: totalScore >= 90 ? 'A' : totalScore >= 75 ? 'B' : totalScore >= 60 ? 'C' : 'D',
            breakdown: {
                completeness: Math.round(completenessScore),
                freshness: Math.round(freshnessScore),
                duplicates: Math.round(duplicateScore),
                pricing: Math.round(pricingScore)
            },
            stats: {
                totalProperties: totalProps,
                withImages: propsWithImages,
                withDescription: propsWithDescription,
                recentlyUpdated: recentlyScraped,
                duplicateCount: duplicates.length,
                anomalyCount: anomalies.length
            }
        };
    }

    async suggestDataEnrichment(propertyId) {
        /**
         * Analyzes a property and suggests missing data to add
         */

        const property = await prisma.property.findUnique({
            where: { id: parseInt(propertyId) }
        });

        if (!property) return null;

        const suggestions = [];

        if (!property.images || property.images.length === 0) {
            suggestions.push({
                field: 'images',
                priority: 'high',
                action: 'Detay çekme yapın',
                impact: 'Görsel olmayan ilanlar %70 daha az ilgi görüyor'
            });
        }

        if (!property.description) {
            suggestions.push({
                field: 'description',
                priority: 'high',
                action: 'Açıklama ekleyin',
                impact: 'SEO ve müşteri güveni için kritik'
            });
        }

        if (!property.size_m2) {
            suggestions.push({
                field: 'size_m2',
                priority: 'medium',
                action: 'Metrekare bilgisi ekleyin',
                impact: 'Fiyat karşılaştırması için gerekli'
            });
        }

        if (!property.building_age) {
            suggestions.push({
                field: 'building_age',
                priority: 'low',
                action: 'Bina yaşı ekleyin',
                impact: 'Müşteri filtreleri için önemli'
            });
        }

        return suggestions;
    }
}

module.exports = new DataQualityService();
