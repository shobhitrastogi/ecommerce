'use strict';

const Product = require('../models/Product.model');
const { AppError } = require('../utils/apiResponse');

class ProductService {
  async createProduct(data, imageFiles = []) {
    const images = imageFiles.map((f) => `/uploads/${f.filename}`);
    const product = await Product.create({ ...data, images });
    return product;
  }

  async getProducts(query) {
    const {
      page = 1, limit = 12, sort = '-createdAt',
      category, brand, minPrice, maxPrice,
      search, featured, inStock,
    } = query;

    const filter = { isActive: true };

    if (category) filter.category = category;
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (featured === 'true') filter.isFeatured = true;
    if (inStock === 'true') filter.stock = { $gt: 0 };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getProductBySlug(slug) {
    const product = await Product.findOne({ slug, isActive: true })
      .populate('category', 'name slug')
      .populate('seller', 'firstName lastName');
    if (!product) throw new AppError('Product not found.', 404);
    return product;
  }

  async getProductById(id) {
    const product = await Product.findById(id).populate('category', 'name slug');
    if (!product) throw new AppError('Product not found.', 404);
    return product;
  }

  async updateProduct(id, data, imageFiles = []) {
    const product = await Product.findById(id);
    if (!product) throw new AppError('Product not found.', 404);

    if (imageFiles.length > 0) {
      data.images = imageFiles.map((f) => `/uploads/${f.filename}`);
    }

    Object.assign(product, data);
    await product.save();
    return product;
  }

  async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) throw new AppError('Product not found.', 404);
    product.isActive = false;
    await product.save();
  }

  async updateStock(id, quantity) {
    const product = await Product.findById(id);
    if (!product) throw new AppError('Product not found.', 404);

    if (product.stock + quantity < 0) {
      throw new AppError('Insufficient stock.', 400);
    }
    product.stock += quantity;
    await product.save();
    return product;
  }

  async getFeaturedProducts(limit = 8) {
    return Product.find({ isFeatured: true, isActive: true })
      .populate('category', 'name slug')
      .limit(limit)
      .sort('-ratings.average')
      .lean();
  }
}

module.exports = new ProductService();
