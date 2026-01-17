const { query } = require('./db');

async function check() {
    try {
        const res = await query("SELECT id, title, rooms, district, neighborhood FROM properties WHERE title LIKE '%150%' OR neighborhood LIKE '%150%'");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
}
check();
