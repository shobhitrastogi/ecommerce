'use strict';

const Category = require('../models/Category.model');
const { ApiResponse, AppError } = require('../utils/apiResponse');

class CategoryController {
  async createCategory(req, res, next) {
    try {
      const data = { ...req.body };
      if (req.file) data.image = `/uploads/${req.file.filename}`;
      const category = await Category.create(data);
      return ApiResponse.created(res, { category }, 'Category created');
    } catch (error) { next(error); }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await Category.find({ isActive: true, parent: null })
        .populate({ path: 'children', match: { isActive: true } })
        .lean();
      return ApiResponse.success(res, { categories });
    } catch (error) { next(error); }
  }

  async getCategoryBySlug(req, res, next) {
    try {
      const category = await Category.findOne({ slug: req.params.slug, isActive: true }).populate('children');
      if (!category) throw new AppError('Category not found.', 404);
      return ApiResponse.success(res, { category });
    } catch (error) { next(error); }
  }

  async updateCategory(req, res, next) {
    try {
      const data = { ...req.body };
      if (req.file) data.image = `/uploads/${req.file.filename}`;
      const category = await Category.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
      if (!category) throw new AppError('Category not found.', 404);
      return ApiResponse.success(res, { category }, 'Category updated');
    } catch (error) { next(error); }
  }

  async deleteCategory(req, res, next) {
    try {
      const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
      if (!category) throw new AppError('Category not found.', 404);
      return ApiResponse.success(res, null, 'Category deleted');
    } catch (error) { next(error); }
  }
}

module.exports = new CategoryController();
