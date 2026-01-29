
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

const user = {
    id: 1,
    role: 'admin',
    email: 'admin@emlak22.com'
};

const token = jwt.sign(user, process.env.JWT_SECRET || 'your_jwt_secret_key', { expiresIn: '1h' });
console.log('TOKEN:', token);
