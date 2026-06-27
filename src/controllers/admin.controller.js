'use strict';

const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const User = require('../models/User.model');
const Review = require('../models/Review.model');
const { ApiResponse } = require('../utils/apiResponse');

class AdminController {
  async getDashboard(req, res, next) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [
        totalUsers, totalProducts, totalOrders,
        monthlyRevenue, lastMonthRevenue,
        pendingOrders, recentOrders,
        topProducts,
      ] = await Promise.all([
        User.countDocuments({ role: 'customer' }),
        Product.countDocuments({ isActive: true }),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { createdAt: { $gte: startOfMonth }, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Order.aggregate([
          { $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Order.countDocuments({ orderStatus: 'pending' }),
        Order.find().populate('user', 'firstName lastName').sort('-createdAt').limit(5).lean(),
        Order.aggregate([
          { $unwind: '$items' },
          { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
          { $sort: { totalSold: -1 } },
          { $limit: 5 },
          { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
          { $unwind: '$product' },
        ]),
      ]);

      const currentRevenue = monthlyRevenue[0]?.total || 0;
      const prevRevenue = lastMonthRevenue[0]?.total || 0;
      const revenueGrowth = prevRevenue === 0 ? 100 : parseFloat(((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1));

      return ApiResponse.success(res, {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          pendingOrders,
          monthlyRevenue: currentRevenue,
          revenueGrowth,
        },
        recentOrders,
        topProducts,
      });
    } catch (error) { next(error); }
  }

  async getSalesAnalytics(req, res, next) {
    try {
      const { period = 'monthly', year = new Date().getFullYear() } = req.query;

      const salesData = await Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) },
          },
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { '_id': 1 } },
      ]);

      return ApiResponse.success(res, { salesData, year });
    } catch (error) { next(error); }
  }
}

module.exports = new AdminController();
