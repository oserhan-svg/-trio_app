const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const googleCalendarService = require('../services/googleCalendarService');

// Get agenda items
exports.getAgendaItems = async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const { start, end, search, type, status, client_id } = req.query;

        let whereClause = {};

        // Date range filter
        if (start && end) {
            whereClause.start_at = {
                gte: new Date(start),
                lte: new Date(end),
            };
        }

        // Search filter
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Type filter
        if (type && type !== 'all') {
            whereClause.type = type;
        }

        // Status filter
        if (status && status !== 'all') {
            whereClause.status = status;
        }

        // Client filter
        if (client_id) {
            whereClause.client_id = parseInt(client_id);
        }

        // Permission & Filtering logic
        if (role === 'admin') {
            // Admin can filter by specific user if provided in query, otherwise sees all
            if (req.query.user_id) {
                whereClause.user_id = parseInt(req.query.user_id);
            }
        } else {
            // Consultant: Sees their own OR global ones
            const permissionFilter = {
                OR: [
                    { user_id: userId },
                    { is_global: true }
                ]
            };

            if (whereClause.OR) {
                // If search already uses OR, we need to AND it with permissionFilter
                whereClause = {
                    AND: [
                        { OR: whereClause.OR },
                        permissionFilter
                    ]
                };
                if (whereClause.start_at) whereClause.AND.push({ start_at: whereClause.start_at });
                if (whereClause.type) whereClause.AND.push({ type: whereClause.type });
                if (whereClause.status) whereClause.AND.push({ status: whereClause.status });
                // Clean up root level
                delete whereClause.start_at;
                delete whereClause.type;
                delete whereClause.status;
                delete whereClause.OR;
            } else {
                whereClause.AND = [permissionFilter];
            }
        }

        // Parallelize internal DB fetch and Google Calendar check preparation
        const fetchInternalItems = prisma.agendaItem.findMany({
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

        const fetchUserGoogleToken = (role !== 'admin')
            ? prisma.user.findUnique({
                where: { id: userId },
                select: { google_refresh_token: true }
            })
            : Promise.resolve(null);

        let [items, user] = await Promise.all([fetchInternalItems, fetchUserGoogleToken]);

        // Fetch Google Calendar events if applicable
        if (user?.google_refresh_token && role !== 'admin') {
            try {
                const googleEvents = await googleCalendarService.listEvents(userId, start || new Date().toISOString());

                // Filter out events that are already in our DB (to avoid duplicates)
                const internalEventIds = new Set(items.map(item => item.google_event_id).filter(id => !!id));

                const externalEvents = googleEvents
                    .filter(gEvent => !internalEventIds.has(gEvent.id))
                    .map(gEvent => ({
                        id: `google_${gEvent.id}`,
                        title: gEvent.summary,
                        description: gEvent.description,
                        start_at: gEvent.start.dateTime || gEvent.start.date,
                        end_at: gEvent.end.dateTime || gEvent.end.date,
                        type: 'google_event',
                        status: 'confirmed',
                        user_id: userId,
                        google_event_id: gEvent.id,
                        is_external: true,
                        user: { email: 'Google Calendar' }
                    }));

                items = [...items, ...externalEvents];
                items.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
            } catch (gError) {
                console.error('Failed to fetch Google Calendar events for user:', userId, gError.message);
                // Continue with just internal items
            }
        }

        res.json(items);
    } catch (error) {
        console.error('Error fetching agenda items:', error);
        res.status(500).json({
            message: 'Ajanda kayıtları getirilirken hata oluştu.',
            error: error.message
        });
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

        // Sync with Google Calendar if connected
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { google_refresh_token: true }
            });

            if (user?.google_refresh_token) {
                const gEvent = await googleCalendarService.createEvent(userId, {
                    title: newItem.title,
                    description: newItem.description,
                    start_at: newItem.start_at,
                    end_at: newItem.end_at
                });

                if (gEvent && gEvent.id) {
                    await prisma.agendaItem.update({
                        where: { id: newItem.id },
                        data: { google_event_id: gEvent.id }
                    });
                    newItem.google_event_id = gEvent.id;
                }
            }
        } catch (gError) {
            console.error('Failed to sync new item with Google Calendar:', gError.message);
        }

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

        // Sync with Google Calendar if connected and has google_event_id
        if (updated.google_event_id) {
            try {
                await googleCalendarService.updateEvent(userId, updated.google_event_id, {
                    title: updated.title,
                    description: updated.description,
                    start_at: updated.start_at,
                    end_at: updated.end_at
                });
            } catch (gError) {
                console.error('Failed to update Google Calendar event:', gError.message);
            }
        }

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

        // Sync with Google Calendar if connected and has google_event_id
        if (existing.google_event_id) {
            try {
                await googleCalendarService.deleteEvent(userId, existing.google_event_id);
            } catch (gError) {
                console.error('Failed to delete Google Calendar event:', gError.message);
            }
        }

        await prisma.agendaItem.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Kayıt başarıyla silindi.' });
    } catch (error) {
        console.error('Error deleting agenda item:', error);
        res.status(500).json({ message: 'Ajanda kaydı silinemedi.' });
    }
};
