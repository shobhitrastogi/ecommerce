'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order.model');
const { AppError } = require('../utils/apiResponse');

class PaymentService {
  async createPaymentIntent(orderId, userId) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw new AppError('Order not found.', 404);

    if (order.paymentStatus === 'paid') {
      throw new AppError('This order has already been paid.', 400);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: userId.toString(),
        orderNumber: order.orderNumber,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: order.total,
    };
  }

  async confirmPayment(paymentIntentId, orderId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new AppError(`Payment not successful. Status: ${paymentIntent.status}`, 400);
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: 'paid', paymentId: paymentIntentId, orderStatus: 'confirmed' },
      { new: true }
    );

    if (!order) throw new AppError('Order not found.', 404);
    return order;
  }

  async handleWebhook(signature, payload) {
    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      throw new AppError(`Webhook signature verification failed: ${err.message}`, 400);
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        await Order.findByIdAndUpdate(pi.metadata.orderId, {
          paymentStatus: 'paid',
          paymentId: pi.id,
          orderStatus: 'confirmed',
        });
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        await Order.findByIdAndUpdate(pi.metadata.orderId, { paymentStatus: 'failed' });
        break;
      }
    }

    return { received: true };
  }

  async refundPayment(orderId) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found.', 404);

    if (order.paymentStatus !== 'paid' || !order.paymentId) {
      throw new AppError('No payment to refund.', 400);
    }

    const refund = await stripe.refunds.create({ payment_intent: order.paymentId });

    order.paymentStatus = 'refunded';
    await order.save();

    return refund;
  }
}

module.exports = new PaymentService();
