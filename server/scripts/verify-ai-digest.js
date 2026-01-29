const prisma = require('../db');
const matchingService = require('../services/matchingService');
const GroqService = require('../services/GroqService');
const performanceHardeningService = require('../services/performanceHardeningService');
const marketingService = require('../services/marketingService');
const { v4: uuidv4 } = require('uuid');

async function verifyAIDigest() {
    console.log('🚀 Starting AI Digest Verification...');

    try {
        // 1. Find a test client with demands
        const client = await prisma.client.findFirst({
            where: { demands: { some: {} } },
            include: { demands: true }
        });

        if (!client) {
            console.error('❌ No client with demands found for testing.');
            process.exit(1);
        }

        console.log(`👤 Testing with Client: ${client.name} (ID: ${client.id})`);

        // 2. Find matches
        const matches = await matchingService.findMatchesForClient(client.id);
        if (!matches || matches.length === 0) {
            console.error('❌ No matches found for this client.');
            process.exit(1);
        }

        console.log(`📈 Found ${matches.length} matches. Processing top 3...`);

        // 3. Prepare matches (Replicating controller logic)
        const rawMatches = matches.slice(0, 3);
        const bestMatches = await Promise.all(rawMatches.map(async (p) => {
            console.log(`🏠 Processing Property #${p.id}: ${p.title}`);

            // Generate marketing if missing
            let pkg = null;
            if (p.metadata && typeof p.metadata === 'object') {
                pkg = p.metadata.marketing_package;
            }

            if (!pkg || !pkg.premium_title) {
                console.log(`✨ Generating AI Marketing Package for #${p.id}...`);
                pkg = await marketingService.generateMarketingPackage(p.id);
            }

            // Create/Ensure Listing
            let listing = await prisma.propertyListing.findFirst({
                where: { property_id: p.id, created_by: null },
                orderBy: { created_at: 'desc' }
            });

            if (!listing) {
                console.log(`🔗 Creating shareable listing for #${p.id}...`);
                listing = await prisma.propertyListing.create({
                    data: {
                        property_id: p.id,
                        share_token: uuidv4(),
                        custom_title: pkg?.premium_title || p.title,
                        custom_description: pkg?.premium_description || p.description,
                    }
                });
            }

            return {
                ...p,
                share_token: listing.share_token,
                custom_title: listing.custom_title || p.title,
                custom_description: listing.custom_description || p.description
            };
        }));

        const bestDemand = client.demands[0];
        const recentInteractions = await prisma.interaction.findMany({
            where: { client_id: client.id },
            orderBy: { date: 'desc' },
            take: 3
        });

        // 4. Generate Digest
        console.log('🤖 Calling Groq to generate branded digest...');
        const digest = await GroqService.generateClientDigest(client, bestDemand, bestMatches, recentInteractions);

        console.log('\n--- FINAL GENERATED DIGEST ---\n');
        console.log(digest);
        console.log('\n------------------------------\n');

        // 5. Assertions
        const hasBranding = digest.includes('TRIO EMLAK') || digest.includes('AYVALIK ÖZEL PORTFÖY ÖZETİ');
        const hasBrandedLinks = digest.includes('listing/');

        if (hasBranding) console.log('✅ Branding present.');
        else console.warn('⚠️ Branding might be missing or different.');

        if (hasBrandedLinks) console.log('✅ Branded links present.');
        else console.warn('⚠️ Branded links missing.');

        console.log('✨ Verification complete.');

    } catch (error) {
        console.error('❌ Verification Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAIDigest();
