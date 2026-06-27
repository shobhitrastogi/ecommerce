'use strict';

const dns = require('dns');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI is not defined. Set it in your .env file or environment.');
      }

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        autoIndex: true,
      };

      if (uri.startsWith('mongodb+srv://')) {
        const dnsServers = (process.env.MONGODB_DNS_SERVERS || '1.1.1.1,8.8.8.8')
          .split(',')
          .map((server) => server.trim())
          .filter(Boolean);

        if (dnsServers.length) {
          dns.setServers(dnsServers);
          logger.info(`Using DNS servers for Atlas SRV resolution: ${dnsServers.join(', ')}`);
        }
      }

      this.connection = await mongoose.connect(uri, options);
      logger.info(`✅ MongoDB connected: ${this.connection.connection.host}`);

      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err}`);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      return this.connection;
    } catch (error) {
      if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
        logger.error('MongoDB Atlas SRV lookup failed. Verify your DNS and Atlas network access.');
        logger.error('If you are behind a private DNS or Windows resolver, add MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8 to your .env file.');
        logger.error('Alternatively, use the standard non-SRV MongoDB URI from Atlas if SRV lookups continue to fail.');
      }
      logger.error(`MongoDB connection failed: ${error.message}`);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected.');
  }
}

const db = new Database();

module.exports = {
  connectDatabase: () => db.connect(),
  disconnectDatabase: () => db.disconnect(),
};
