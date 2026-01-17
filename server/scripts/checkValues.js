const { query } = require('./db');

async function checkValues() {
    try {
        console.log('--- Distinct Rooms ---');
        const rooms = await query('SELECT DISTINCT rooms FROM properties');
        console.table(rooms.rows);

        console.log('--- Distinct Neighborhoods ---');
        const hoods = await query('SELECT DISTINCT neighborhood FROM properties');
        console.table(hoods.rows);

        console.log('--- Distinct Districts ---');
        const districts = await query('SELECT DISTINCT district FROM properties');
        console.table(districts.rows);

    } catch (e) {
        console.error(e);
    }
}
checkValues();
