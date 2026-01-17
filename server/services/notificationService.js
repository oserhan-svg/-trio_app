const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'npasaran@gmail.com', // Replace with real email or env var
        pass: 'your-app-password' // Replace with real app password or env var
    }
});

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

module.exports = { sendNewListingNotification };
