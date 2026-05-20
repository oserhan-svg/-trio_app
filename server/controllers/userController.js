const prisma = require('../db');
const bcrypt = require('bcrypt');

const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
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
    const { email, password, role, name } = req.body;

    if (!email || !password || !role || !name) {
        return res.status(400).json({ error: 'Ad Soyad, email, şifre ve rol zorunludur.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Bu kullanıcı zaten mevcut.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password_hash,
                role
            },
            select: { id: true, email: true, name: true, role: true }
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('createUser error:', error);
        res.status(500).json({ error: 'Kullanıcı oluşturulamadı.' });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, role, password, name } = req.body;

    // Security: Sanitize req.body in logs to exclude sensitive fields
    const { password: _, token: __, credit_card: ___, ...safeBody } = req.body;
    console.log(`[UPDATE USER] ID: ${id}, Body:`, safeBody);

    try {
        const updateData = {};

        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (name !== undefined) updateData.name = name;

        if (password && password.trim() !== '') {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: { id: true, email: true, name: true, role: true }
        });

        console.log('[UPDATE SUCCESS] User:', user);
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
