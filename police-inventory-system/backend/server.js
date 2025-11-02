const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
// Comment out rate limiting for now
// const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const officerRoutes = require('./routes/officer');
const equipmentRoutes = require('./routes/equipment');

const app = express();

// Trust proxy for rate limiting (when enabled)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// DISABLE RATE LIMITING FOR DEVELOPMENT
// Uncomment the lines below when you want to re-enable rate limiting in production

/*
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Very high limit
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development' // Skip in development
});
app.use(limiter);
*/

console.log('⚠️  RATE LIMITING DISABLED FOR DEVELOPMENT');

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Routes (no rate limiting)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/equipment', equipmentRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    rateLimiting: 'DISABLED',
    uptime: process.uptime()
  });
});

// Test route to verify server is working
app.get('/', (req, res) => {
  res.json({
    message: 'Police Inventory Management System API',
    version: '1.0.0',
    status: 'Server is running successfully',
    environment: process.env.NODE_ENV || 'development',
    rateLimiting: 'DISABLED FOR DEVELOPMENT'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error.message);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack 
    })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.originalUrl} not found` 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏠 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`🔓 Rate Limiting: DISABLED FOR DEVELOPMENT`);
});

module.exports = app;
