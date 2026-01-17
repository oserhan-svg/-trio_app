const { query } = require('./db');

async function checkNeighborhoods() {
    try {
        const res = await query('SELECT neighborhood, count(*) as count FROM properties GROUP BY neighborhood');
        console.table(res.rows);
    } catch (error) {
        console.error(error);
    }
}

checkNeighborhoods();
