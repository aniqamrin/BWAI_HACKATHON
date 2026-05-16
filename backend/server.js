require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const logger = require('./src/utils/logger');
const { testConnection } = require('./src/db/connection');

// Route imports
const authRoutes = require('./src/routes/auth');
const startupRoutes = require('./src/routes/startups');
const mentorRoutes = require('./src/routes/mentors');
const programmeRoutes = require('./src/routes/programmes');
const verifyRoutes = require('./src/routes/verify');
const matchRoutes = require('./src/routes/match');
const relationshipRoutes = require('./src/routes/relationships');
const dashboardRoutes = require('./src/routes/dashboard');
const graphRoutes = require('./src/routes/graph');
const investorRoutes = require('./src/routes/investors');
const firestoreRoutes = require('./src/routes/firestore');
// New routes
const blueprintRoutes = require('./src/routes/blueprints');
const governanceRoutes = require('./src/routes/governance');
const cohortRoutes = require('./src/routes/cohorts');
const outcomeRoutes = require('./src/routes/outcomes');
const lifecycleRoutes = require('./src/routes/lifecycle');

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests' } });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'AI rate limit exceeded' } });
app.use('/api/', limiter);
app.use('/api/verify', aiLimiter);
app.use('/api/match', aiLimiter);

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Health check
app.get('/health', (req, res) => {
  const { getStatus } = require('./src/scheduler/lifecycleScheduler');
  res.json({
    status: 'healthy',
    service: 'EcosystemOS API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    scheduler: getStatus(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/programmes', programmeRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/firestore', firestoreRoutes);
// New routes
app.use('/api/blueprints', blueprintRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/cohorts', cohortRoutes);
app.use('/api/outcomes', outcomeRoutes);
app.use('/api/lifecycle', lifecycleRoutes);

// 404
app.use('*', (req, res) => res.status(404).json({ error: 'Route not found', path: req.originalUrl }));

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

async function startServer() {
  try {
    await testConnection();
    logger.info('Database connection established');

    app.listen(PORT, () => {
      logger.info(`EcosystemOS API v2.0 running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start lifecycle scheduler
    const { startScheduler } = require('./src/scheduler/lifecycleScheduler');
    startScheduler();

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
module.exports = app;
