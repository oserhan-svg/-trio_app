const prisma = require('../db');

class CommissionService {

    /**
     * Calculate commission splits for a deal
     * Standard Trio Model: Company (50%), Listing Agent (25%), Selling Agent (25%)
     */
    calculateSplits(totalCommission, listingAgentId, sellingAgentId) {
        const companyPart = totalCommission * 0.50;
        const agentPart = totalCommission * 0.25;

        const splits = [
            { type: 'COMPANY', amount: companyPart, recipientId: null },
            { type: 'LISTING_AGENT', amount: agentPart, recipientId: listingAgentId },
            { type: 'SELLING_AGENT', amount: agentPart, recipientId: sellingAgentId }
        ];

        return {
            total: totalCommission,
            splits: splits
        };
    }

    /**
     * Get an officer's performance scorecard
     */
    async getOfficerScorecard(userId) {
        const deals = await prisma.deal.findMany({
            where: {
                OR: [
                    { listing_agent_id: userId },
                    { selling_agent_id: userId }
                ],
                status: 'Closed Won'
            }
        });

        const totalRevenue = deals.reduce((acc, deal) => {
            const isListing = deal.listing_agent_id === userId;
            const isSelling = deal.selling_agent_id === userId;
            let share = 0;
            if (isListing) share += deal.commission * 0.25;
            if (isSelling) share += deal.commission * 0.25;
            return acc + share;
        }, 0);

        const activeLeadsCount = await prisma.client.count({
            where: { consultant_id: userId, status: 'Active' }
        });

        // Calculate Conversion Rate (Closed Won / Total Assigned Clients)
        const totalClients = await prisma.client.count({ where: { consultant_id: userId } });
        const conversionRate = totalClients > 0 ? (deals.length / totalClients) * 100 : 0;

        return {
            userId,
            dealsClosed: deals.length,
            totalRevenueAssigned: totalRevenue,
            activeLeads: activeLeadsCount,
            conversionRate: conversionRate.toFixed(1),
            rank: this.calculateRank(totalRevenue, deals.length)
        };
    }

    calculateRank(revenue, deals) {
        if (revenue > 500000) return 'ELITE ADVISOR';
        if (revenue > 200000) return 'SENIOR CONSULTANT';
        if (deals > 10) return 'PRODUCER';
        return 'ASSOCIATE';
    }
}

module.exports = new CommissionService();
