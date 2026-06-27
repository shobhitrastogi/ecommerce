'use strict';

const { validationResult } = require('express-validator');
const orderService = require('../services/order.service');
const { ApiResponse } = require('../utils/apiResponse');

class OrderController {
  async createOrder(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return ApiResponse.badRequest(res, 'Validation failed', errors.array());

      const order = await orderService.createOrder(req.user._id, req.body);
      return ApiResponse.created(res, { order }, 'Order placed successfully');
    } catch (error) { next(error); }
  }

  async getMyOrders(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await orderService.getUserOrders(req.user._id, page, limit);
      return ApiResponse.paginated(res, result.orders, result.pagination);
    } catch (error) { next(error); }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.params.id, req.user._id);
      return ApiResponse.success(res, { order });
    } catch (error) { next(error); }
  }

  async cancelOrder(req, res, next) {
    try {
      const { reason } = req.body;
      const order = await orderService.cancelOrder(req.params.id, req.user._id, reason);
      return ApiResponse.success(res, { order }, 'Order cancelled');
    } catch (error) { next(error); }
  }

  // Admin only
  async getAllOrders(req, res, next) {
    try {
      const result = await orderService.getAllOrders(req.query);
      return ApiResponse.paginated(res, result.orders, result.pagination);
    } catch (error) { next(error); }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { status, trackingNumber } = req.body;
      const order = await orderService.updateOrderStatus(req.params.id, status, trackingNumber);
      return ApiResponse.success(res, { order }, 'Order status updated');
    } catch (error) { next(error); }
  }
}

module.exports = new OrderController();
