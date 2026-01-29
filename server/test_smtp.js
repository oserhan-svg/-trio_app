const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function testConnection() {
    console.log('Testing SMTP connection...');
    console.log('User:', process.env.SMTP_USER);
    console.log('Pass:', process.env.SMTP_PASS ? '********' : 'MISSING');

    try {
        await transporter.verify();
        console.log('✅ Success: SMTP connection is ready.');
    } catch (error) {
        console.error('❌ Error: SMTP connection failed.');
        console.error(error);
    }
}

testConnection();
