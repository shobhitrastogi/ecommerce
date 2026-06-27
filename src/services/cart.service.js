'use strict';

const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const { AppError } = require('../utils/apiResponse');

class CartService {
  async getCart(userId) {
    let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name images price discountPrice stock isActive');
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    return cart;
  }

  async addToCart(userId, productId, quantity = 1, variantId = null) {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) throw new AppError('Product not found or unavailable.', 404);
    if (product.stock < quantity) throw new AppError(`Only ${product.stock} items in stock.`, 400);

    const price = product.discountPrice || product.price;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && String(item.variantId) === String(variantId)
    );

    if (existingItemIndex > -1) {
      const newQty = cart.items[existingItemIndex].quantity + quantity;
      if (newQty > product.stock) throw new AppError(`Only ${product.stock} items available.`, 400);
      cart.items[existingItemIndex].quantity = newQty;
    } else {
      cart.items.push({ product: productId, quantity, variantId, price });
    }

    await cart.save();
    return cart.populate('items.product', 'name images price discountPrice stock');
  }

  async updateCartItem(userId, itemId, quantity) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new AppError('Cart not found.', 404);

    const item = cart.items.id(itemId);
    if (!item) throw new AppError('Item not found in cart.', 404);

    if (quantity <= 0) {
      item.remove();
    } else {
      const product = await Product.findById(item.product);
      if (product.stock < quantity) throw new AppError(`Only ${product.stock} items in stock.`, 400);
      item.quantity = quantity;
    }

    await cart.save();
    return cart.populate('items.product', 'name images price discountPrice stock');
  }

  async removeFromCart(userId, itemId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new AppError('Cart not found.', 404);

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();
    return cart;
  }

  async clearCart(userId) {
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      cart.couponCode = null;
      cart.discount = 0;
      await cart.save();
    }
  }
}

module.exports = new CartService();
