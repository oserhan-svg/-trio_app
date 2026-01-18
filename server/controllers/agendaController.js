const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get agenda items
exports.getAgendaItems = async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const { start, end } = req.query;

        let whereClause = {};

        // Date range filter
        if (start && end) {
            whereClause.start_at = {
                gte: new Date(start),
                lte: new Date(end),
            };
        }

        // Permission logic:
        // Admin: Sees everything
        // Consultant: Sees their own OR global ones
        if (role !== 'admin') {
            whereClause.OR = [
                { user_id: userId },
                { is_global: true }
            ];
        }

        const items = await prisma.agendaItem.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { id: true, email: true, role: true }
                },
                client: {
                    select: { id: true, name: true }
                },
                property: {
                    select: { id: true, title: true, district: true }
                }
            },
            orderBy: {
                start_at: 'asc'
            }
        });

        res.json(items);
    } catch (error) {
        console.error('Error fetching agenda items:', error);
        res.status(500).json({ message: 'Ajanda kayıtları getirilirken hata oluştu.' });
    }
};

// Create agenda item
exports.createAgendaItem = async (req, res) => {
    try {
        const { title, description, start_at, end_at, type, status, is_global, client_id, property_id } = req.body;
        const userId = req.user.id;

        const newItem = await prisma.agendaItem.create({
            data: {
                title,
                description,
                start_at: new Date(start_at),
                end_at: end_at ? new Date(end_at) : null,
                type,
                status: status || 'pending',
                is_global: !!is_global,
                user_id: userId,
                client_id: (client_id && client_id !== '') ? parseInt(client_id) : null,
                property_id: (property_id && property_id !== '') ? parseInt(property_id) : null
            },
            include: {
                user: { select: { email: true } },
                client: { select: { name: true } }
            }
        });

        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error creating agenda item:', error);
        res.status(500).json({ message: 'Ajanda kaydı oluşturulamadı.' });
    }
};

// Update agenda item
exports.updateAgendaItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, start_at, end_at, type, status, is_global, client_id, property_id } = req.body;
        const { id: userId, role } = req.user;

        // Check ownership (only owners or admins can update)
        const existing = await prisma.agendaItem.findUnique({ where: { id: parseInt(id) } });

        if (!existing) {
            return res.status(404).json({ message: 'Kayıt bulunamadı.' });
        }

        if (existing.user_id !== userId && role !== 'admin') {
            return res.status(403).json({ message: 'Bu kaydı düzenleme yetkiniz yok.' });
        }

        const updated = await prisma.agendaItem.update({
            where: { id: parseInt(id) },
            data: {
                title,
                description,
                start_at: start_at ? new Date(start_at) : undefined,
                end_at: end_at ? new Date(end_at) : undefined,
                type,
                status,
                is_global: is_global !== undefined ? !!is_global : undefined,
                client_id: client_id !== undefined ? (client_id && client_id !== '' ? parseInt(client_id) : null) : undefined,
                property_id: property_id !== undefined ? (property_id && property_id !== '' ? parseInt(property_id) : null) : undefined
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating agenda item:', error);
        res.status(500).json({ message: 'Ajanda kaydı güncellenemedi.' });
    }
};

// Delete agenda item
exports.deleteAgendaItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId, role } = req.user;

        const existing = await prisma.agendaItem.findUnique({ where: { id: parseInt(id) } });

        if (!existing) {
            return res.status(404).json({ message: 'Kayıt bulunamadı.' });
        }

        if (existing.user_id !== userId && role !== 'admin') {
            return res.status(403).json({ message: 'Bu kaydı silme yetkiniz yok.' });
        }

        await prisma.agendaItem.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Kayıt başarıyla silindi.' });
    } catch (error) {
        console.error('Error deleting agenda item:', error);
        res.status(500).json({ message: 'Ajanda kaydı silinemedi.' });
    }
};
