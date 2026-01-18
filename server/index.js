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
app.use(express.json());

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
const { startScheduler } = require('./services/scraperService');
// DEBUG: Find where Chrome is hiding
const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(path.join(dir, f));
        }
    });
}

try {
    console.log('--- DEBUG: SEARCHING FOR CHROME ---');
    const startPath = path.join(__dirname, 'node_modules/puppeteer');
    if (fs.existsSync(startPath)) {
        walkDir(startPath, (filePath) => {
            if (filePath.includes('chrome') && !filePath.includes('.d.ts')) {
                console.log('FOUND:', filePath);
            }
        });
    } else {
        console.log('node_modules/puppeteer does not exist!');
    }
    console.log('--- DEBUG END ---');
} catch (e) {
    console.log('Debug Error:', e.message);
}

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/settings', require('./routes/settingRoutes')); // Register Settings
app.use('/api/analytics', analyticsRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/listings', propertyListingRoutes);
app.use('/api/agenda', require('./routes/agendaRoutes'));
app.use('/api/performance', require('./routes/performanceRoutes'));

// Start Scraper Scheduler
startScheduler();

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
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initDb(); // Run DB init after port is bound to satisfy Render's health check
});
