const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cls = require('cls-rtracer');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('./middleware/auth');
const logger = require('../common/lib/logger');
const routes = require('./routes');

const NAMESPACE = 'fintech-backend';
const app = express();

// Context propagation
const namespace = cls.createNamespace(NAMESPACE);
namespace.run(() => {
  app.use((req, res, next) => {
    namespace.runAndReturn(() => {
      namespace.set('traceId', req.headers['x-trace-id'] || req.id);
      next();
    });
  });
});

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));
app.use(express.json({ limit: '2mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes with auth
app.use('/api/auth', routes.auth);
app.use('/api/transactions', authMiddleware.verifyToken, routes.transactions);

// Error handling
app.use((err, req, res, next) => {
  const traceId = namespace.get('traceId');
  logger.error(err.message, { traceId, stack: err.stack });
  res.status(500).json({ error: 'Internal server error', traceId });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Gateway running on port ${PORT}`);
});
