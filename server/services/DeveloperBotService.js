const prisma = require('../db');
const GroqService = require('./GroqService');
const { v4: uuidv4 } = require('uuid');

class DeveloperBotService {
    constructor() {
        this.isWorking = false;
        this.currentTask = null;
    }

    async logAction(action, status, message = null, metadata = null) {
        return await prisma.aIBotLog.create({
            data: { action, status, message, metadata }
        });
    }

    /**
     * Continuous Testing: Runs all golden test cases and compares responses
     */
    async runContinuousTests() {
        if (this.isWorking) return { error: "Bot is already busy." };

        this.isWorking = true;
        this.currentTask = "Testing";
        const runId = uuidv4();

        await this.logAction('test', 'running', `Starting test run: ${runId}`);

        try {
            const testCases = await prisma.aITestCase.findMany({ where: { is_golden: true } });
            let successCount = 0;

            for (const tc of testCases) {
                try {
                    // We call GroqService.chat but without persistence to not pollute history
                    const result = await GroqService.chat(tc.input_message, null, null);

                    const isSuccess = this.validateResponse(result, tc);
                    if (isSuccess) successCount++;

                    await prisma.aITestResult.create({
                        data: {
                            test_case_id: tc.id,
                            actual_response: result.content,
                            is_success: isSuccess,
                            score: isSuccess ? 100 : 0,
                            run_id: runId
                        }
                    });
                } catch (err) {
                    await prisma.aITestResult.create({
                        data: {
                            test_case_id: tc.id,
                            actual_response: "ERROR",
                            is_success: false,
                            error_message: err.message,
                            run_id: runId
                        }
                    });
                }
            }

            await this.logAction('test', 'success', `Run ${runId} completed. ${successCount}/${testCases.length} success.`, { runId, successCount, total: testCases.length });

            this.isWorking = false;
            return { runId, successCount, total: testCases.length };
        } catch (error) {
            await this.logAction('test', 'failed', error.message);
            this.isWorking = false;
            throw error;
        }
    }

    validateResponse(result, testCase) {
        // 1. Check Tool Intent
        if (testCase.expected_intent) {
            if (!result.toolCall || result.toolCall.tool !== testCase.expected_intent) {
                return false;
            }
        }

        // 2. Check Keywords in content (basic check)
        const content = result.content.toLowerCase();
        for (const kw of testCase.expected_keywords) {
            if (!content.includes(kw.toLowerCase())) {
                // If it's a tool call, maybe it's in the tool params?
                const toolParams = JSON.stringify(result.toolCall || {}).toLowerCase();
                if (!toolParams.includes(kw.toLowerCase())) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * AutoAudit: Analyzes past messages for hallucinations or errors
     */
    async autoAudit() {
        this.isWorking = true;
        this.currentTask = "Auditing";
        await this.logAction('audit', 'running', 'Analyzing recent interactions...');

        try {
            // Fetch last 50 messages
            const messages = await prisma.aIChatMessage.findMany({
                take: 50,
                orderBy: { created_at: 'desc' },
                include: { session: true }
            });

            if (messages.length === 0) {
                await this.logAction('audit', 'success', 'No messages to audit.');
                this.isWorking = false;
                return { audited: 0 };
            }

            // Group by session to provide context
            const sessions = {};
            messages.forEach(m => {
                if (!sessions[m.session_id]) sessions[m.session_id] = [];
                sessions[m.session_id].push(m);
            });

            let issueCount = 0;

            for (const sessionId of Object.keys(sessions)) {
                // Prepare transcript for analysis
                // We reverse because we fetched desc, but for reading we need asc (chronological)
                const transcript = sessions[sessionId]
                    .sort((a, b) => a.created_at - b.created_at)
                    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
                    .join('\n');

                const auditPrompt = `
GÖREV: Aşağıdaki sohbet kaydını analiz et ve AI (Assistant) tarafından yapılan SOMUT hataları tespit et.
Kritik olmayan nezaket veya stil konularını yoksay. Sadece "yanlış bilgi", "halüsinasyon" veya "kullanıcı talimatına uymama" durumlarını raporla.

SOHBET:
${transcript}

Eğer hata yoksa sadece "OK" yaz.
Eğer hata varsa, hatayı kısaca açıkla ve hatanın türünü belirt (HALLUCINATION, INSTRUCTION_FAIL, FACTUAL_ERROR).
                `;

                const analysis = await GroqService.chat(auditPrompt, [{ role: 'system', content: 'Sen kıdemli bir yazılım ve AI denetçisisin.' }], null);

                if (analysis.content !== 'OK' && !analysis.content.includes('OK')) {
                    issueCount++;
                    await this.logAction('audit', 'issue_found', `Issue in Session ${sessionId}: ${analysis.content.substring(0, 200)}`, { sessionId, analysis: analysis.content });
                }
            }

            await this.logAction('audit', 'success', `Audited ${messages.length} messages. Found ${issueCount} potential issues.`);
            this.isWorking = false;
            return { audited: messages.length, issueCount };
        } catch (error) {
            await this.logAction('audit', 'failed', error.message);
            this.isWorking = false;
            throw error;
        }
    }

    async getStatus() {
        const lastLogs = await prisma.aIBotLog.findMany({
            take: 10,
            orderBy: { created_at: 'desc' }
        });

        const lastResults = await prisma.aITestResult.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            include: { test_case: true }
        });

        return {
            isWorking: this.isWorking,
            currentTask: this.currentTask,
            lastLogs,
            lastResults
        };
    }
}

module.exports = new DeveloperBotService();
