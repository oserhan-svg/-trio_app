const prisma = require('../db');
const bcrypt = require('bcrypt');

const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                created_at: true
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(users);
    } catch (error) {
        console.error('getUsers error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const createUser = async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password and role are required' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password_hash,
                role
            },
            select: { id: true, email: true, role: true }
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('createUser error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, role, password } = req.body;

    try {
        const updateData = { email, role };

        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: { id: true, email: true, role: true }
        });

        res.json(user);
    } catch (error) {
        console.error('updateUser error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    const userId = parseInt(id);

    try {
        // Prevent deleting the last admin or yourself
        if (req.user.id === userId) {
            return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Delete agenda items
            await tx.agendaItem.deleteMany({ where: { user_id: userId } });

            // 2. Delete pending contacts
            await tx.pendingContact.deleteMany({ where: { consultant_id: userId } });

            // 3. Unassign properties
            await tx.property.updateMany({
                where: { assigned_user_id: userId },
                data: { assigned_user_id: null }
            });

            // 4. Unassign clients
            await tx.client.updateMany({
                where: { consultant_id: userId },
                data: { consultant_id: null }
            });

            // 5. Finally delete the user
            await tx.user.delete({
                where: { id: userId }
            });
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('deleteUser error:', error);
        res.status(500).json({ error: 'Kullanıcı silinemedi. Üzerinde aktif kayıtlar olabilir.' });
    }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
