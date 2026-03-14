const prisma = require('../db');
const bcrypt = require('bcryptjs');

/**
 * 🛡️ Sentinel Security Fix:
 * Previously, this script used upsert() which reset the admin password on every server restart.
 * Now it checks if an admin exists first and only creates the initial admin if none are found.
 */
async function createAdmin() {
    try {
        const email = process.env.INITIAL_ADMIN_EMAIL;
        const password = process.env.INITIAL_ADMIN_PASSWORD;

        if (!email || !password) {
            console.warn('🛡️ Sentinel: INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD not set. Skipping initial admin creation check.');
            return;
        }

        // Check if ANY admin already exists to prevent overwriting passwords on restart
        const adminCount = await prisma.user.count({
            where: { role: 'admin' }
        });

        if (adminCount > 0) {
            // Admin already exists, do not overwrite anything
            return;
        }

        // Use 12 rounds for better security
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email: email,
                password_hash: hashedPassword,
                role: 'admin',
                name: 'System Admin'
            }
        });

        console.log('🛡️ Sentinel: Initial admin user created:', user.email);
    } catch (e) {
        console.error('Admin Creation Error:', e.message);
    }
}

module.exports = createAdmin;
