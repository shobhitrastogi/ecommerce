'use strict';

const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const { ApiResponse } = require('../utils/apiResponse');

class AuthController {
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const result = await authService.register(req.body);
      return ApiResponse.created(res, result, 'Account created successfully');
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshAccessToken(refreshToken);
      return ApiResponse.success(res, tokens, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user._id);
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user._id, currentPassword, newPassword);
      return ApiResponse.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      return ApiResponse.success(res, req.user, 'Profile fetched');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
