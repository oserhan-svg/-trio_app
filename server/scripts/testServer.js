const express = require('express');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
app.use(express.json());

// Bypass auth/role for testing
const bypassAuth = (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
};

app.use('/api/ai', (req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
}, aiRoutes);

const server = app.listen(5001, () => {
    console.log('Test server running on port 5001');
});

// We'll run this and try to hit it with curl in the next step
