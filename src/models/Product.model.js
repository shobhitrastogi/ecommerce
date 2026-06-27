'use strict';

const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },       // e.g. "Color", "Size"
  value: { type: String, required: true },      // e.g. "Red", "XL"
  additionalPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  sku: { type: String },
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 200 },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, required: [true, 'Description is required'], maxlength: 5000 },
  shortDescription: { type: String, maxlength: 300 },
  price: { type: Number, required: [true, 'Price is required'], min: 0 },
  discountPrice: { type: Number, default: null, min: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, trim: true },
  images: [{ type: String }],
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, unique: true, sparse: true },
  variants: [variantSchema],
  tags: [{ type: String, lowercase: true }],
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  weight: { type: Number, min: 0 },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

productSchema.virtual('isInStock').get(function () {
  return this.stock > 0;
});

productSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice && this.discountPrice < this.price ? this.discountPrice : this.price;
});

productSchema.virtual('discountPercentage').get(function () {
  if (this.discountPrice && this.discountPrice < this.price) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
  next();
});

productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
