
const prisma = require('../db');

async function debugPropertyImages() {
    const id = 4826;
    try {
        const property = await prisma.property.findUnique({
            where: { id: id },
            select: { images: true, title: true }
        });

        if (!property) {
            console.log('Property not found');
            return;
        }

        console.log('Title:', property.title);
        console.log('Images Count:', property.images.length);
        console.log('First 5 Images:');
        property.images.slice(0, 5).forEach((img, idx) => {
            console.log(`${idx}: ${img}`);
        });

        // Test deduplication logic
        const upgradeImages = (images) => {
            if (!images || !Array.isArray(images)) return [];
            const processed = images.filter(img => typeof img === 'string').map(src => {
                if (src && src.includes('hemlak.com') && src.includes('/mnresize/')) {
                    return src.replace(/\/mnresize\/\d+\/\d+\//, '/');
                }
                return src;
            });
            return [...new Set(processed)];
        };

        const cleaned = upgradeImages(property.images);
        console.log('--- Cleaned ---');
        console.log('Cleaned Count:', cleaned.length);
        cleaned.slice(0, 5).forEach((img, idx) => {
            console.log(`${idx}: ${img}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugPropertyImages();
