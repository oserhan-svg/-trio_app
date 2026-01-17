const ExcelJS = require('exceljs');
const prisma = require('../db');

const exportPropertiesToExcel = async (req, res) => {
    try {
        const properties = await prisma.property.findMany({
            orderBy: { created_at: 'desc' }
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Daireler');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Başlık', key: 'title', width: 30 },
            { header: 'Fiyat (TL)', key: 'price', width: 15 },
            { header: 'm²', key: 'size_m2', width: 10 }, // Expecting nulls for now as scraper logic didn't fill this detail deeply
            { header: 'Oda', key: 'rooms', width: 10 },
            { header: 'Mahalle', key: 'neighborhood', width: 15 },
            { header: 'İlçe', key: 'district', width: 15 },
            { header: 'İlan Linki', key: 'url', width: 40 },
            { header: 'Son Güncelleme', key: 'last_scraped', width: 20 }
        ];

        properties.forEach(prop => {
            worksheet.addRow({
                id: prop.external_id,
                title: prop.title,
                price: prop.price,
                size_m2: prop.size_m2 || '-',
                rooms: prop.rooms || '-',
                neighborhood: prop.neighborhood || '150 Evler', // Hardcoded filter scope
                district: prop.district || 'Ayvalık', // Hardcoded filter scope
                url: prop.url,
                last_scraped: prop.last_scraped
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'emlak_listesi.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).send('Error generating Excel file');
    }
};

module.exports = { exportPropertiesToExcel };
