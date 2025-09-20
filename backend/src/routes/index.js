const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const questionRoutes = require('./question.routes');
const testRoutes = require('./test.routes');
const publicRoutes = require('./public.routes');
const candidateRoutes = require('./candidate.routes');
const jobRoutes = require('./job.routes');
const interviewRoutes = require('./interview.routes');
const candidateTestRoutes = require('./candidateTest.routes');
const reportRoutes = require('./report.routes');

// Use route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/questions', questionRoutes);
router.use('/tests', testRoutes);

// Mount public API only in development or when explicitly enabled
const logger = require('../utils/logger');
if (process.env.PUBLIC_API === 'true' || process.env.NODE_ENV === 'development') {
  logger.info('PUBLIC_API is enabled — mounting /api/public routes');
  console.log('PUBLIC_API is enabled — mounting /api/public routes');
  router.use('/public', publicRoutes);
} else {
  logger.info('PUBLIC_API is disabled — /api/public routes will NOT be mounted');
  console.log('PUBLIC_API is disabled — /api/public routes will NOT be mounted');
}
router.use('/candidates', candidateRoutes);
router.use('/jobs', jobRoutes);
router.use('/interviews', interviewRoutes);
router.use('/candidate-tests', candidateTestRoutes);
router.use('/reports', reportRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

module.exports = router;
