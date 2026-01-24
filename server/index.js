const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const { pool } = require('./db'); // Not needed directly in index.js usually if routes handle it.
require('dotenv').config();

console.log('--- ENV DEBUG ---');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'LOADED' : 'MISSING');
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'MISSING');
console.log('-----------------');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Render
app.set('trust proxy', 1);

// Middleware
app.use(helmet());

app.use(cors()); // Allow all origins temporarily for debugging
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate Limiting
const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api', apiLimiter);

// Routes
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
const scraperRoutes = require('./routes/scraperRoutes'); // Enhanced Scraper API
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const dealRoutes = require('./routes/dealRoutes');
const { startScheduler } = require('./services/scraperService');

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
app.use('/api/ai', aiRoutes);
app.use('/api/scraper', scraperRoutes); // Enhanced Scraper Endpoints
app.use('/api/calendar', googleAuthRoutes);
app.use('/api/deals', dealRoutes);

// Serve Uploads Static Directory
app.use('/uploads', express.static('uploads'));

// Start Scraper Scheduler (Enabling for 4-hour cycle)
// startScheduler();

// AI Self-Improvement Scheduler (Nightly at 03:00)
const cron = require('node-cron');
const AutoTrainService = require('./services/AutoTrainService');
const DeveloperBotService = require('./services/DeveloperBotService');

// 1. Run Tests at 02:30
cron.schedule('30 2 * * *', async () => {
    console.log('Running Nightly Developer Bot Tests...');
    try {
        await DeveloperBotService.runContinuousTests();
    } catch (e) {
        console.error('Nightly Tests Failed:', e);
    }
});

// 2. Run Analysis at 03:00 (Will analyze the results from 02:30)
cron.schedule('0 3 * * *', async () => {
    console.log('Running Nightly AI Self-Improvement...');
    await AutoTrainService.runNightlyAnalysis();
});

app.get('/', (req, res) => {
    res.send('Emlak Takip API Running');
});

app.get('/', (req, res) => {
    res.send('Emlak Takip API Running v1.12');
});

// Health Check for Render / Wakeup Handling
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', version: '1.12', timestamp: new Date() });
});

// Database Initialization Helper
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function initDb() {
    console.log('--- Starting Database Initialization ---');
    try {
        console.log('Running prisma db push...');
        // Using exec instead of execSync to avoid blocking the event loop
        await execPromise('npx prisma db push --accept-data-loss');
        console.log('Running admin creation script...');
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
    console.log(`Server running on port ${PORT}`);
    console.log('*************************************************');
    console.log('*  CRASH FIX LOADED - VERSION: 1.12             *');
    console.log('*  RENDER DEPLOYMENT OPTIMIZED                  *');
    console.log('*************************************************');

    // Initialize Socket.io
    const socketService = require('./services/socketService');
    socketService.initialize(server);

    // Validating Health Check Response first
    console.log('Waiting 5s before running heavy DB tasks to allow Health Check...');
    setTimeout(() => {
        // if (typeof initDb === 'function') initDb();

        // Automatic Migration Hook (Phase 5) - DISABLED FOR STABILITY
        /*
        const { exec: internalExec } = require('child_process');
        const path = require('path');
        const internalPrismaPath = path.join(__dirname, 'node_modules/.bin/prisma');
        const cmd = `"${internalPrismaPath}" migrate dev --name add_deals_model --skip-generate`;
        
        console.log('--- TRIGGERING AUTO-MIGRATION ---');
        internalExec(cmd, (err, stdout, stderr) => {
            console.log('--- AUTO-MIGRATION LOG ---');
            console.log(stdout || 'No stdout');
            if (stderr) console.error('Migration stderr:', stderr);
            if (err) console.error('Migration failed:', err.message);
        });
        */
    }, 5000);
});
