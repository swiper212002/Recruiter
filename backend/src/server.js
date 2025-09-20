const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);

const db = require('./config/database');
const logger = require('./utils/logger');
const routes = require('./routes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // HTTP request logging

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connect to database and start server
db.authenticate()
  .then(() => {
    logger.info('Database connection established successfully.');
    
    app.listen(PORT, HOST, () => {
      logger.info(`Server running on ${HOST}:${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Unable to connect to the database:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  // Log full stack for debugging unhandled promise rejections
  logger.error('Unhandled Promise Rejection: ' + (err && err.message ? err.message : String(err)));
  if (err && err.stack) logger.error(err.stack);
  // Do not exit the process here to allow debugging during development
  // In production you may want to exit or handle differently
});

module.exports = app;
