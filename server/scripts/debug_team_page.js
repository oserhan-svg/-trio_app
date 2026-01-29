const puppeteer = require('puppeteer-extra');
const fs = require('fs');

async function debugTeam() {
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        const pages = await browser.pages();
        const page = pages.find(p => p.url().includes('sahibinden')) || pages[0];

        console.log('Navigating to Team Page...');
        await page.goto('https://trioemlakvegayrimenkul.sahibinden.com/ekibimiz', { waitUntil: 'domcontentloaded' });

        console.log('Capturing HTML...');
        const html = await page.content();
        fs.writeFileSync('team_page_snapshot.html', html);
        console.log('Saved to team_page_snapshot.html');

        // Also log some probable classes
        const classes = await page.evaluate(() => {
            const all = document.querySelectorAll('*');
            const classCounts = {};
            all.forEach(el => {
                el.classList.forEach(c => {
                    classCounts[c] = (classCounts[c] || 0) + 1;
                });
            });
            return classCounts;
        });
        console.log('Top Classes:', Object.entries(classes).sort((a, b) => b[1] - a[1]).slice(0, 20));

        await browser.disconnect();

    } catch (e) {
        console.error(e);
    }
}

debugTeam();
