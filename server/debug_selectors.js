const puppeteer = require('puppeteer-extra');

async function debugSelectors() {
    console.log('🔍 Debugging Selectors on User Browser...');
    let browser;
    try {
        browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
    } catch (e) { console.error('Connect failed:', e); return; }

    const pages = await browser.pages();
    const page = pages.find(p => p.url().includes('sahibinden.com'));

    if (!page) {
        console.error('❌ No Sahibinden page found!');
        browser.disconnect();
        return;
    }

    console.log(`📄 Analyzing Page: ${page.url()}`);

    const nameMatch = await page.evaluate(() => {
        const all = document.querySelectorAll('*');
        const matches = [];
        for (const el of all) {
            // Check for direct text content ignoring extra whitespace
            // We look for "Kanat" or "Raif" or any name part
            if (el.children.length === 0 && el.textContent && el.textContent.includes('Kanat')) {
                matches.push({
                    tag: el.tagName,
                    class: el.className,
                    text: el.textContent.trim(),
                    parentClass: el.parentElement ? el.parentElement.className : 'NONE',
                    grandParentClass: el.parentElement && el.parentElement.parentElement ? el.parentElement.parentElement.className : 'NONE',
                    // path from user-info-module
                    closestUserInfo: el.closest('.user-info-module') ? 'YES' : 'NO'
                });
            }
        }
        return matches;
    });

    console.log('--- SPECIFIC NAME MATCHES ---');
    console.log(JSON.stringify(nameMatch, null, 2));

    browser.disconnect();
}

debugSelectors();
