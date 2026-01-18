const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const { pool } = require('./db'); // Not needed directly in index.js usually if routes handle it.
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
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

// Error Handling Middleware (Must be last)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
