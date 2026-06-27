'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { AppError } = require('../utils/apiResponse');

class AuthService {
  async register(userData) {
    const { firstName, lastName, email, password, phone } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered.', 409);
    }

    const user = await User.create({ firstName, lastName, email, password, phone });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user: this._sanitizeUser(user), accessToken, refreshToken };
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.isBlocked) {
      throw new AppError('Your account has been blocked. Contact support.', 403);
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user: this._sanitizeUser(user), accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) throw new AppError('Refresh token is required.', 400);

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Invalid or expired refresh token.', 401);
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError('Refresh token mismatch. Please login again.', 401);
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new AppError('User not found.', 404);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new AppError('Current password is incorrect.', 401);

    user.password = newPassword;
    await user.save();
  }

  _sanitizeUser(user) {
    const obj = user.toObject();
    delete obj.password;
    delete obj.refreshToken;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpire;
    return obj;
  }
}

module.exports = new AuthService();
