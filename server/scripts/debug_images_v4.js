
const prisma = require('../db');

async function debugPropertyImages() {
    const id = 4826;
    try {
        const property = await prisma.property.findUnique({
            where: { id: id },
            select: { images: true, title: true }
        });

        const upgradeImages = (images) => {
            if (!images || !Array.isArray(images)) return [];
            const processed = images
                .filter(img => typeof img === 'string')
                .filter(img => !img.startsWith('data:image/gif'))
                .map(src => {
                    let clean = src;
                    if (src && (src.includes('hemlak.com') || src.includes('hecdn.com')) && src.includes('/mnresize/')) {
                        clean = src.replace(/\/mnresize\/\d+\/\d+\//, '/');
                    }

                    // Aggressive: Round Hepsiemlak timestamps to nearest 10 seconds?
                    // Or just remove the last 3 digits of the timestamp part
                    // Format: .../1768843594696-ID.jpg
                    clean = clean.replace(/(\d{10})\d{3}-(\d+)\.jpg/, '$1-$2.jpg');

                    return clean;
                });
            return [...new Set(processed)];
        };

        const cleaned = upgradeImages(property.images);
        console.log('--- Timestamp Rounded Cleaned ---');
        console.log('Count:', cleaned.length);
        cleaned.forEach((img, idx) => {
            console.log(`${idx}: ${img}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugPropertyImages();
