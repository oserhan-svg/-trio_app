// Simplified service with history
const fetchRentalRate = async () => {
    console.log('Fetching rental rate history...');

    await new Promise(resolve => setTimeout(resolve, 300));

    // Returning simulated historical data
    return [
        { month: 'Ocak 2026', residential: '34.88', commercial: '34.88' },
        { month: 'Aralık 2025', residential: '32.50', commercial: '32.50' },
        { month: 'Kasım 2025', residential: '30.12', commercial: '30.12' },
        { month: 'Ekim 2025', residential: '28.45', commercial: '28.45' },
        { month: 'Eylül 2025', residential: '27.90', commercial: '27.90' },
        { month: 'Ağustos 2025', residential: '26.15', commercial: '26.15' },
        { month: 'Temmuz 2024', residential: '65.07', commercial: '65.07' }, // Cap lifted
        { month: 'Haziran 2024', residential: '25.00', commercial: '62.51' }  // Cap active
    ];
};

module.exports = { fetchRentalRate };
