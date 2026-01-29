const path = require('path');
const fs = require('fs');
const aiConfig = require('../config/aiConfig');
const prisma = require('../db');

// Optional: OpenAI integration (currently commented out as per original)
// const OpenAI = require('openai'); 
// const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const getCompanyConfig = () => {
    try {
        const configPath = path.join(__dirname, '../config/companyConfig.json');
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.warn('Company config not found or invalid');
        return {};
    }
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Generates a property description using templates from config.
 * @param {object} property - The property object
 * @returns {Promise<object>} - generated title and description
 */
const generatePropertyDescription = async (property) => {
    const company = getCompanyConfig();
    const price = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(property.price);
    const m2 = property.size_m2 ? `${property.size_m2} m²` : '';
    const location = [property.neighborhood, property.district].filter(Boolean).join(', ');
    const rooms = property.rooms || '';
    const companyName = company.companyName || 'Trio Emlak';

    // Helper to replace placeholders
    const processTemplate = (template) => {
        return template
            .replace(/{location}/g, location)
            .replace(/{rooms}/g, rooms)
            .replace(/{m2}/g, m2)
            .replace(/{companyName}/g, companyName);
    };

    // 1. Hook
    const hook = processTemplate(getRandom(aiConfig.descriptionTemplates.hooks));

    // 2. Body
    const body = processTemplate(getRandom(aiConfig.descriptionTemplates.bodies));

    // 3. Features Highlight
    let featureText = "";
    if (property.features && property.features.length > 0) {
        // Filter unnecessary technical terms
        const readableFeatures = property.features.filter(f => !f.match(/ilan no|tarih|güncel/i)).slice(0, 5);
        if (readableFeatures.length > 0) {
            featureText = `\n\nÖne Çıkan Özellikler:\n` + readableFeatures.map(f => `✨ ${f}`).join('\n');
        }
    }

    // 4. Call to Action
    const cta = processTemplate(getRandom(aiConfig.descriptionTemplates.ctas));

    const description = `${hook}\n\n${body}${featureText}\n\n${cta}\n\n📞 İletişim & Randevu:\n${companyName}\n${company.companyPhone || ''}\n${company.companyPhone2 ? company.companyPhone2 + '\n' : ''}${company.companyWebsite || ''}`;

    // Removed artificial delay for performance
    // await new Promise(resolve => setTimeout(resolve, 800));

    // 5. Title Generation
    const title = processTemplate(getRandom(aiConfig.descriptionTemplates.titles));

    return {
        title: title,
        description: description
    };
};

/**
 * Evaluate a WhatsApp message using AI to determine lead quality and recommendations
 * Uses centralized configuration for easy tuning.
 * @param {string} messageContent - The content of the WhatsApp message
 * @param {object} contactInfo - Information about the contact (name, phone, etc.)
 * @param {array} conversationHistory - Previous messages in the conversation
 * @returns {Promise<object>} - AI evaluation result
 */
const evaluateWhatsAppMessage = async (messageContent, contactInfo = {}, conversationHistory = []) => {
    // Removed artificial delay
    // await new Promise(resolve => setTimeout(resolve, 300));

    const message = messageContent.toLowerCase();
    const rules = aiConfig.scoringRules;

    // Detect Intent
    let intent = 'other';
    let intentScore = 0;

    for (const [key, keywords] of Object.entries(aiConfig.intentKeywords)) {
        const matches = keywords.filter(kw => message.includes(kw)).length;
        if (matches > intentScore) {
            intentScore = matches;
            intent = key;
        }
    }

    // Calculate Lead Score (0-100)
    let leadScore = 0;

    // Base score for real estate intent
    if (intent !== 'other' && intent !== 'info') {
        leadScore += rules.baseIntent;
    } else if (intent === 'info') {
        leadScore += rules.infoIntent;
    }

    // Check for property type mentions
    let propertyTypeScore = 0;
    Object.values(aiConfig.propertyTypes).forEach(types => {
        if (types.some(t => message.includes(t))) {
            propertyTypeScore = rules.propertyType;
        }
    });
    leadScore += propertyTypeScore;

    // Urgency adds score
    if (aiConfig.urgencyHigh.some(kw => message.includes(kw))) {
        leadScore += rules.urgencyHigh;
    } else if (aiConfig.urgencyMedium.some(kw => message.includes(kw))) {
        leadScore += rules.urgencyMedium;
    }

    // Details/Budget mentioned
    const detailCount = aiConfig.detailIndicators.filter(kw => message.includes(kw)).length;
    leadScore += Math.min(detailCount * rules.detailPerItem, rules.detailMax);

    // Location mentioned
    if (aiConfig.locationIndicators.some(kw => message.includes(kw))) {
        leadScore += rules.location;
    }

    // Positive engagement
    if (aiConfig.positiveEngagement.some(kw => message.includes(kw))) {
        leadScore += rules.positive;
    }

    // Negative indicators reduce score
    if (aiConfig.negativeEngagement.some(kw => message.includes(kw))) {
        leadScore = Math.max(0, leadScore + rules.negative);
    }

    // Message length indicates engagement
    if (messageContent.length < 20) {
        leadScore += rules.lengthPenalty;
    } else if (messageContent.length > 100) {
        leadScore += rules.lengthBonus;
    }

    // Conversation history bonus
    if (conversationHistory.length >= 3) {
        leadScore += rules.historyBonus;
    }

    // Cap at 100
    leadScore = Math.min(100, Math.max(0, leadScore));

    // --- Dynamic Learning Bonus (Phase 2) ---
    try {
        const activeKnowledge = await prisma.aIKnowledge.findMany({
            where: { status: 'active' }
        });

        for (const k of activeKnowledge) {
            // Check if knowledge content or title keywords appear in message
            // Simple heuristic: if any word > 3 chars from title exists in message
            const keywords = k.title.split(' ').filter(w => w.length > 3);
            if (keywords.some(kw => message.includes(kw.toLowerCase()))) {
                leadScore += 5; // Knowledge match bonus
                console.log(`[AI LEARNING] Applied bonus from knowledge: ${k.title}`);
            }
        }
    } catch (dbErr) {
        console.warn('Knowledge fetch failed, skipping bonus scoring');
    }

    // Cap again after bonuses
    leadScore = Math.min(100, Math.max(0, leadScore));

    // Determine urgency
    let urgency = 'low';
    if (aiConfig.urgencyHigh.some(kw => message.includes(kw))) {
        urgency = 'high';
    } else if (aiConfig.urgencyMedium.some(kw => message.includes(kw)) || leadScore > rules.highScoreThreshold) {
        urgency = 'medium';
    }

    // Determine if this is a lead
    const isLead = leadScore >= rules.lowScoreThreshold && intent !== 'other';

    // Generate recommendation
    let recommendation = '';
    let suggestedAction = null;

    if (leadScore >= rules.highScoreThreshold) {
        recommendation = `⚡ Yüksek öncelikli müşteri! ${contactInfo.name || 'Kişi'} ${intent === 'buy' ? 'alıcı' : intent === 'sell' ? 'satıcı' : 'kiracı'} olarak tanımlandı. HEMEN arayın ve randevu ayarlayın.`;
        suggestedAction = 'call';
    } else if (leadScore >= rules.mediumScoreThreshold) {
        recommendation = `📞 Potansiyel müşteri. ${contactInfo.name || 'Kişi'} emlak konusunda aktif ilgi gösteriyor. Bugün içinde geri dönüş yapın ve ihtiyaçları detaylandırın.`;
        suggestedAction = 'call';
    } else if (leadScore >= rules.lowScoreThreshold) {
        recommendation = `📝 Takip gerekli. Müşteri ${intent === 'info' ? 'bilgi almak' : 'emlak aramak'} istiyor. Yarına hatırlatıcı koyun ve detaylı bilgi gönderin.`;
        suggestedAction = 'reminder';
    } else {
        recommendation = `ℹ️ Düşük öncelik. Genel bir soru veya ilgi. CRM'e not olarak ekleyin.`;
        suggestedAction = 'note';
    }

    // Generate summary
    const summary = messageContent.length > 100
        ? messageContent.substring(0, 97) + '...'
        : messageContent;

    return {
        isLead,
        leadScore,
        recommendation,
        suggestedAction,
        summary,
        intent,
        urgency,
        method: 'rule-based-v2' // V2 indicates optimized Config version
    };
};

module.exports = { generatePropertyDescription, evaluateWhatsAppMessage };
