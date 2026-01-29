const { Client } = require('pg');
require('dotenv').config();

async function fixSchema() {
    const connectionString = process.env.DATABASE_URL;
    console.log('Connecting to:', connectionString.split('@')[1]);

    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const tablesToFix = [
            {
                name: 'clients',
                columns: [
                    { name: 'profile_pic_url', type: 'TEXT' },
                    { name: 'ai_delegated', type: 'BOOLEAN DEFAULT false' },
                    { name: 'ai_summary', type: 'JSONB' },
                    { name: 'last_ai_interaction', type: 'TIMESTAMP WITH TIME ZONE' },
                    { name: 'priority_score', type: 'INTEGER DEFAULT 0' },
                    { name: 'last_intent_tag', type: 'TEXT' },
                    { name: 'last_sentiment', type: 'TEXT' },
                    { name: 'sentiment_history', type: 'JSONB' },
                    { name: 'next_best_action', type: 'TEXT' },
                    { name: 'is_stale', type: 'BOOLEAN DEFAULT false' },
                    { name: 'deleted_at', type: 'TIMESTAMP WITH TIME ZONE' }
                ]
            },
            {
                name: 'demands',
                columns: [
                    { name: 'embedding', type: 'JSONB' }
                ]
            },
            {
                name: 'users',
                columns: [
                    { name: 'google_refresh_token', type: 'TEXT' },
                    { name: 'google_access_token', type: 'TEXT' },
                    { name: 'google_token_expiry', type: 'TIMESTAMP WITH TIME ZONE' }
                ]
            }
        ];

        for (const table of tablesToFix) {
            console.log(`Checking table ${table.name}...`);
            for (const col of table.columns) {
                const checkRes = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = '${table.name}' AND column_name = '${col.name}';
                `);

                if (checkRes.rows.length === 0) {
                    console.log(`Table ${table.name}: Column ${col.name} is missing. Adding it...`);
                    try {
                        await client.query(`ALTER TABLE ${table.name} ADD COLUMN ${col.name} ${col.type};`);
                        console.log(`Column ${col.name} added successfully.`);
                    } catch (e) {
                        console.error(`Failed to add column ${col.name} to ${table.name}:`, e.message);
                    }
                } else {
                    console.log(`Table ${table.name}: Column ${col.name} already exists.`);
                }
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

fixSchema();
