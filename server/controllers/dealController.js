const prisma = require('../db');
const { jsonBigInt } = require('../utils/responseHelper');

// Get all deals (Admin sees all, Consultants see their own)
const getDeals = async (req, res) => {
    try {
        const user = req.user;
        let where = {};

        if (user.role !== 'admin') {
            where = { consultant_id: user.id };
        }

        const deals = await prisma.deal.findMany({
            where,
            include: {
                property: { select: { title: true, district: true, url: true } },
                client: { select: { name: true, phone: true } },
                consultant: { select: { name: true, email: true } }
            },
            orderBy: { deal_date: 'desc' }
        });
        jsonBigInt(res, deals);
    } catch (error) {
        console.error('Error fetching deals:', error);
        res.status(500).json({ error: 'Error fetching deals' });
    }
};

// Create a new deal
const createDeal = async (req, res) => {
    try {
        const { property_id, client_id, sale_price, commission_rate, notes, deal_date } = req.body;
        const consultant_id = req.user.id;

        const commission_amount = (parseFloat(sale_price) * parseFloat(commission_rate)) / 100;
        // Default consultant share is 50% of agency commission? 
        // We'll let it be simple for now: 50% split
        const consultant_share = commission_amount * 0.5;

        const deal = await prisma.deal.create({
            data: {
                property_id: property_id ? parseInt(property_id) : null,
                client_id: client_id ? parseInt(client_id) : null,
                consultant_id,
                sale_price: parseFloat(sale_price),
                commission_rate: parseFloat(commission_rate),
                commission_amount,
                consultant_share,
                notes,
                deal_date: deal_date ? new Date(deal_date) : new Date(),
                status: 'closed'
            }
        });

        // Mark property as sold if linked
        if (property_id) {
            await prisma.property.update({
                where: { id: parseInt(property_id) },
                data: { status: 'sold' }
            });
        }

        res.status(201).json(deal);
    } catch (error) {
        console.error('Error creating deal:', error);
        res.status(500).json({ error: 'Error creating deal' });
    }
};

// Get stats for financial dashboard including AI forecasting
const getFinancialStats = async (req, res) => {
    try {
        const user = req.user;
        let where = {};
        if (user.role !== 'admin') where = { consultant_id: user.id };

        const deals = await prisma.deal.findMany({ where });

        // Calculate Actuals
        const totalRevenue = deals.reduce((sum, d) => sum + Number(d.commission_amount), 0);
        const totalSalesVolume = deals.reduce((sum, d) => sum + Number(d.sale_price), 0);
        const dealCount = deals.length;

        // Group actual revenue by month
        const monthlyStats = {};
        deals.forEach(d => {
            const month = d.deal_date.toISOString().substring(0, 7);
            monthlyStats[month] = (monthlyStats[month] || 0) + Number(d.commission_amount);
        });

        // --- AI FORECASTING (WEIGHTED PIPELINE) ---
        // Fetch clients with positive win probability
        const activeLeads = await prisma.client.findMany({
            where: {
                ...where,
                status: { in: ['New', 'Active', 'Negotiation'] },
                priority_score: { gt: 0 }
            },
            include: {
                demands: { take: 1 }
            }
        });

        // We'll estimate commission as 2% of demand max_price if not specified
        const DEFAULT_COMMISSION_RATE = 2;
        let projectedRevenue = 0;

        const forecastData = activeLeads.map(lead => {
            const demandPrice = lead.demands[0]?.max_price || 0;
            const probability = (lead.priority_score || 0) / 100;
            const potentialCommission = (Number(demandPrice) * DEFAULT_COMMISSION_RATE) / 100;
            const weightedValue = potentialCommission * probability;

            projectedRevenue += weightedValue;

            return {
                client: lead.name,
                potential: potentialCommission,
                probability: lead.priority_score,
                weighted: weightedValue
            };
        });

        const monthlyData = Object.keys(monthlyStats).map(month => ({
            month,
            revenue: monthlyStats[month]
        })).sort((a, b) => a.month.localeCompare(b.month));

        res.json({
            actual: {
                totalRevenue,
                totalSalesVolume,
                dealCount,
                monthlyData
            },
            forecast: {
                projectedRevenue,
                weightedLeads: forecastData.sort((a, b) => b.weighted - a.weighted).slice(0, 5),
                leadCount: activeLeads.length
            }
        });
    } catch (error) {
        console.error('Error fetching financial stats:', error);
        res.status(500).json({ error: 'Error fetching financial stats' });
    }
};

const getDealSummaryLetter = async (req, res) => {
    try {
        const { id } = req.params;
        const deal = await prisma.deal.findUnique({
            where: { id: parseInt(id) },
            include: {
                property: true,
                client: true,
                consultant: true
            }
        });

        if (!deal) return res.status(404).json({ error: 'Deal not found' });

        // In a real app, this might use a template engine (ejs/pug) or generate a PDF
        // For this task, we'll return structured data for the frontend to render a "Letter"
        const summary = {
            dealNumber: `TR-${deal.id.toString().padStart(6, '0')}`,
            date: deal.deal_date,
            agency: "Trio Emlak Gayrimenkul",
            consultant: deal.consultant.name,
            client: deal.client.name,
            property: deal.property ? {
                title: deal.property.title,
                location: `${deal.property.district} / ${deal.property.neighborhood}`,
                price: Number(deal.sale_price)
            } : null,
            commission: {
                total: Number(deal.commission_amount),
                rate: Number(deal.commission_rate),
                consultantShare: Number(deal.consultant_share)
            },
            notes: deal.notes
        };

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const runInternalMigration = async (req, res) => {
    const { exec } = require('child_process');
    const path = require('path');

    // Attempt multiple paths for prisma
    const prismaPath = path.join(__dirname, '../node_modules/.bin/prisma');
    const command = `"${prismaPath}" migrate dev --name add_deals_model --skip-generate`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Migration Error: ${error.message}`);
            // 🛡️ Sentinel: Sanitized error response to prevent leaking stderr/internals
            return res.status(500).json({ error: 'Migration failed due to an internal error.' });
        }
        res.json({ message: 'Migration successful' });
    });
};

module.exports = {
    getDeals,
    createDeal,
    getFinancialStats,
    getDealSummaryLetter,
    runInternalMigration
};
