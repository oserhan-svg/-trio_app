const prisma = require('../db');
const marketService = require('./marketTrendService');

class PostSaleService {

    /**
     * Calculate ROI for a closed deal
     */
    async calculateROI(dealId) {
        const deal = await prisma.deal.findUnique({
            where: { id: parseInt(dealId) },
            include: { property: true, client: true }
        });

        if (!deal || deal.status !== 'Closed Won') return null;

        const purchasePrice = parseFloat(deal.amount);
        const purchaseDate = deal.closed_at;

        // Get current market stats for the district
        const trends = await marketService.getDistrictStats(deal.property.district);
        const currentEstimatedValue = deal.property.size_m2 * trends.avgPriceM2;

        const absoluteGain = currentEstimatedValue - purchasePrice;
        const roiPercentage = ((absoluteGain / purchasePrice) * 100).toFixed(1);

        return {
            dealId: deal.id,
            clientName: deal.client.name,
            purchasePrice,
            currentEstimatedValue,
            absoluteGain,
            roiPercentage,
            monthsHeld: Math.floor((new Date() - new Date(purchaseDate)) / (1000 * 60 * 60 * 24 * 30.44))
        };
    }

    /**
     * Check for any "Hot Resale" opportunities in the database
     */
    async getResaleOpportunities() {
        const closedDeals = await prisma.deal.findMany({
            where: { status: 'Closed Won' },
            include: { property: true, client: true }
        });

        const opportunities = [];
        for (const deal of closedDeals) {
            const roiData = await this.calculateROI(deal.id);
            // If ROI is > 25% or property held > 2 years, mark as opportunity
            if (roiData.roiPercentage > 25 || roiData.monthsHeld >= 24) {
                opportunities.push({
                    ...roiData,
                    reason: roiData.roiPercentage > 25 ? 'High Appreciation' : 'Long-term Hold'
                });
            }
        }

        return opportunities.sort((a, b) => b.roiPercentage - a.roiPercentage);
    }

    /**
     * Record an after-sales service activity
     */
    async logAfterSalesActivity(dealId, activityType, details) {
        return await prisma.auditLog.create({
            data: {
                action: 'AFTER_SALES_UPDATE',
                entity_type: 'Deal',
                entity_id: parseInt(dealId),
                details: {
                    type: activityType, // e.g., 'Renovation', 'RentManagement'
                    ...details
                }
            }
        });
    }
}

module.exports = new PostSaleService();
