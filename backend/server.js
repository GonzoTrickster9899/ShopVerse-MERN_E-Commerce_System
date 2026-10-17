const dotenv = require('dotenv');

dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { AppError, asyncHandler, errorHandler } = require('./utils/errorHandler');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// The local upload directory is useful during development only. Vercel's
// function filesystem is ephemeral and must not be treated as media storage.
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Connect lazily so a warm Vercel function can reuse Mongoose's connection.
// Health reports readiness with a generic response and never exposes URI data.
app.use('/api', asyncHandler(async (req, res, next) => {
  try {
    await connectDB();
    return next();
  } catch (error) {
    if (req.path === '/health') {
      return res.status(503).json({
        success: false,
        status: 'unavailable',
        message: 'Service temporarily unavailable',
      });
    }
    return next(new AppError('Service temporarily unavailable', 503));
  }
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments', require('./routes/payments'));

app.get('/api/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json(databaseReady
    ? { success: true, status: 'ready' }
    : { success: false, status: 'unavailable', message: 'Service temporarily unavailable' });
});

app.use(errorHandler);

module.exports = app;

// Local development entry point. Vercel imports the exported Express app and
// does not open a separate listener or install a process-wide rejection hook.
if (require.main === module) {
  const port = process.env.PORT || 5000;
  const server = app.listen(port, () => {
    console.log(`ShopVerse API listening on port ${port}`);
  });

  process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection in local server');
    server.close(() => process.exit(1));
  });
}
