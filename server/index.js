const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const { pool } = require('./db'); // Not needed directly in index.js usually if routes handle it.
require('dotenv').config();

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
app.use('/api', apiLimiter); // Apply to all /api routes

// Routes
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const clientRoutes = require('./routes/clientRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const imageRoutes = require('./routes/imageRoutes');
const propertyListingRoutes = require('./routes/propertyListingRoutes');
const userRoutes = require('./routes/userRoutes');
const { startScheduler } = require('./services/scraperService');

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/settings', require('./routes/settingRoutes')); // Register Settings
app.use('/api/analytics', analyticsRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/listings', propertyListingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agenda', require('./routes/agendaRoutes'));
app.use('/api/performance', require('./routes/performanceRoutes'));

// Start Scraper Scheduler
// startScheduler();

app.get('/', (req, res) => {
    res.send('Emlak Takip API Running');
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('*************************************************');
    console.log('*  CRASH FIX LOADED - VERSION: 1.11             *');
    console.log('*  RENDER DEPLOYMENT OPTIMIZED                  *');
    console.log('*************************************************');

    // Validating Health Check Response first
    console.log('Waiting 5s before running heavy DB tasks to allow Health Check...');
    setTimeout(() => {
        initDb();
    }, 5000);
});
