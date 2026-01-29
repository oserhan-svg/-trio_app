const prisma = require('../db');

// Cost per 1M tokens (Approximate as of 2024/2025)
const PRICING = {
    'openai': {
        'gpt-4': { input: 30.00, output: 60.00 },
        'gpt-4o': { input: 5.00, output: 15.00 },
        'gpt-3.5-turbo': { input: 0.50, output: 1.50 }
    },
    'groq': {
        'llama3-70b-8192': { input: 0.59, output: 0.79 },
        'llama3-8b-8192': { input: 0.05, output: 0.10 },
        'mixtral-8x7b-32768': { input: 0.27, output: 0.27 }
    },
    'gemini': {
        'gemini-1.5-flash': { input: 0.35, output: 1.05 },
        'gemini-1.5-pro': { input: 3.50, output: 10.50 }
    }
};

/**
 * Log AI Usage to Database
 * @param {Object} params
 * @param {string} params.provider - 'openai', 'groq', 'gemini'
 * @param {string} params.model - Model name
 * @param {number} params.tokensInput - Prompt tokens
 * @param {number} params.tokensOutput - Completion tokens
 * @param {string} params.context - 'chat', 'transcription', 'analysis'
 * @param {number} [params.userId] - Optional User ID
 * @param {number} [params.clientId] - Optional Client ID
 */
async function logUsage({ provider, model, tokensInput, tokensOutput, context, userId, clientId }) {
    try {
        await prisma.aIUsage.create({
            data: {
                provider,
                model,
                tokens_input: tokensInput || 0,
                tokens_output: tokensOutput || 0,
                total_tokens: (tokensInput || 0) + (tokensOutput || 0),
                context,
                user_id: userId,
                client_id: clientId
            }
        });
        // Console log for immediate visibility
        // console.log(`[AI-USAGE] ${provider}/${model} - ${tokensInput + tokensOutput} tokens (${context})`);
    } catch (error) {
        console.error('[AI-USAGE] Failed to log usage:', error.message);
    }
}

/**
 * Get aggregated usage stats
 */
async function getUsageStats(startDate, endDate) {
    const stats = await prisma.aIUsage.groupBy({
        by: ['provider', 'model'],
        where: {
            created_at: {
                gte: startDate,
                lte: endDate
            }
        },
        _sum: {
            tokens_input: true,
            tokens_output: true,
            total_tokens: true
        }
    });

    // Calculate estimated cost
    return stats.map(s => {
        const price = PRICING[s.provider]?.[s.model];
        let cost = 0;
        if (price) {
            cost = ((s._sum.tokens_input / 1000000) * price.input) +
                ((s._sum.tokens_output / 1000000) * price.output);
        }
        return {
            ...s,
            estimated_cost_usd: cost.toFixed(4)
        };
    });
}

module.exports = {
    logUsage,
    getUsageStats
};
