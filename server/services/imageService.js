const puppeteer = require('puppeteer');

const generateStory = async (property) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Define viewport for Instagram Story (9:16)
        await page.setViewport({ width: 1080, height: 1920 });

        // Generate HTML Content
        const htmlContent = `
        <html>
            <body style="margin:0; padding:0; font-family: 'Arial', sans-serif; background: #f3f4f6; display: flex; flex-direction: column; height: 100vh;">
                <!-- Main Image Area -->
                <div style="flex: 1; background-color: #ddd; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                    ${property.url ? `<img src="https://via.placeholder.com/1080x1920?text=Emlak+Gorseli" style="width: 100%; height: 100%; object-fit: cover;" />` : ''}
                    
                    <div style="position: absolute; top: 50px; left: 50px; background: rgba(0,0,0,0.7); color: white; padding: 20px 40px; border-radius: 10px;">
                        <h1 style="font-size: 60px; margin: 0;">${property.neighborhood}</h1>
                        <h2 style="font-size: 40px; margin: 10px 0 0 0; font-weight: normal;">${property.district}</h2>
                    </div>

                    ${property.price < 2500000 ? `
                    <div style="position: absolute; top: 50px; right: 50px; background: #ef4444; color: white; padding: 20px 30px; border-radius: 10px; transform: rotate(15deg);">
                        <span style="font-size: 50px; font-weight: bold;">🔥 FIRSAT</span>
                    </div>
                    ` : ''}
                </div>

                <!-- Info Card -->
                <div style="height: 600px; background: white; padding: 60px; box-sizing: border-box; border-top-left-radius: 50px; border-top-right-radius: 50px; margin-top: -50px; position: relative;">
                    <h1 style="font-size: 70px; margin: 0 0 30px 0; color: #1f2937; line-height: 1.2;">
                        ${property.title.length > 50 ? property.title.substring(0, 50) + '...' : property.title}
                    </h1>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 50px;">
                        <div>
                            <span style="font-size: 40px; color: #6b7280; display: block;">Fiyat</span>
                            <span style="font-size: 60px; font-weight: bold; color: #2563eb;">${Number(property.price).toLocaleString('tr-TR')} TL</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 40px; color: #6b7280; display: block;">Özellikler</span>
                            <span style="font-size: 50px; color: #374151;">${property.rooms} | ${property.size_m2} m²</span>
                        </div>
                    </div>

                    <div style="background: #2563eb; color: white; text-align: center; padding: 40px; border-radius: 20px; font-size: 40px; font-weight: bold;">
                        📞 Detaylı Bilgi İçin Arayın
                    </div>
                </div>
            </body>
        </html>
        `;

        await page.setContent(htmlContent);
        const buffer = await page.screenshot({ type: 'jpeg', quality: 90 });

        return buffer;

    } catch (error) {
        console.error('Image generation error:', error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
};

module.exports = { generateStory };
