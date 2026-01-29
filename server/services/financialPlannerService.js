const prisma = require('../db');

class FinancialPlannerService {

    /**
     * Calculate financial summary for a property
     */
    async calculateFinancials(propertyId) {
        const property = await prisma.property.findUnique({
            where: { id: parseInt(propertyId) }
        });

        if (!property) throw new Error('Property not found');

        const price = parseFloat(property.price);

        // 1. Closing Costs (Standard TR rates)
        const closingCosts = {
            deedFee: price * 0.04, // Tapu Harcı (usually shared 2% + 2%)
            agentFee: price * 0.02, // Service Fee
            otherFees: 5000, // Notary, revolving fund etc.
            total: (price * 0.04) + (price * 0.02) + 5000
        };

        // 2. Mortgage Simulation (Current average rates)
        const mortgage = this.simulateMortgage(price);

        // 3. Investment Analytics (If applicable)
        const investment = await this.calculateInvestmentYield(property, price);

        return {
            propertyId: property.id,
            price,
            closingCosts,
            mortgage,
            investment,
            last_updated: new Date()
        };
    }

    simulateMortgage(price) {
        const downPayment = price * 0.25; // 25% down
        const loanAmount = price * 0.75;
        const annualRate = 0.45; // 45% annual for TR (approx)
        const monthlyRate = annualRate / 12;

        const calculatePayment = (months) => {
            const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months);
            const denominator = Math.pow(1 + monthlyRate, months) - 1;
            return Math.round(numerator / denominator);
        };

        return {
            downPaymentRequired: downPayment,
            loanAmount: loanAmount,
            options: [
                { months: 60, title: '5 Yıl', monthlyPayment: calculatePayment(60) },
                { months: 120, title: '10 Yıl', monthlyPayment: calculatePayment(120) }
            ]
        };
    }

    async calculateInvestmentYield(property, price) {
        // Find historical or average rents in the district for this room count
        const avgRentRes = await prisma.property.aggregate({
            _avg: { price: true },
            where: {
                district: property.district,
                rooms: property.rooms,
                listing_type: 'rent',
                status: 'active'
            }
        });

        const monthlyRent = avgRentRes._avg.price ? parseFloat(avgRentRes._avg.price) : (price * 0.0035); // Fallback: 0.35% yield
        const annualRent = monthlyRent * 12;

        const capRate = (annualRent / price) * 100;
        const paybackYears = price / annualRent;

        return {
            estimatedMonthlyRent: Math.round(monthlyRent),
            grossCapRate: parseFloat(capRate.toFixed(2)),
            paybackPeriodYears: parseFloat(paybackYears.toFixed(1)),
            monthlyCashFlow: Math.round(monthlyRent * 0.9) // estimated net after small maintenance
        };
    }
}

module.exports = new FinancialPlannerService();
