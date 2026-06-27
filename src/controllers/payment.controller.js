'use strict';

const express = require('express');
const paymentService = require('../services/payment.service');
const { ApiResponse } = require('../utils/apiResponse');

class PaymentController {
  async createPaymentIntent(req, res, next) {
    try {
      const { orderId } = req.body;
      const result = await paymentService.createPaymentIntent(orderId, req.user._id);
      return ApiResponse.success(res, result, 'Payment intent created');
    } catch (error) { next(error); }
  }

  async confirmPayment(req, res, next) {
    try {
      const { paymentIntentId, orderId } = req.body;
      const order = await paymentService.confirmPayment(paymentIntentId, orderId);
      return ApiResponse.success(res, { order }, 'Payment confirmed');
    } catch (error) { next(error); }
  }

  async webhook(req, res, next) {
    try {
      const signature = req.headers['stripe-signature'];
      const result = await paymentService.handleWebhook(signature, req.body);
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }

  async refund(req, res, next) {
    try {
      const { orderId } = req.body;
      const refund = await paymentService.refundPayment(orderId);
      return ApiResponse.success(res, { refund }, 'Refund initiated');
    } catch (error) { next(error); }
  }
}

module.exports = new PaymentController();
