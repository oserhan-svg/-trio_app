
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

        const upgradeImages = (images) => {
            if (!images || !Array.isArray(images)) return [];
            const processed = images
                .filter(img => typeof img === 'string')
                .filter(img => !img.startsWith('data:image/gif'))
                .map(src => {
                    if (src && (src.includes('hemlak.com') || src.includes('hecdn.com')) && src.includes('/mnresize/')) {
                        return src.replace(/\/mnresize\/\d+\/\d+\//, '/');
                    }
                    return src;
                });
            return [...new Set(processed)];
        };

        const cleaned = upgradeImages(property.images);
        console.log('Final Cleaned List:');
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
