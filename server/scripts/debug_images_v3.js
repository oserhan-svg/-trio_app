
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
        console.log('Raw Images:');
        property.images.forEach((img, idx) => {
            console.log(`${idx}: ${img}`);
        });

        const upgradeImages = (images) => {
            if (!images || !Array.isArray(images)) return [];
            const results = [];
            const seenKeys = new Set();

            images
                .filter(img => typeof img === 'string')
                .filter(img => !img.startsWith('data:image/gif'))
                .forEach(src => {
                    let clean = src;
                    if (src && (src.includes('hemlak.com') || src.includes('hecdn.com')) && src.includes('/mnresize/')) {
                        clean = src.replace(/\/mnresize\/\d+\/\d+\//, '/');
                    }

                    // Experimental: Extract the "core" part (e.g., 45955610 from 1768843594696-45955610.jpg)
                    // Or check if multiple timestamps exist for the same "property-internal" id
                    const match = clean.match(/-(\d+)\.(jpg|jpeg|png|webp)/i);
                    if (match) {
                        const key = match[1];
                        if (!seenKeys.has(key)) {
                            seenKeys.add(key);
                            results.push(clean);
                        } else {
                            console.log(`Skipping duplicate key ${key}: ${clean}`);
                        }
                    } else {
                        results.push(clean);
                    }
                });
            return results;
        };

        const cleaned = upgradeImages(property.images);
        console.log('--- Aggressive Cleaned ---');
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
