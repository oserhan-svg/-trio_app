const { query } = require('./db');

const mockData = [
    {
        external_id: '1000001',
        title: 'Ayvalık Merkezde Satılık 3+1 Daire',
        price: 3500000,
        url: 'https://example.com/ilan1'
    },
    {
        external_id: '1000002',
        title: '150 Evler Mahallesinde Lüks Daire',
        price: 4200000,
        url: 'https://example.com/ilan2'
    },
    {
        external_id: '1000003',
        title: 'Yatırımlık Fırsat Daire',
        price: 2800000,
        url: 'https://example.com/ilan3'
    },
    {
        external_id: '1000004',
        title: 'Deniz Manzaralı Geniş Daire',
        price: 5500000,
        url: 'https://example.com/ilan4'
    },
    {
        external_id: '1000005',
        title: 'Ali Çetinkaya Mh. Uygun Fiyatlı',
        price: 2100000,
        url: 'https://example.com/ilan5'
    }
];

async function seedMockData() {
    console.log('Seeding mock data...');
    try {
        for (const item of mockData) {
            // Check existence
            const res = await query('SELECT * FROM properties WHERE external_id = ?', [item.external_id]);
            if (res.rows.length === 0) {
                const insertRes = await query(
                    'INSERT INTO properties (external_id, title, price, url, district, neighborhood, rooms, size_m2) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [item.external_id, item.title, item.price, item.url, 'Ayvalık', '150 Evler', '3+1', 120]
                );

                // Add history
                const newId = insertRes.rows[0].id; // SQLite wrapper returns lastID here
                await query(
                    'INSERT INTO property_history (property_id, price, change_type, changed_at) VALUES (?, ?, ?, datetime("now", "-10 days"))',
                    [newId, item.price * 0.9, 'initial']
                );
                await query(
                    'INSERT INTO property_history (property_id, price, change_type, changed_at) VALUES (?, ?, ?, datetime("now"))',
                    [newId, item.price, 'price_increase']
                );
                console.log(`Added: ${item.title}`);
            }
        }
        console.log('Mock data seeded successfully.');
    } catch (error) {
        console.error('Error seeding data:', error);
    }
}

seedMockData();
