const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPortfolio() {
    try {
        console.log('--- Starting Portfolio Correction ---');

        // 1. Fetch assigned properties
        const portfolio = await prisma.property.findMany({
            where: { assigned_user_id: { not: null } }
        });

        console.log(`Found ${portfolio.length} portfolio properties.`);

        for (const p of portfolio) {
            let updatedTitle = p.title;
            let updatedSeller = p.seller_name;

            // Fix empty or placeholder titles
            if (!p.title || p.title.trim() === '' || p.title.includes('Trio Emlak İlanı')) {
                // Try to extract from URL
                const urlObj = new URL(p.url);
                const pathParts = urlObj.pathname.split('/');
                // Get the part before /detay or similar
                let slug = '';
                if (p.url.includes('sahibinden.com')) {
                    slug = pathParts.find(part => part.startsWith('emlak-') || part.includes('-satilik-') || part.includes('-kiralik-'));
                    if (!slug && pathParts.length > 2) slug = pathParts[2];
                } else if (p.url.includes('hepsiemlak.com')) {
                    slug = pathParts[pathParts.length - 3] || pathParts[pathParts.length - 2];
                }

                if (slug) {
                    // Convert slug to Title Case
                    updatedTitle = slug
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                        .replace('Plus', '+'); // Fix 3-plus-1

                    // Clean up common prefixes
                    updatedTitle = updatedTitle.replace(/^Emlak /, '').replace(/^Konut /, '');
                    console.log(`Updating Title for ID ${p.id}: "${updatedTitle}"`);
                }
            }

            // Fix empty or "Bilinmiyor" seller names for portfolio
            if (!p.seller_name || p.seller_name === 'Bilinmiyor' || p.seller_name === 'isimsiz') {
                updatedSeller = 'Trio Emlak & Gayrimenkul';
                console.log(`Updating Seller for ID ${p.id}: "${updatedSeller}"`);
            }

            if (updatedTitle !== p.title || updatedSeller !== p.seller_name) {
                await prisma.property.update({
                    where: { id: p.id },
                    data: {
                        title: updatedTitle,
                        seller_name: updatedSeller
                    }
                });
            }
        }

        console.log('--- Portfolio Correction Complete ---');
    } catch (error) {
        console.error('Error during portfolio correction:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixPortfolio();
