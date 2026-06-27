'use strict';

const User = require('../models/User.model');
const Product = require('../models/Product.model');
const { ApiResponse, AppError } = require('../utils/apiResponse');

class UserController {
  async getProfile(req, res, next) {
    try {
      return ApiResponse.success(res, { user: req.user });
    } catch (error) { next(error); }
  }

  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone } = req.body;
      const updateData = { firstName, lastName, phone };

      if (req.file) {
        updateData.avatar = `/uploads/${req.file.filename}`;
      }

      const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
      return ApiResponse.success(res, { user }, 'Profile updated');
    } catch (error) { next(error); }
  }

  async addAddress(req, res, next) {
    try {
      const user = await User.findById(req.user._id);
      if (req.body.isDefault) {
        user.addresses.forEach((addr) => (addr.isDefault = false));
      }
      user.addresses.push(req.body);
      await user.save();
      return ApiResponse.success(res, { addresses: user.addresses }, 'Address added');
    } catch (error) { next(error); }
  }

  async updateAddress(req, res, next) {
    try {
      const user = await User.findById(req.user._id);
      const address = user.addresses.id(req.params.addressId);
      if (!address) throw new AppError('Address not found.', 404);

      if (req.body.isDefault) {
        user.addresses.forEach((addr) => (addr.isDefault = false));
      }
      Object.assign(address, req.body);
      await user.save();
      return ApiResponse.success(res, { addresses: user.addresses }, 'Address updated');
    } catch (error) { next(error); }
  }

  async deleteAddress(req, res, next) {
    try {
      const user = await User.findById(req.user._id);
      user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
      await user.save();
      return ApiResponse.success(res, { addresses: user.addresses }, 'Address deleted');
    } catch (error) { next(error); }
  }

  async toggleWishlist(req, res, next) {
    try {
      const { productId } = req.body;
      const product = await Product.findById(productId);
      if (!product) throw new AppError('Product not found.', 404);

      const user = await User.findById(req.user._id);
      const isWishlisted = user.wishlist.includes(productId);

      if (isWishlisted) {
        user.wishlist.pull(productId);
      } else {
        user.wishlist.push(productId);
      }
      await user.save();

      return ApiResponse.success(res, { wishlisted: !isWishlisted, wishlistCount: user.wishlist.length });
    } catch (error) { next(error); }
  }

  async getWishlist(req, res, next) {
    try {
      const user = await User.findById(req.user._id).populate('wishlist', 'name images price discountPrice ratings slug');
      return ApiResponse.success(res, { wishlist: user.wishlist });
    } catch (error) { next(error); }
  }

  // Admin
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, role, search } = req.query;
      const filter = {};
      if (role) filter.role = role;
      if (search) filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];

      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        User.find(filter).skip(skip).limit(Number(limit)).sort('-createdAt').lean(),
        User.countDocuments(filter),
      ]);

      return ApiResponse.paginated(res, users, { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
    } catch (error) { next(error); }
  }

  async toggleBlockUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) throw new AppError('User not found.', 404);
      user.isBlocked = !user.isBlocked;
      await user.save();
      return ApiResponse.success(res, null, `User ${user.isBlocked ? 'blocked' : 'unblocked'}`);
    } catch (error) { next(error); }
  }
}

module.exports = new UserController();
