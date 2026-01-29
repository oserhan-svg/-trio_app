require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || 'npasaran@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
    }
});

// Verify connection configuration on startup
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('📬 Initializing SMTP for:', process.env.SMTP_USER);
    transporter.verify((error, success) => {
        if (error) {
            console.warn('⚠️ SMTP Connection Warning:', error.message);
        } else {
            console.log('✅ SMTP Server is ready to take our messages');
        }
    });
} else {
    console.warn('⚠️ SMTP Credentials missing in .env. Notifications will fail.');
}

const sendNewListingNotification = async (property) => {
    try {
        const mailOptions = {
            from: 'Emlak Takip Botu <noreply@emlaktakip.com>',
            to: 'ozan.canevi@gmail.com', // Replace with admin email
            subject: `🏠 Yeni İlan: ${property.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #2563eb;">Yeni İlan Yakalandı!</h2>
                    <p><strong>Bölge:</strong> ${property.neighborhood}, ${property.district}</p>
                    <p><strong>Fiyat:</strong> <span style="font-size: 18px; font-weight: bold; color: #16a34a;">${parseFloat(property.price).toLocaleString('tr-TR')} TL</span></p>
                    <p><strong>Oda:</strong> ${property.rooms} | <strong>m²:</strong> ${property.size_m2}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
                    <a href="${property.url}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">İlana Git</a>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Notification sent:', info.messageId);
    } catch (error) {
        console.error('❌ Notification failed:', error);
    }
};

const sendMatchNotification = async (client, property, matchQuality) => {
    try {
        if (!client.email) return;

        const mailOptions = {
            from: 'TrioApp Concierge <noreply@emlaktakip.com>',
            to: client.email,
            subject: `✨ Sizin İçin Yeni Bir İlan Bulduk! (Uyum: %${matchQuality})`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 12px; max-width: 600px; margin: auto;">
                    <h2 style="color: #059669;">Sayın ${client.name},</h2>
                    <p>Kriterlerinize <strong>%${matchQuality}</strong> oranında uyum sağlayan mükemmel bir fırsat yakaladık!</p>
                    
                    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #065f46;">${property.neighborhood}, ${property.district}</h3>
                        <p style="font-size: 20px; font-weight: bold; color: #059669; margin: 10px 0;">${parseFloat(property.price).toLocaleString('tr-TR')} ₺</p>
                        <p style="color: #374151; margin: 5px 0;">${property.rooms} | ${property.size_m2} m²</p>
                    </div>

                    <p style="color: #6b7280; font-size: 14px;">Danışmanınız bu ilanı sizin için inceledi ve önerilenler listenize ekledi.</p>
                    
                    <div style="text-align: center; margin-top: 25px;">
                        <a href="${property.url}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">İlanı İnceleyin</a>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Match alert sent to ${client.name} (%${matchQuality})`);
    } catch (error) {
        console.error('❌ Match notification failed:', error);
    }
};

module.exports = { sendNewListingNotification, sendMatchNotification };
