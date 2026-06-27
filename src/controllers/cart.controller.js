'use strict';

const cartService = require('../services/cart.service');
const { ApiResponse } = require('../utils/apiResponse');

class CartController {
  async getCart(req, res, next) {
    try {
      const cart = await cartService.getCart(req.user._id);
      return ApiResponse.success(res, { cart });
    } catch (error) { next(error); }
  }

  async addToCart(req, res, next) {
    try {
      const { productId, quantity, variantId } = req.body;
      const cart = await cartService.addToCart(req.user._id, productId, quantity, variantId);
      return ApiResponse.success(res, { cart }, 'Item added to cart');
    } catch (error) { next(error); }
  }

  async updateCartItem(req, res, next) {
    try {
      const { quantity } = req.body;
      const cart = await cartService.updateCartItem(req.user._id, req.params.itemId, quantity);
      return ApiResponse.success(res, { cart }, 'Cart updated');
    } catch (error) { next(error); }
  }

  async removeFromCart(req, res, next) {
    try {
      const cart = await cartService.removeFromCart(req.user._id, req.params.itemId);
      return ApiResponse.success(res, { cart }, 'Item removed from cart');
    } catch (error) { next(error); }
  }

  async clearCart(req, res, next) {
    try {
      await cartService.clearCart(req.user._id);
      return ApiResponse.success(res, null, 'Cart cleared');
    } catch (error) { next(error); }
  }
}

module.exports = new CartController();
