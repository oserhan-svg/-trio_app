const { query } = require('./db');
const bcrypt = require('bcrypt');

async function resetAdmin() {
    try {
        console.log('Resetting admin user...');

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Delete existing admin
        await query('DELETE FROM users WHERE email = ?', ['admin@emlak22.com']);

        // Create fresh admin
        await query(
            'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
            ['admin@emlak22.com', hashedPassword, 'admin']
        );

        console.log('Admin user reset successfully.');
        console.log('Email: admin@emlak22.com');
        console.log('Password: admin123');

        // Verify
        const res = await query('SELECT * FROM users WHERE email = ?', ['admin@emlak22.com']);
        console.log('User in DB:', res.rows[0]);

    } catch (error) {
        console.error('Error resetting admin:', error);
    }
}

resetAdmin();
