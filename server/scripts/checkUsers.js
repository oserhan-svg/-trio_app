const { query } = require('./db');
const bcrypt = require('bcryptjs');

async function checkUsers() {
    try {
        const res = await query('SELECT * FROM users');
        console.log('Users found:', res.rows.length);
        console.table(res.rows);

        // Verify password for admin
        if (res.rows.length > 0) {
            const user = res.rows[0];
            const isMatch = await bcrypt.compare('password', user.password);
            console.log(`Password 'password' matches for ${user.username}:`, isMatch);
        }
    } catch (e) {
        console.error(e);
    }
}
checkUsers();
