const puppeteer = require('puppeteer-real-browser'); // Using real browser for better rendering & stability if needed, or standard puppeteer
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

class PdfService {
    constructor() {
        this.browser = null;
    }

    async initBrowser() {
        if (!this.browser) {
            // Use standard puppeteer launch if real-browser is too heavy or complex for simple PDF
            // But preserving "puppeteer-real-browser" usage from package.json if that's the preferred lib
            // Actually, for PDF generation, standard puppeteer is usually safer/cleaner. 
            // Let's check package.json again. It has both "puppeteer" and "puppeteer-real-browser".
            // We'll use "puppeteer" for PDF generation to avoid "real browser" overhead unless scraping.
            const puppeteerLib = require('puppeteer');
            this.browser = await puppeteerLib.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
    }

    async generatePropertyFlyer(property) {
        try {
            await this.initBrowser();
            const page = await this.browser.newPage();

            // 1. Load Template
            const templatePath = path.join(__dirname, '../templates/propertyFlyer.html');
            let html = fs.readFileSync(templatePath, 'utf8');

            // 2. Generate QR Code
            const qrCodeData = await QRCode.toDataURL(property.url || `https://trioemlak.com/property/${property.id}`);

            // 3. Replace Placeholders
            const safe = (val) => val || '';
            const currency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);

            html = html
                .replace('{{TITLE}}', safe(property.title))
                .replace('{{PRICE}}', currency(property.price))
                .replace('{{DISTRICT}}', safe(property.district))
                .replace('{{NEIGHBORHOOD}}', safe(property.neighborhood))
                .replace('{{ROOMS}}', safe(property.rooms))
                .replace('{{SIZE}}', safe(property.size_m2))
                .replace('{{DESCRIPTION}}', safe(property.description).substring(0, 300) + '...')
                .replace('{{MAIN_IMAGE}}', property.images?.[0] ? `http://localhost:3000${property.images[0]}` : 'https://placehold.co/800x600?text=No+Image') // Assuming local server serves images
                .replace('{{QR_CODE}}', qrCodeData)
                .replace('{{DATE}}', new Date().toLocaleDateString('tr-TR'));

            // Handle Features List
            const featuresHtml = (property.features || []).slice(0, 8).map(f => `<li>${f}</li>`).join('');
            html = html.replace('{{FEATURES}}', featuresHtml);

            // 4. Set Content
            await page.setContent(html, { waitUntil: 'networkidle0' });

            // 5. Generate PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
            });

            await page.close();
            return pdfBuffer;

        } catch (error) {
            console.error('PDF Generation Error:', error);
            return null;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

module.exports = new PdfService();
