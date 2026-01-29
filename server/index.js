const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
// const { pool } = require('./db'); // Not needed directly in index.js usually if routes handle it.
require('dotenv').config();

console.log('--- ENV DEBUG ---');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'LOADED' : 'MISSING');
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'MISSING');
console.log('-----------------');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5005; // Force 5005 to avoid localhost:5000 conflicts

// Trust proxy for Render
app.set('trust proxy', 1);

// 🔍 GLOBAL NETWORK LOGGER (First Middleware)
app.use((req, res, next) => {
    const origin = req.headers.origin || 'none';
    const isPNA = req.headers['access-control-request-private-network'] === 'true';

    if (req.method === 'OPTIONS' || req.url.includes('scraper')) {
        console.log(`[NETWORK] ${req.method} ${req.url} | Origin: ${origin} | PNA-Req: ${isPNA}`);
    }

    // Auto-handle PNA/CORS Preflights (Chrome Extension connectivity)
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', origin === 'none' ? '*' : origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
        res.setHeader('Access-Control-Allow-Credentials', 'true'); // Critical for frontend auth
        res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24h
        return res.status(204).send();
    }

    // Always include PNA header for actual requests too
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
});

app.use(cors({
    origin: (origin, callback) => {
        // Explicitly allow requests from the new frontend and established sources
        const allowedOrigins = [
            'https://trio-app.pages.dev',
            'https://trio-client.pages.dev',
            'http://localhost:5173',
            'http://localhost:3000'
        ];

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost') || origin.includes('chrome-extension')) {
            callback(null, true);
        } else {
            // Soft allow for other domains during dev/testing, but log it
            console.log('[CORS] Allowing unknown origin:', origin);
            callback(null, true);
        }
    },
    credentials: true
}));
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes Requirement
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const clientRoutes = require('./routes/clientRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const imageRoutes = require('./routes/imageRoutes');
const propertyListingRoutes = require('./routes/propertyListingRoutes');
const userRoutes = require('./routes/userRoutes');
const settingRoutes = require('./routes/settingRoutes');
const agendaRoutes = require('./routes/agendaRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const aiRoutes = require('./routes/aiRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const dealRoutes = require('./routes/dealRoutes');

// Health Check
app.get('/api/health', (req, res) => {
    console.log(`[HEALTH CHECK] Responding from Port ${PORT}`);
    res.json({ status: 'OK', version: '1.20', port: PORT });
});

// Lightweight Ping for Keep-Alive (Zero Overhead)
app.get('/api/ping', (req, res) => res.send('pong'));

// REST OF API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/listings', propertyListingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/ai', aiRoutes);
app.use('/api/scraper', require('./routes/scraperRoutes'));
app.use('/api/calendar', googleAuthRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/ai-learning', require('./routes/aiLearningRoutes'));

// JSON 404 for any other /api route
app.use('/api', (req, res) => {
    console.warn(`⚠️ 404 API: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Not Found', path: req.url });
});

// Database Initialization Helper
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function initDb() {
    console.log('--- Starting Database Initialization ---');
    try {
        // [OPTIMIZATION] Removed runtime db push to prevent cold-start delays (30-50s)
        // This should now be handled in the Dockerfile or Build command.
        /*
        console.log('Running prisma db push...');
        await execPromise('npx prisma db push --accept-data-loss');
        */

        console.log('Running admin creation check...');
        const createAdmin = require('./scripts/createAdminPrisma');
        await createAdmin();
        console.log('Database Initialization Complete.');
    } catch (error) {
        console.error('Database Initialization Failed:', error.message);
    }
}



const prisma = require('./db');
app.get('/test-db', async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        const propertyCount = await prisma.property.count();
        res.json({
            status: 'Database Connected',
            user_count: userCount,
            property_count: propertyCount
        });
    } catch (error) {
        res.status(500).json({ status: 'Database Error', error: error.message });
    }
});

// Error Handling Middleware (Must be last)
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVER ACTIVE ON PORT ${PORT} - READY FOR SYNC`);
    console.log('*************************************************');
    console.log('*  CRASH FIX LOADED - VERSION: 1.17             *');
    console.log('*  PORT 5005 ENFORCED FOR EXTENSION             *');
    console.log('*************************************************');

    // Initialize Socket.io
    const socketService = require('./services/socketService');
    socketService.initialize(server);

    // Validating Health Check Response first
    console.log('Waiting 3s before running secondary initialization...');
    setTimeout(() => {
        if (typeof initDb === 'function') initDb();

        // Start AI Self-Optimization Scheduler
        const schedulerService = require('./services/schedulerService');
        schedulerService.start();
    }, 3000);
});
