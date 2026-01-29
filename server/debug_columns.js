const { Client } = require('pg');
require('dotenv').config();

async function checkColumns() {
    const connectionString = process.env.DATABASE_URL;
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'clients'
            ORDER BY column_name;
        `);
        console.log('Columns in clients table:');
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkColumns();
