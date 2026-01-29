const prisma = require('../db');
const { v4: uuidv4 } = require('uuid');
const { generatePropertyDescription } = require('../services/aiService');
const marketingService = require('../services/marketingService');

// Generate a shareable link for a property
const generateListing = async (req, res) => {
    try {
        const { propertyId, description, title } = req.body; // Added title
        const userId = req.user?.id; // From auth middleware

        // Check if property exists
        const property = await prisma.property.findUnique({
            where: { id: parseInt(propertyId) }
        });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Generate unique token
        const shareToken = uuidv4();

        // Create listing with custom description and title
        const listing = await prisma.propertyListing.create({
            data: {
                property_id: parseInt(propertyId),
                share_token: shareToken,
                created_by: userId || null,
                custom_title: title || null, // Save custom title
                custom_description: description || null, // Save custom text here
                expires_at: null
            }
        });

        res.json({
            success: true,
            listing,
            shareUrl: `/listing/${shareToken}`
        });
    } catch (error) {
        console.error('Error generating listing:', error);
        res.status(500).json({ error: 'Failed to generate listing' });
    }
};

const generateDescription = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { use_llm } = req.query;

        const property = await prisma.property.findUnique({
            where: { id: parseInt(propertyId) }
        });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (use_llm === 'true') {
            const pkg = await marketingService.generateMarketingPackage(property.id);
            return res.json({
                success: true,
                data: {
                    title: property.title,
                    description: pkg.premium_description,
                    package: pkg
                }
            });
        }

        const aiResult = await generatePropertyDescription(property);
        res.json({ success: true, data: aiResult });
    } catch (error) {
        console.error('AI Gen Error:', error);
        res.status(500).json({ error: error.message || 'AI description generation failed' });
    }
};

const getMarketingPackage = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const property = await prisma.property.findUnique({
            where: { id: parseInt(propertyId) }
        });

        if (!property) return res.status(404).json({ error: 'Property not found' });

        let pkg = property.metadata?.marketing_package;
        if (!pkg) {
            pkg = await marketingService.generateMarketingPackage(property.id);
        }

        res.json({ success: true, data: pkg });
    } catch (error) {
        console.error('Marketing Pkg Error:', error);
        res.status(500).json({ error: 'Failed to get marketing package' });
    }
};

// Get property listing by token (public endpoint)
const getListingByToken = async (req, res) => {
    try {
        const { token } = req.params;

        const listing = await prisma.propertyListing.findUnique({
            where: { share_token: token },
            include: {
                property: true
            }
        });

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Check if expired
        if (listing.expires_at && new Date(listing.expires_at) < new Date()) {
            return res.status(410).json({ error: 'Listing has expired' });
        }

        // Increment view count
        await prisma.propertyListing.update({
            where: { id: listing.id },
            data: { view_count: listing.view_count + 1 }
        });

        // Use custom marketing description if available, otherwise fallback to original
        const displayProperty = {
            ...listing.property,
            title: listing.custom_title || listing.property.title,
            description: listing.custom_description || listing.property.description
        };

        res.json({
            success: true,
            property: displayProperty,
            listing: {
                created_at: listing.created_at,
                view_count: listing.view_count + 1,
                custom_title: listing.custom_title,
                custom_description: listing.custom_description
            }
        });
    } catch (error) {
        console.error('Error fetching listing:', error);
        res.status(500).json({ error: 'Failed to fetch listing' });
    }
};

// Get all listings for a property
const getListingsByProperty = async (req, res) => {
    try {
        const { propertyId } = req.params;

        const listings = await prisma.propertyListing.findMany({
            where: { property_id: parseInt(propertyId) },
            orderBy: { created_at: 'desc' }
        });

        res.json({ success: true, listings });
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ error: 'Failed to fetch listings' });
    }
};

// Delete a listing
const deleteListing = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.propertyListing.delete({
            where: { id: parseInt(id) }
        });

        res.json({ success: true, message: 'Listing deleted' });
    } catch (error) {
        console.error('Error deleting listing:', error);
        res.status(500).json({ error: 'Failed to delete listing' });
    }
};

const getAppraisalPitch = async (req, res) => {
    try {
        const { propertyId } = req.params;

        // Use a mock response or internal call to get twins data (keeping it simple for now)
        // Alternatively, we can refactor propertyController to export the logic
        // But for this task, we can re-query or use a helper
        const property = await prisma.property.findUnique({ where: { id: parseInt(propertyId) } });
        if (!property) return res.status(404).json({ error: 'Property not found' });

        // Minimal twin logic to get market baseline for the pitch
        const size = Number(property.size_m2);
        const twins = await prisma.property.findMany({
            where: {
                id: { not: parseInt(propertyId) },
                status: 'active',
                neighborhood: property.neighborhood,
                district: property.district,
                category: property.category,
                rooms: property.rooms,
                size_m2: { gte: size * 0.7, lte: size * 1.3 }
            },
            select: { price: true, size_m2: true }
        });

        const targetPricePerM2 = size > 0 ? Number(property.price) / size : 0;
        let avgPricePerM2 = 0;
        if (twins.length > 0) {
            const sumPricePerM2 = twins.reduce((acc, t) => acc + (Number(t.price) / Number(t.size_m2)), 0);
            avgPricePerM2 = sumPricePerM2 / twins.length;
        }

        const twinsData = {
            market: {
                avg_price_per_m2: avgPricePerM2,
                deviation: avgPricePerM2 > 0 ? ((targetPricePerM2 - avgPricePerM2) / avgPricePerM2) * 100 : 0,
                sample_size: twins.length
            },
            target: { price: Number(property.price), price_per_m2: targetPricePerM2 }
        };

        const pitch = await marketingService.generateAppraisalPitch(property.id, twinsData);
        res.json({ success: true, data: pitch });
    } catch (error) {
        console.error('Appraisal Pitch Controller Error:', error);
        res.status(500).json({ error: 'Failed to generate appraisal pitch' });
    }
};

module.exports = {
    generateListing,
    getListingByToken,
    getListingsByProperty,
    deleteListing,
    generateDescription,
    getMarketingPackage,
    getAppraisalPitch
};
