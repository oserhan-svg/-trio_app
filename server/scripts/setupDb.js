const { query } = require('./db');
const bcrypt = require('bcrypt');

async function setupDatabase() {
    try {
        console.log('Setting up SQLite database...');

        // Users Table
        await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'consultant')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Properties Table
        await query(`
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        external_id TEXT UNIQUE,
        title TEXT NOT NULL,
        price REAL NOT NULL,
        size_m2 REAL,
        rooms TEXT,
        district TEXT,
        neighborhood TEXT,
        url TEXT NOT NULL,
        seller_phone TEXT,
        last_scraped DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Property History Table
        await query(`
      CREATE TABLE IF NOT EXISTS property_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER,
        price REAL NOT NULL,
        change_type TEXT,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
      )
    `);

        // Indexes
        await query(`CREATE INDEX IF NOT EXISTS idx_properties_external_id ON properties(external_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_properties_last_scraped ON properties(last_scraped)`);

        console.log('Tables created.');

        // Seed Admin
        const users = await query('SELECT * FROM users WHERE email = ?', ['admin@emlak22.com']);
        if (users.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await query('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
                ['admin@emlak22.com', hashedPassword, 'admin']
            );
            console.log('Default admin created.');
        } else {
            console.log('Admin already exists.');
        }

    } catch (error) {
        console.error('Error setup:', error);
    }
}

setupDatabase();
