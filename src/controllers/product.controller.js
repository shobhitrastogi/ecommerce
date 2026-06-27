'use strict';

const { validationResult } = require('express-validator');
const productService = require('../services/product.service');
const { ApiResponse } = require('../utils/apiResponse');

class ProductController {
  async createProduct(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return ApiResponse.badRequest(res, 'Validation failed', errors.array());

      const product = await productService.createProduct(req.body, req.files || []);
      return ApiResponse.created(res, { product }, 'Product created successfully');
    } catch (error) {
      next(error);
    }
  }

  async getProducts(req, res, next) {
    try {
      const { products, pagination } = await productService.getProducts(req.query);
      return ApiResponse.paginated(res, products, pagination);
    } catch (error) {
      next(error);
    }
  }

  async getProductBySlug(req, res, next) {
    try {
      const product = await productService.getProductBySlug(req.params.slug);
      return ApiResponse.success(res, { product });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return ApiResponse.success(res, { product });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body, req.files || []);
      return ApiResponse.success(res, { product }, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);
      return ApiResponse.success(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getFeaturedProducts(req, res, next) {
    try {
      const products = await productService.getFeaturedProducts(req.query.limit);
      return ApiResponse.success(res, { products });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
