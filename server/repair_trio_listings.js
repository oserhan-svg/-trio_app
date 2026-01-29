const prisma = require('./db');

async function repairTrio() {
    try {
        const trioListings = await prisma.property.findMany({
            where: {
                OR: [
                    { url: { contains: 'trioemlakvegayrimenkul' } },
                    { url: { contains: '/trio-emlak-gayrimenkul-danismanlik' } },
                    { seller_name: { contains: 'Trio', mode: 'insensitive' } },
                    { seller_name: { contains: 'ozancan', mode: 'insensitive' } },
                    { seller_name: { contains: 'Gayrimenkul Danışmanlık', mode: 'insensitive' } }
                ]
            }
        });

        console.log(`Processing ${trioListings.length} Trio-related listings...`);

        let assignedCount = 0;
        let titleFixedCount = 0;
        let statusFixedCount = 0;

        for (const p of trioListings) {
            let needsUpdate = false;
            const updateData = {};

            // 1. Assignment & Primary Status
            if (p.assigned_user_id !== 3 || p.is_primary !== true) {
                updateData.assigned_user_id = 3;
                updateData.is_primary = true;
                needsUpdate = true;
                assignedCount++;
            }

            // 2. Status Fix - Ensure they are active to be visible
            if (p.status !== 'active') {
                updateData.status = 'active';
                needsUpdate = true;
                statusFixedCount++;
            }

            // 3. Title Fix - Improved slug extraction
            const titleLower = (p.title || "").toLowerCase();
            const isBadTitle = !p.title ||
                p.title.trim() === "" ||
                titleLower === "detay" ||
                titleLower === "no title" ||
                titleLower.includes("trio emlak ilanı");

            if (isBadTitle) {
                try {
                    const urlObj = new URL(p.url);
                    const pathParts = urlObj.pathname.split('/').filter(s => s.length > 0);

                    // Filter out generic parts like 'ilan', 'detay'
                    const interestingParts = pathParts.filter(part => part !== 'ilan' && part !== 'detay');

                    // Pick the longest part as it's likely the descriptive slug
                    let slugPart = interestingParts.reduce((a, b) => a.length > b.length ? a : b, "");

                    if (slugPart) {
                        let fallbackTitle = slugPart
                            .replace(/^ilan-/, '')
                            .replace(/-detay$/, '')
                            .replace(/-/g, ' ')
                            .replace(/\d{8,12}/, '') // Remove long ID strings instead of all digits
                            .trim();

                        if (fallbackTitle.length < 5) {
                            fallbackTitle = "Trio Emlak İlanı (" + p.external_id + ")";
                        }

                        // Capitalize for professional display
                        fallbackTitle = fallbackTitle.split(' ')
                            .map(word => {
                                if (word.length === 0) return "";
                                // Map Turkish specific characters if needed, but basic capitalize is usually fine for slugs
                                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                            })
                            .join(' ')
                            .trim();

                        if (fallbackTitle) {
                            updateData.title = fallbackTitle;
                            needsUpdate = true;
                            titleFixedCount++;
                        }
                    }
                } catch (urlErr) {
                    console.error(`Could not parse URL for ${p.id}: ${p.url}`);
                }
            }

            if (needsUpdate) {
                await prisma.property.update({
                    where: { id: p.id },
                    data: updateData
                });
            }
        }

        console.log(`Successfully assigned/updated ${assignedCount} listings.`);
        console.log(`Successfully fixed titles for ${titleFixedCount} listings.`);
        console.log(`Successfully activated ${statusFixedCount} listings.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

repairTrio();
