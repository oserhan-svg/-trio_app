const prisma = require('../db');
const groqService = require('./GroqService');
const fs = require('fs');

class LegalAssistantService {

    /**
     * Analyze a Tapu (Deed) or Legal Document image
     */
    async analyzeLegalDocument(filePath, documentType = 'TAPU') {
        console.log(`⚖️ AI Legal Analysis initiated for: ${documentType}`);

        try {
            // 1. Read image and encode as base64 for Groq Vision
            const base64Image = fs.readFileSync(filePath, { encoding: 'base64' });

            // 2. AI Vision Analysis
            const prompt = `
            Sen bir Gayrimenkul Hukuku Uzmanısın ve Türkiye'deki TAPU (Deed) belgelerini analiz ediyorsun.
            Aşağıdaki görseli incele ve şu bilgileri JSON formatında çıkar:
            
            1. Ada/Parsel No
            2. Mülkiyet Tipi (Kat Mülkiyeti, Kat İrtifakı, Arsa Paylı vb.)
            3. Bağımsız Bölüm No
            4. Malik (Sahip) Bilgisi (Maskelenmiş olarak)
            5. Şerh/Beyan/İpotek Var mı? (Eğer görünüyorsa)
            6. Tapu Alanı (m2)
            
            RISK ANALIZI:
            - Belgede ipotek veya haciz şerhi görünüyorsa "Risk: Yüksek" olarak işaretle.
            - İmar tipi arsa olup üzerinde bina varsa ama kat mülkiyeti kurulmamışsa uyar.
            
            JSON format:
            {
              "docInfo": { "ada": "", "parsel": "", "type": "", "m2": "" },
              "risks": [ { "level": "low/med/high", "description": "" } ],
              "summary": "Tek cümlelik profesyonel özet",
              "actionNeeded": "Danışmanın yapması gereken bir sonraki hukuki adım"
            }
            `;

            const response = await groqService.groq.chat.completions.create({
                model: "llama-3.2-11b-vision-preview",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                            }
                        ]
                    }
                ],
                temperature: 0.1, // High precision needed
                response_format: { type: "json_object" }
            });

            const analysis = JSON.parse(response.choices[0].message.content);

            return {
                timestamp: new Date(),
                documentType,
                ...analysis
            };

        } catch (error) {
            console.error('Legal AI Analysis Error:', error);
            throw error;
        }
    }

    async saveAnalysisToProperty(propertyId, analysis) {
        // Find or create property listing for metadata storage
        const listing = await prisma.propertyListing.findFirst({
            where: { property_id: parseInt(propertyId) }
        });

        const legalMetadata = {
            last_legal_check: new Date(),
            analysis: analysis
        };

        if (listing) {
            await prisma.propertyListing.update({
                where: { id: listing.id },
                data: {
                    marketing_content: {
                        ...(listing.marketing_content || {}),
                        legal_check: legalMetadata
                    }
                }
            });
        }

        return legalMetadata;
    }
}

module.exports = new LegalAssistantService();
