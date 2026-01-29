const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'emlak22.db');
console.log('Opening SQLite DB:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening DB:', err.message);
        return;
    }
    console.log('Connected to emlak22.db');
});

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
        if (err) {
            console.error(err.message);
            return;
        }
        console.log('Tables:', tables.map(t => t.name).join(', '));

        if (tables.some(t => t.name === 'clients')) {
            db.all("SELECT COUNT(*) as count FROM clients", (err, rows) => {
                if (err) console.error(err.message);
                else console.log('Client Count in SQLite:', rows[0].count);

                if (rows[0].count > 0) {
                    db.all("SELECT * FROM clients LIMIT 10", (err, clients) => {
                        if (err) console.error(err.message);
                        else console.log('Sample Clients from SQLite:', JSON.stringify(clients, null, 2));
                    });
                }
            });
        }
    });
});

db.close();
