const { NlpManager } = require('node-nlp');
const fs = require('fs');
const path = require('path');

class TrainableAIService {
    constructor() {
        this.manager = new NlpManager({ languages: ['tr'], forceNER: true });
        this.modelPath = path.join(__dirname, '../ai_model/model.nlp');
        this.isTrained = false;

        this.initialize();
    }

    async initialize() {
        if (fs.existsSync(this.modelPath)) {
            await this.manager.load(this.modelPath);
            this.isTrained = true;
            console.log('AI Model loaded from disk.');
        } else {
            console.log('No AI model found. Using default training data...');
            await this.trainInitialModel();
        }
    }

    async trainInitialModel() {
        // --- 1. Intents: Greeting ---
        this.manager.addDocument('tr', 'merhaba', 'greeting');
        this.manager.addDocument('tr', 'selam', 'greeting');
        this.manager.addDocument('tr', 'iyi günler', 'greeting');
        this.manager.addDocument('tr', 'günaydın', 'greeting');
        this.manager.addAnswer('tr', 'greeting', 'Merhaba! Size nasıl yardımcı olabilirim?');
        this.manager.addAnswer('tr', 'greeting', 'Selamlar! Trio Emlak olarak hoş geldiniz.');

        // --- 2. Intents: Buying Property ---
        this.manager.addDocument('tr', 'ev arıyorum', 'prop.buy');
        this.manager.addDocument('tr', 'satılık daire var mı', 'prop.buy');
        this.manager.addDocument('tr', 'daire almak istiyorum', 'prop.buy');
        this.manager.addDocument('tr', '3+1 satılık', 'prop.buy');

        // --- 3. Intents: Selling Property ---
        this.manager.addDocument('tr', 'evimi satmak istiyorum', 'prop.sell');
        this.manager.addDocument('tr', 'dairemi satıcam', 'prop.sell');
        this.manager.addDocument('tr', 'ekspertiz yapıyor musunuz', 'prop.sell');

        // --- 4. Intents: Rental ---
        this.manager.addDocument('tr', 'kiralık ev', 'prop.rent');
        this.manager.addDocument('tr', 'kiralık daire arıyorum', 'prop.rent');

        // --- 5. FAQ: Commission ---
        this.manager.addDocument('tr', 'komisyon ne kadar', 'faq.commission');
        this.manager.addDocument('tr', 'hizmet bedeli nedir', 'faq.commission');
        this.manager.addAnswer('tr', 'faq.commission', 'Hizmet bedelimiz yasal oran olan %2 + KDV şeklindedir.');

        // --- 6. Calendar/Task Entities (Dates) --- 
        // node-nlp automatically extracts dates like "yarın", "haftaya", "20 ocak"

        await this.manager.train();
        this.manager.save(this.modelPath);
        this.isTrained = true;
        console.log('Initial AI Model trained and saved.');
    }

    async processMessage(message) {
        if (!this.isTrained) {
            await this.initialize();
        }

        const response = await this.manager.process('tr', message);

        // Extract Entities (Date, Time, Location, Number)
        const entities = response.entities.map(e => ({
            entity: e.entity,
            value: e.option || e.sourceText,
            resolution: e.resolution
        }));

        return {
            intent: response.intent,
            score: response.score,
            answer: response.answer, // Auto-generated answer if FAQ
            entities: entities,      // Dates, numbers, etc.
            sentiment: response.sentiment
        };
    }

    async addTrainingData(type, input, output) {
        // type: 'document' (input -> intent) or 'answer' (intent -> output)
        if (type === 'document') {
            this.manager.addDocument('tr', input, output); // input=phrase, output=intent
        } else if (type === 'answer') {
            this.manager.addAnswer('tr', input, output);   // input=intent, output=answer
        }

        await this.manager.train();
        this.manager.save(this.modelPath);
        return true;
    }
}

module.exports = new TrainableAIService();
