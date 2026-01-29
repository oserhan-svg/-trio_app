const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testStatus() {
    const admin = { id: 85, email: 'test_api@example.com', role: 'admin' };
    const token = jwt.sign(admin, process.env.JWT_SECRET || 'your_jwt_secret_key', { expiresIn: '1h' });

    console.log('Testing WhatsApp Status API...');
    try {
        const response = await axios.get(`http://localhost:${process.env.PORT || 5005}/api/whatsapp/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testStatus();
