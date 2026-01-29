const OpenAI = require('openai');
const prisma = require('../db');

class OpenAIService {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            console.error('CRITICAL: OPENAI_API_KEY is missing!');
        }
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Define Tools
        this.tools = [
            {
                type: "function",
                function: {
                    name: "searchProperties",
                    description: "Search for real estate properties in the database.",
                    parameters: {
                        type: "object",
                        properties: {
                            location: { type: "string", description: "City or district name (e.g., Kadıköy)" },
                            minPrice: { type: "number", description: "Minimum price" },
                            maxPrice: { type: "number", description: "Maximum price" },
                            rooms: { type: "string", description: "Room count (e.g., 2+1, 3+1)" },
                            type: { type: "string", enum: ["sale", "rent"], description: "Property type" }
                        },
                        required: []
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "createCalendarEvent",
                    description: "Schedule a meeting or task in the calendar.",
                    parameters: {
                        type: "object",
                        properties: {
                            summary: { type: "string", description: "Title of the event" },
                            startTime: { type: "string", description: "ISO Date time for the event start" },
                            description: { type: "string", description: "Details about the meeting" }
                        },
                        required: ["summary", "startTime"]
                    }
                }
            }
        ];
    }

    async chat(userMessage) {
        try {
            const messages = [
                {
                    role: "system",
                    content: `You are 'Trio Asistan', a helpful real estate assistant for Trio Emlak.
Current Date: ${new Date().toISOString()}

Capabilities:
1. Search Portfolio: If user asks for properties, USE the 'searchProperties' tool.
2. Manage Calendar: If user implies a meeting (e.g., 'yarın görüşelim'), USE 'createCalendarEvent'.
3. General Q&A: Answer questions politely in Turkish.

Be professional, concise, and helpful. Always reply in Turkish.`
                },
                { role: "user", content: userMessage }
            ];

            // 1. Send Request to OpenAI
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages,
                tools: this.tools,
                tool_choice: "auto",
            });

            const responseMessage = completion.choices[0].message;

            // 2. Check for Function Calls
            if (responseMessage.tool_calls) {
                const toolCalls = responseMessage.tool_calls;
                messages.push(responseMessage); // Add assistant's tool call request to history

                for (const toolCall of toolCalls) {
                    const functionName = toolCall.function.name;
                    const functionArgs = JSON.parse(toolCall.function.arguments);
                    let functionResponse;

                    if (functionName === 'searchProperties') {
                        functionResponse = await this.executeSearchProperties(functionArgs);
                    } else if (functionName === 'createCalendarEvent') {
                        functionResponse = await this.executeCreateEvent(functionArgs);
                    }

                    // Add function result to history
                    messages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: functionName,
                        content: JSON.stringify(functionResponse)
                    });
                }

                // 3. Get Final Response from OpenAI
                const secondResponse = await this.openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: messages,
                });

                return secondResponse.choices[0].message.content;
            }

            return responseMessage.content;

        } catch (error) {
            console.error('OpenAI Error:', error);
            return `Hata oluştu: ${error.message}`;
        }
    }

    async executeSearchProperties(criteria) {
        console.log('Searching properties (OpenAI):', criteria);
        const where = {};

        if (criteria.location) {
            where.OR = [
                { city: { contains: criteria.location, mode: 'insensitive' } },
                { district: { contains: criteria.location, mode: 'insensitive' } },
                { neighborhood: { contains: criteria.location, mode: 'insensitive' } }
            ];
        }
        if (criteria.minPrice) where.price = { ...where.price, gte: criteria.minPrice };
        if (criteria.maxPrice) where.price = { ...where.price, lte: criteria.maxPrice };
        if (criteria.rooms) where.rooms = { contains: criteria.rooms };

        try {
            const properties = await prisma.property.findMany({
                where,
                take: 5,
                select: { title: true, price: true, location: true, rooms: true }
            });

            if (properties.length === 0) return "Kriterlere uygun ilan bulunamadı.";
            return properties;
        } catch (error) {
            console.error('DB Error:', error);
            return "Veritabanı hatası.";
        }
    }

    async executeCreateEvent(details) {
        console.log('Creating event (Mock):', details);
        return { status: "success", message: `Randevu oluşturuldu: ${details.summary} (${details.startTime})` };
    }
}

module.exports = new OpenAIService();
