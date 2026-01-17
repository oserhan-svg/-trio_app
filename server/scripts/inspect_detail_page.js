const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function inspect() {
    const prop = await prisma.property.findFirst({
        where: { url: { contains: 'hepsiemlak' } }
    });

    if (!prop) {
        console.log('No hepsiemlak property found.');
        return;
    }

    console.log('Inspecting URL:', prop.url);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(prop.url, { waitUntil: 'domcontentloaded' });

    // Dump typical selectors
    const data = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img')).map(i => i.src);
        const desc = document.querySelector('.description-content')?.innerText || 'No Desc';
        const classes = Array.from(document.querySelectorAll('*')).map(e => e.className).filter(c => typeof c === 'string' && c.includes('gallery'));
        return { images, desc, classes };
    });

    console.log(JSON.stringify(data, null, 2));
    await browser.close();
}

inspect();
