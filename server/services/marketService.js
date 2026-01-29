const prisma = require('../db');

class MarketService {
    /**
     * Identifies discrepancies between client demands and current property supply.
     */
    async getMarketGaps() {
        console.log('📊 Analyzing Market Gaps...');
        try {
            // 1. Aggregate Demands by District and Rooms
            const demands = await prisma.demand.findMany({
                select: { district: true, rooms: true }
            });

            const demandFrequencies = {};
            demands.forEach(d => {
                const key = `${d.district || 'Belirtilmemiş'}-${d.rooms || 'Belirtilmemiş'}`;
                demandFrequencies[key] = (demandFrequencies[key] || 0) + 1;
            });

            // 2. Aggregate Supply (Internal + External Scraped)
            const [internalProps, externalProps] = await Promise.all([
                prisma.property.findMany({ where: { status: 'active' }, select: { district: true, rooms: true } }),
                prisma.propertyOwnerListing.findMany({ select: { district: true, rooms: true } }) // From scraper
            ]);

            const supplyFrequencies = {};
            [...internalProps, ...externalProps].forEach(p => {
                const key = `${p.district || 'Belirtilmemiş'}-${p.rooms || 'Belirtilmemiş'}`;
                supplyFrequencies[key] = (supplyFrequencies[key] || 0) + 1;
            });

            // 3. Find Gaps (High Demand, Low Supply)
            const gaps = Object.keys(demandFrequencies).map(key => {
                const demand = demandFrequencies[key];
                const supply = supplyFrequencies[key] || 0;
                const gapScore = demand - (supply * 0.5); // Weighting demand more

                return {
                    category: key,
                    demand,
                    supply,
                    gapScore: gapScore.toFixed(1)
                };
            })
                .sort((a, b) => b.gapScore - a.gapScore)
                .slice(0, 5); // Top 5 gaps

            return gaps;
        } catch (error) {
            console.error('Market Gap Analysis Error:', error);
            return [];
        }
    }

    /**
     * Estimates potential revenue based on high-priority leads and matched property values.
     */
    async getRevenueForecast() {
        console.log('💰 Calculating Revenue Forecast...');
        try {
            // High priority clients (>= 75)
            const hotClients = await prisma.client.findMany({
                where: { priority_score: { gte: 75 } },
                include: { demands: true }
            });

            let totalPotentialValue = 0;
            let dealCount = 0;

            for (const client of hotClients) {
                // Find best matching property price
                const bestMatch = await prisma.property.findFirst({
                    where: {
                        district: client.demands[0]?.district,
                        price: {
                            gte: client.demands[0]?.min_price || 0,
                            lte: client.demands[0]?.max_price || 999999999
                        }
                    },
                    orderBy: { created_at: 'desc' }
                });

                if (bestMatch) {
                    totalPotentialValue += parseFloat(bestMatch.price);
                    dealCount++;
                }
            }

            // Estimate 2% commission
            const estimatedCommission = totalPotentialValue * 0.02;

            return {
                dealCount,
                potentialVolume: totalPotentialValue,
                estimatedCommission,
                forecastDate: new Date()
            };
        } catch (error) {
            console.error('Revenue Forecast Error:', error);
            return { dealCount: 0, potentialVolume: 0, estimatedCommission: 0 };
        }
    }
}

module.exports = new MarketService();
