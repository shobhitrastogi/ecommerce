'use strict';

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  price: { type: Number, required: true },
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  couponCode: { type: String, default: null },
  discount: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
});

cartSchema.virtual('total').get(function () {
  return Math.max(0, this.subtotal - this.discount);
});

cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((count, item) => count + item.quantity, 0);
});

cartSchema.index({ user: 1 });

module.exports = mongoose.model('Cart', cartSchema);
