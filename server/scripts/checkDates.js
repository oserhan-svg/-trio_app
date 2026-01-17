const { query } = require('./db');

async function checkDates() {
    try {
        console.log('Checking recent property dates...');
        const res = await query('SELECT title, listing_date, last_scraped FROM properties ORDER BY last_scraped DESC LIMIT 10');
        console.table(res.rows);
    } catch (error) {
        console.error(error);
    }
}

checkDates();
