const { query } = require('./db');

async function check() {
    try {
        const res = await query("SELECT COUNT(*) as count FROM properties WHERE district LIKE '%150%' OR neighborhood LIKE '%150%' OR url LIKE '%150%'");
        console.log('150 Evler Count:', res.rows[0].count);

        const samples = await query("SELECT title, url FROM properties WHERE district LIKE '%150%' OR neighborhood LIKE '%150%' OR url LIKE '%150%' LIMIT 5");
        console.table(samples.rows);
    } catch (e) {
        console.error(e);
    }
}

check();
