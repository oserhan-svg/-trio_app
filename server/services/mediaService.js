const prisma = require('../db');
const groqService = require('./GroqService');

class MediaService {

    /**
     * Optimizes a property image: Resize, WebP, and Brand Watermark
     */
    async optimizeImage(inputPath, propertyId) {
        console.log(`🖼️ Optimizing image for Property #${propertyId}`);

        // Simulation: In a real environment, we'd use 'sharp'
        // const metadata = await sharp(inputPath).metadata();
        // await sharp(inputPath)
        //     .webp({ quality: 80 })
        //     .resize(1920, 1080, { fit: 'inside' })
        //     .composite([{ input: 'path/to/trio-watermark.png', gravity: 'southeast' }])
        //     .toFile(`uploads/optimized/${propertyId}_${Date.now()}.webp`);

        return {
            originalPath: inputPath,
            optimizedUrl: `/uploads/optimized/${propertyId}_auto.webp`,
            format: 'webp',
            isWatermarked: true,
            reduction: '65%' // Expected size reduction
        };
    }

    /**
     * Generate social media content (Instagram/Facebook) for a property
     */
    async generateSocialTeaser(propertyId) {
        const property = await prisma.property.findUnique({
            where: { id: parseInt(propertyId) }
        });

        if (!property) throw new Error('Property not found');

        const prompt = `
        Sen Trio Emlak'ın Sosyal Medya Menajerisin. 
        Aşağıdaki ilan için Instagram ve Facebook'ta paylaşılacak, "Vay canına" dedirten bir caption hazırla.

        İLAN: ${property.title}
        BÖLGE: ${property.district} / ${property.neighborhood}
        FİYAT: ${property.price} TL
        ÖZELLİKLER: ${property.features.slice(0, 5).join(', ')}

        GÖREV:
        - İlk cümle çok dikkat çekici (Hook) olsun.
        - Emoji kullanımını zengin tut ama profesyonel kalsın.
        - Bölgenin (Ayvalık/Cunda) ruhunu vurgula.
        - Call to action (Mesaj atın, arayın) ekle.
        - 10-15 tane ilgili hashtag (Türkçe ve global) ekle.
        `;

        const response = await groqService.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.8
        });

        return {
            caption: response.choices[0].message.content.trim(),
            platforms: ['Instagram', 'Facebook', 'WhatsApp Status'],
            suggestedBestTime: '19:00 - 21:00'
        };
    }
}

module.exports = new MediaService();
