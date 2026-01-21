const prisma = require('../db');
const { stripHtml } = require('../utils/sanitize');

// Get Pending Contacts
const getPendingContacts = async (req, res) => {
    console.log('PendingContact: Request received for user ID:', req.user?.id);
    try {
        if (!req.user || !req.user.id) {
            console.error('PendingContact: No user ID in request');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await prisma.pendingContact.findMany({
            where: { consultant_id: req.user.id },
            orderBy: { created_at: 'desc' }
        });
        console.log(`PendingContact: Found ${result.length} records for user ${req.user.id}`);
        res.json(result);
    } catch (error) {
        console.error('PendingContact: Get Error:', error);
        res.status(500).json({ error: 'Listesi alınamadı' });
    }
};

// Approve (Convert to Client)
const approveContact = async (req, res) => {
    const { id } = req.params;
    console.log(`PendingContact: Approving ID ${id} for user ${req.user?.id}`);
    try {
        const pending = await prisma.pendingContact.findUnique({
            where: { id: parseInt(id) }
        });

        if (!pending) return res.status(404).json({ error: 'Kayıt bulunamadı' });

        // Check for existing client to avoid duplicates
        const existing = await prisma.client.findFirst({
            where: {
                phone: pending.phone,
                consultant_id: req.user.id
            }
        });

        if (existing) {
            // Already exists, just delete pending
            console.log('PendingContact: Duplicate found, deleting pending record');
            await prisma.pendingContact.delete({ where: { id: parseInt(id) } });
            return res.json({ message: 'Kişi zaten kayıtlıydı, listeden silindi.', status: 'duplicate' });
        }

        // Create Client
        const newClient = await prisma.client.create({
            data: {
                name: pending.name,
                phone: pending.phone,
                email: pending.email,
                notes: pending.notes,
                type: 'buyer',
                consultant_id: req.user.id
            }
        });

        // Delete Pending
        await prisma.pendingContact.delete({ where: { id: parseInt(id) } });
        console.log('PendingContact: Approved and created client:', newClient.id);

        res.json({ message: 'Kişi başarıyla müşterilere eklendi.', client: newClient });

    } catch (error) {
        console.error('Approve Error:', error);
        res.status(500).json({ error: 'Onaylama hatası' });
    }
};

// Bulk Approve
const bulkApprove = async (req, res) => {
    const { ids } = req.body; // Array of IDs
    console.log(`PendingContact: Bulk approving ${ids?.length} items`);
    try {
        // Fetch all pending
        const targets = await prisma.pendingContact.findMany({
            where: {
                id: { in: ids },
                consultant_id: req.user.id
            }
        });

        let added = 0;
        let skipped = 0;

        for (const t of targets) {
            const existing = await prisma.client.findFirst({
                where: { phone: t.phone, consultant_id: req.user.id }
            });

            if (!existing) {
                await prisma.client.create({
                    data: {
                        name: t.name,
                        phone: t.phone,
                        email: t.email,
                        notes: t.notes,
                        type: 'buyer',
                        consultant_id: req.user.id
                    }
                });
                added++;
            } else {
                skipped++;
            }
        }

        // Delete processed
        await prisma.pendingContact.deleteMany({
            where: { id: { in: ids } }
        });

        console.log(`PendingContact: Bulk approve result - Added: ${added}, Skipped: ${skipped}`);
        res.json({ message: 'İşlem tamamlandı', added, skipped });

    } catch (error) {
        console.error('Bulk Approve Error:', error);
        res.status(500).json({ error: 'Toplu onaylama hatası' });
    }
};

// Delete Pending
const deletePendingContact = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.pendingContact.deleteMany({
            where: {
                id: parseInt(id),
                consultant_id: req.user.id // Security check
            }
        });
        res.json({ message: 'Silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Silme hatası' });
    }
};

// Bulk Delete
const bulkDelete = async (req, res) => {
    const { ids } = req.body;
    try {
        await prisma.pendingContact.deleteMany({
            where: {
                id: { in: ids },
                consultant_id: req.user.id
            }
        });
        res.json({ message: 'Seçilenler silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Toplu silme hatası' });
    }
};

module.exports = {
    getPendingContacts,
    approveContact,
    deletePendingContact,
    bulkApprove,
    bulkDelete
};
