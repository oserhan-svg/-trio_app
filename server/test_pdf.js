const pdfService = require('./services/pdfService');
const fs = require('fs');
const path = require('path');

const mockProperty = {
    id: 999,
    title: 'Lüks Deniz Manzaralı Villa',
    price: 15500000,
    district: 'Ayvalık',
    neighborhood: 'Cunda (Alibey Adası)',
    rooms: '4+1',
    size_m2: 220,
    description: 'Ayvalık Cunda Adası merkezde, denize sıfır, özel havuzlu, geniş bahçeli ve muhteşem manzaralı satılık lüks villa. Akıllı ev sistemi, yerden ısıtma, jeneratör ve güvenlik sistemi mevcuttur. Trio Emlak güvencesiyle.',
    features: ['Özel Havuz', 'Deniz Manzarı', 'Akıllı Ev', 'Otopark', 'Güvenlik', 'Şömine', 'Geniş Teras', 'Yerden Isıtma'],
    url: 'https://trioemlak.com/ilan/999',
    images: [] // Will fallback to placeholder
};

async function testPdf() {
    console.log('📄 Testing PDF Generation...');
    try {
        const buffer = await pdfService.generatePropertyFlyer(mockProperty);

        if (buffer) {
            const outputPath = path.join(__dirname, 'test_flyer.pdf');
            fs.writeFileSync(outputPath, buffer);
            console.log(`✅ PDF Generated successfully: ${outputPath}`);
            console.log(`Size: ${buffer.length} bytes`);
        } else {
            console.error('❌ PDF Generation returned null/empty.');
        }

    } catch (error) {
        console.error('❌ PDF Test Failed:', error);
    } finally {
        await pdfService.close();
        process.exit();
    }
}

testPdf();
