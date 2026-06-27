'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { connectDatabase } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const reviewRoutes = require('./routes/review.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');

class Application {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    this._initializeMiddlewares();
    this._initializeRoutes();
    this._initializeErrorHandling();
  }

  _initializeMiddlewares() {
    // Security
    this.app.use(helmet());
    // CORS configuration
    const clientUrlEnv = process.env.CLIENT_URL;
    let corsOptions = {};

    if (clientUrlEnv) {
      const origins = clientUrlEnv.split(',').map(url => url.trim());
      const isAllowAll = origins.length === 1 && origins[0] === '*';

      corsOptions = {
        origin: isAllowAll ? '*' : origins,
        credentials: !isAllowAll, // Disable credentials if origin is explicitly '*'
      };
    } else {
      corsOptions = {
        origin: '*',
        credentials: false, // Disable credentials if no CLIENT_URL is provided
      };
    }
    this.app.use(cors(corsOptions));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: { success: false, message: 'Too many requests, please try again later.' },
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // HTTP request logging
    this.app.use(morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    }));

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  }

  _initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({ success: true, message: 'Server is healthy', timestamp: new Date() });
    });

    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/products', productRoutes);
    this.app.use('/api/v1/categories', categoryRoutes);
    this.app.use('/api/v1/cart', cartRoutes);
    this.app.use('/api/v1/orders', orderRoutes);
    this.app.use('/api/v1/reviews', reviewRoutes);
    this.app.use('/api/v1/payments', paymentRoutes);
    this.app.use('/api/v1/admin', adminRoutes);
  }

  _initializeErrorHandling() {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  async start() {
    await connectDatabase();
    this.app.listen(this.port, () => {
      logger.info(`🚀 Server running on port ${this.port} in ${process.env.NODE_ENV} mode`);
    });
  }
}

module.exports = new Application();
