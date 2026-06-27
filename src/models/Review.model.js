'use strict';

const mongoose = require('mongoose');
const Product = require('./Product.model');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: [true, 'Rating is required'], min: 1, max: 5 },
  title: { type: String, maxlength: 100 },
  comment: { type: String, required: [true, 'Review comment is required'], maxlength: 1000 },
  isVerifiedPurchase: { type: Boolean, default: false },
  helpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  images: [{ type: String }],
  isApproved: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

reviewSchema.virtual('helpfulCount').get(function () {
  return this.helpfulVotes ? this.helpfulVotes.length : 0;
});

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1 });

// Recalculate product ratings after save/delete
reviewSchema.post('save', async function () {
  await updateProductRatings(this.product);
});

reviewSchema.post('remove', async function () {
  await updateProductRatings(this.product);
});

async function updateProductRatings(productId) {
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: '$product', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': Math.round(stats[0].average * 10) / 10,
      'ratings.count': stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { 'ratings.average': 0, 'ratings.count': 0 });
  }
}

module.exports = mongoose.model('Review', reviewSchema);
