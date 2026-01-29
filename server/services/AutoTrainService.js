const prisma = require('../db');
const Groq = require('groq-sdk');

class AutoTrainService {
    constructor() {
        if (process.env.GROQ_API_KEY) {
            this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        }
    }

    async runNightlyAnalysis() {
        console.log('Running Auto-Train Analysis...');
        try {
            // 1. Fetch sessions from last 24h with potential negative feedback
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const sessions = await prisma.aIChatSession.findMany({
                where: {
                    updated_at: { gte: yesterday },
                    messages: {
                        some: {
                            role: 'user',
                            content: { contains: 'yanlış', mode: 'insensitive' } // Basic keyword filter
                        }
                    }
                },
                include: {
                    messages: { orderBy: { created_at: 'asc' } }
                }
            });

            console.log(`Found ${sessions.length} sessions to analyze.`);

            for (const session of sessions) {
                await this.analyzeSession(session);
            }

            // 2. Analyze Test Failures
            await this.analyzeTestFailures();

            // 3. Run AI Optimization (Deal/WhatsApp Correlation & Memory)
            const aiLearningService = require('./aiLearningService');
            await aiLearningService.runOptimization();

            // 4. Run Proactive Follow-ups
            const proactiveAIService = require('./proactiveAIService');
            await proactiveAIService.runProactiveFollowups();
            await proactiveAIService.checkNewMatchesForDelegatedClients();
            await proactiveAIService.automatedNurturingFlow();

            // 5. Detect Stale Leads
            await aiLearningService.detectStaleLeads();

        } catch (error) {
            console.error('AutoTrain Error:', error);
        }
    }

    async analyzeSession(session) {
        // Find specific interaction where user said "wrong"
        const messages = session.messages;
        const negativeIndices = messages
            .map((m, i) => (m.role === 'user' && /yanlış|hayır öyle değil|hatalı|uydurma/i.test(m.content)) ? i : -1)
            .filter(i => i !== -1);

        for (const idx of negativeIndices) {
            if (idx === 0) continue; // No previous context

            const userCorrection = messages[idx].content;
            const aiMistake = messages[idx - 1].content;

            // 2. Ask AI to formulate a rule
            const reflectionPrompt = `
ANALİZ EDİLECEK KONUŞMA:
AI: "${aiMistake}"
USER (Düzeltme): "${userCorrection}"

GÖREV:
Yukarıdaki konuşmada AI bir hata yapmış veya kullanıcı tarafından düzeltilmiş.
Bu hatayı gelecekte TÖRPÜLEMEK için tek cümlelik net bir kural/talimat (instruction) yaz.
Sadece kuralı yaz. Örnek: "1. Etap aidatları hakkında soru gelirse 1500 TL olduğunu belirt."
            `;

            try {
                const completion = await this.groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "system", content: "Sen bir AI eğitmenisin." }, { role: "user", content: reflectionPrompt }],
                    temperature: 0.1
                });

                const newRule = completion.choices[0].message.content.trim();

                // 3. Save to Knowledge Base
                if (newRule && newRule.length > 10) {
                    await prisma.aIKnowledge.create({
                        data: {
                            category: 'instruction',
                            title: `Oto-Ders (Session #${session.id})`,
                            content: newRule,
                            status: 'active'
                        }
                    });
                    console.log(`New Rule Learned: ${newRule}`);
                }

            } catch (err) {
                console.error('Analysis failed for session ' + session.id, err);
            }
        }
    }

    async analyzeTestFailures() {
        console.log('Analyzing Validation Failures...');
        try {
            // Fetch failed tests from last 24h
            const yesterdaysDate = new Date();
            yesterdaysDate.setDate(yesterdaysDate.getDate() - 1);

            const failures = await prisma.aITestResult.findMany({
                where: {
                    is_success: false,
                    created_at: { gte: yesterdaysDate }
                },
                include: { test_case: true }
            });

            if (failures.length === 0) {
                console.log('No recent test failures to analyze.');
                return;
            }

            for (const fail of failures) {
                const prompt = `
HATALI TEST DURUMU:
Girdi (User): "${fail.test_case.input_message}"
Beklenen Niyet/Keywords: "${fail.test_case.expected_intent || fail.test_case.expected_keywords.join(', ')}"
AI Yanıtı (Hatalı): "${fail.actual_response}"
Hata Mesajı: "${fail.error_message || 'Validasyon başarısız'}"

GÖREV:
AI'ın bu girdiye doğru yanıt vermesini sağlamak için SİSTEM TALİMATINA (System Prompt) eklenecek TEK CÜMLELİK, NET bir kural yaz.
Kural genel geçer olmalı.

Örnek: "Kullanıcı 'fiyatlar' dediğinde veritabanından en ucuz ve en pahalı ilanı kontrol et."
                `;

                const completion = await this.groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "system", content: "Sen AI sistemlerini debug eden uzman bir mühendissin." }, { role: "user", content: prompt }],
                    temperature: 0.1
                });

                const fixRule = completion.choices[0].message.content.trim();

                if (fixRule && fixRule.length > 10) {
                    // Check if we already have a similar rule to avoid duplicates? (Skipped for now)

                    await prisma.aIKnowledge.create({
                        data: {
                            category: 'fix',
                            title: `Test Fix (Case #${fail.test_case.id})`,
                            content: fixRule,
                            status: 'active'
                        }
                    });
                    console.log(`[AUTO-FIX] New Rule for Test #${fail.test_case.id}: ${fixRule}`);
                }
            }

        } catch (error) {
            console.error('Test Failure Analysis Error:', error);
        }
    }
}

module.exports = new AutoTrainService();
