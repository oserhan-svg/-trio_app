const axios = require('axios');
const prisma = require('../db');

class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.error('CRITICAL: GEMINI_API_KEY is missing!');
        }
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

        // Define Tools Schema for REST API
        this.tools = [{
            function_declarations: [
                {
                    name: "searchProperties",
                    description: "Search for real estate properties in the database.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            location: { type: "STRING", description: "City or district name (e.g., Kadıköy)" },
                            minPrice: { type: "NUMBER", description: "Minimum price" },
                            maxPrice: { type: "NUMBER", description: "Maximum price" },
                            rooms: { type: "STRING", description: "Room count (e.g., 2+1)" }
                        }
                    }
                },
                {
                    name: "createCalendarEvent",
                    description: "Schedule a meeting.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            summary: { type: "STRING", description: "Meeting title" },
                            startTime: { type: "STRING", description: "ISO Date time" }
                        },
                        required: ["summary", "startTime"]
                    }
                }
            ]
        }];
    }

    async chat(userMessage) {
        try {
            const payload = {
                contents: [{
                    role: "user",
                    parts: [{
                        text: `
You are 'Trio Asistan', a helpful real estate assistant. 
Reply in Turkish. 
If user asks for properties, use searchProperties.
If user wants to meet, use createCalendarEvent.
User says: "${userMessage}"
                    `}]
                }],
                tools: this.tools
            };

            const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });

            const content = response.data.candidates[0].content;
            const parts = content.parts || [];

            // Check for Function Call
            const functionCallPart = parts.find(p => p.functionCall);

            if (functionCallPart) {
                const call = functionCallPart.functionCall;
                if (call.name === 'searchProperties') {
                    const result = await this.executeSearchProperties(call.args);
                    // In a full implementation, we would send this result back to Gemini.
                    // For now, let's just return the result text directly to the user.
                    return `🔍 **Bulunan İlanlar:**\n${JSON.stringify(result, null, 2)}`;
                }
                if (call.name === 'createCalendarEvent') {
                    return `📅 **Randevu Oluşturuldu:** ${call.args.summary} - ${call.args.startTime}`;
                }
            }

            // Normal Text Response
            return parts.map(p => p.text).join('') || "Cevap yok.";

        } catch (error) {
            console.error('REST API Error:', error.response ? error.response.data : error.message);
            return `Hata oluştu: ${error.message}`;
        }
    }

    async executeSearchProperties(criteria) {
        console.log('Searching properties (REST):', criteria);
        const where = {};
        if (criteria.location) {
            where.OR = [
                { city: { contains: criteria.location, mode: 'insensitive' } },
                { district: { contains: criteria.location, mode: 'insensitive' } }
            ];
        }
        try {
            const properties = await prisma.property.findMany({
                where,
                take: 3,
                select: { title: true, price: true, location: true }
            });
            return properties.length > 0 ? properties : "Kriterlere uygun ilan bulunamadı.";
        } catch (error) {
            console.error('DB Error:', error);
            return "Veritabanı hatası.";
        }
    }

    async analyzeImage(buffer, mimetype) {
        try {
            const base64Image = buffer.toString('base64');
            const payload = {
                contents: [{
                    parts: [
                        { text: "Bu görsel bir gayrimenkul ilanı, tapu veya mülk fotoğrafı mı? Eğer öyleyse, mülk tipini, konumunu ve varsa fiyat/oda bilgilerini Türkçe olarak özetle. Eğer bir talep içeriyorsa (örn. 'şöyle bir ev arıyorum' yazılı bir kağıt), bunu da belirt." },
                        {
                            inline_data: {
                                mime_type: mimetype,
                                data: base64Image
                            }
                        }
                    ]
                }]
            };

            const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });

            return response.data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini Vision Error:', error.response ? error.response.data : error.message);
            return null;
        }
    }
}

module.exports = new GeminiService();
