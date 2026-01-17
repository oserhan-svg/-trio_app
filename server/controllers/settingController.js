const prisma = require('../db');
const { fetchRentalRate } = require('../services/tuikService');

const getSettings = async (req, res) => {
    // Ensuring fresh load
    try {
        const settings = await prisma.systemSetting.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ error: 'Ayarlar getirilemedi' });
    }
};

const updateSetting = async (req, res) => {
    const { key, value } = req.body;
    try {
        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value, updated_at: new Date() },
            create: { key, value }
        });
        res.json(setting);
    } catch (error) {
        res.status(500).json({ error: 'Ayar güncellenemedi' });
    }
};

const refreshRentalRate = async (req, res) => {
    try {
        const data = await fetchRentalRate();
        if (data) {
            // Data is now an array
            const current = data[0]; // Latest

            // 1. Save Current (for backward compatibility/easy access)
            await prisma.systemSetting.upsert({
                where: { key: 'rental_rate_residential' },
                update: { value: current.residential, updated_at: new Date() },
                create: { key: 'rental_rate_residential', value: current.residential }
            });
            await prisma.systemSetting.upsert({
                where: { key: 'rental_rate_commercial' },
                update: { value: current.commercial, updated_at: new Date() },
                create: { key: 'rental_rate_commercial', value: current.commercial }
            });
            await prisma.systemSetting.upsert({
                where: { key: 'rental_rate_month' },
                update: { value: current.month, updated_at: new Date() },
                create: { key: 'rental_rate_month', value: current.month }
            });

            // 2. Save Full History
            const historyJson = JSON.stringify(data);
            await prisma.systemSetting.upsert({
                where: { key: 'rental_rate_history' },
                update: { value: historyJson, updated_at: new Date() },
                create: { key: 'rental_rate_history', value: historyJson }
            });

            console.log("Sending response data Type:", typeof data);
            console.log("Sending response data IsArray:", Array.isArray(data));
            console.log("Sending response data Length:", data?.length);

            res.json({ message: 'Oranlar güncellendi', data: data });
        } else {
            res.status(500).json({ error: 'Veri çekilemedi' });
        }
    } catch (error) {
        console.error("Refresh ERROR:", error);
        res.status(500).json({ error: 'Güncelleme hatası', details: error.message });
    }
};

module.exports = { getSettings, updateSetting, refreshRentalRate };
