require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    if (!process.env.GEMINI_API_KEY) {
        console.error('API Key missing');
        return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        console.log('Fetching available models...');
        // Note: genAI.getGenerativeModel is for usage, checking unrelated method for listing if available in SDK
        // The SDK might not expose listModels directly easily on the main instance, 
        // but let's try a direct fetch if sdk doesn't make it obvious, 
        // actually looking at SDK docs, usually it is a separate manager or just standard catch-all.

        // Alternative: Use a known valid 'gemini-1.5-flash' and print if it fails.
        // Actually, let's just try to hit the API endpoint using fetch to see raw output.

        const key = process.env.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            console.log('\n✅ AVAILABLE MODELS:');
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
                }
            });
        } else {
            console.error('Error listing models:', data);
        }

    } catch (error) {
        console.error('Script Error:', error);
    }
}

listModels();
