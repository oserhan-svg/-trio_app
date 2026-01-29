const GroqService = require('../services/GroqService');

async function debugCaption() {
    console.log('Testing GroqService.generateSocialCaption...');

    const mockProperty = {
        title: "Test Villa",
        price: 5000000,
        district: "Ayvalık",
        neighborhood: "Cunda",
        rooms: "4+1",
        size_m2: 200
    };

    try {
        const caption = await GroqService.generateSocialCaption(mockProperty, 'instagram');
        console.log('SUCCESS:');
        console.log(caption);
    } catch (error) {
        console.error('CRITICAL ERROR:');
        console.error(error);
    }
}

debugCaption();
