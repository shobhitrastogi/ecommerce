'use strict';

const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const Cart = require('../models/Cart.model');
const { AppError } = require('../utils/apiResponse');

class OrderService {
  async createOrder(userId, orderData) {
    const { shippingAddress, paymentMethod, notes } = orderData;

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      throw new AppError('Your cart is empty.', 400);
    }

    // Validate stock for all items
    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        throw new AppError(`Product "${item.product?.name}" is no longer available.`, 400);
      }
      if (item.product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for "${item.product.name}". Only ${item.product.stock} left.`, 400);
      }
    }

    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images[0] || null,
      price: item.price,
      quantity: item.quantity,
      variantId: item.variantId,
    }));

    const subtotal = cart.subtotal;
    const shippingCost = subtotal >= 50 ? 0 : 9.99;
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const discount = cart.discount || 0;
    const total = parseFloat((subtotal + shippingCost + tax - discount).toFixed(2));

    const order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingCost,
      tax,
      discount,
      total,
      couponCode: cart.couponCode,
      notes,
    });

    // Decrement stock
    await Promise.all(
      cart.items.map((item) =>
        Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } })
      )
    );

    // Clear cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [], discount: 0, couponCode: null });

    return order;
  }

  async getUserOrders(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find({ user: userId }).sort('-createdAt').skip(skip).limit(limit).lean(),
      Order.countDocuments({ user: userId }),
    ]);

    return { orders, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async getOrderById(orderId, userId = null) {
    const filter = { _id: orderId };
    if (userId) filter.user = userId; // Non-admin can only see their own

    const order = await Order.findOne(filter)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name images slug');

    if (!order) throw new AppError('Order not found.', 404);
    return order;
  }

  async updateOrderStatus(orderId, status, trackingNumber = null) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found.', 404);

    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['returned'],
    };

    if (!validTransitions[order.orderStatus]?.includes(status)) {
      throw new AppError(`Cannot transition order from "${order.orderStatus}" to "${status}".`, 400);
    }

    order.orderStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (status === 'delivered') order.deliveredAt = new Date();
    if (status === 'cancelled') order.cancelledAt = new Date();

    await order.save();
    return order;
  }

  async cancelOrder(orderId, userId, reason) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw new AppError('Order not found.', 404);

    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      throw new AppError('This order cannot be cancelled at its current stage.', 400);
    }

    // Restore stock
    await Promise.all(
      order.items.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
      )
    );

    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    await order.save();
    return order;
  }

  async getAllOrders(query) {
    const { page = 1, limit = 20, status, paymentStatus } = query;
    const filter = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'firstName lastName email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    return { orders, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } };
  }
}

module.exports = new OrderService();
