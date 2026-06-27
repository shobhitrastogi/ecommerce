'use strict';

const { validationResult } = require('express-validator');
const Review = require('../models/Review.model');
const Order = require('../models/Order.model');
const { ApiResponse, AppError } = require('../utils/apiResponse');

class ReviewController {
  async createReview(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return ApiResponse.badRequest(res, 'Validation failed', errors.array());

      const { productId, rating, title, comment } = req.body;

      const existing = await Review.findOne({ product: productId, user: req.user._id });
      if (existing) throw new AppError('You have already reviewed this product.', 409);

      const verifiedPurchase = await Order.findOne({
        user: req.user._id,
        'items.product': productId,
        orderStatus: 'delivered',
      });

      const images = (req.files || []).map((f) => `/uploads/${f.filename}`);
      const review = await Review.create({
        product: productId,
        user: req.user._id,
        rating,
        title,
        comment,
        images,
        isVerifiedPurchase: !!verifiedPurchase,
      });

      return ApiResponse.created(res, { review }, 'Review submitted successfully');
    } catch (error) { next(error); }
  }

  async getProductReviews(req, res, next) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        Review.find({ product: req.params.productId, isApproved: true })
          .populate('user', 'firstName lastName avatar')
          .sort(sort)
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Review.countDocuments({ product: req.params.productId, isApproved: true }),
      ]);

      return ApiResponse.paginated(res, reviews, { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
    } catch (error) { next(error); }
  }

  async updateReview(req, res, next) {
    try {
      const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
      if (!review) throw new AppError('Review not found or not yours to edit.', 404);

      const { rating, title, comment } = req.body;
      if (rating) review.rating = rating;
      if (title) review.title = title;
      if (comment) review.comment = comment;
      await review.save();

      return ApiResponse.success(res, { review }, 'Review updated');
    } catch (error) { next(error); }
  }

  async deleteReview(req, res, next) {
    try {
      const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
      if (!review) throw new AppError('Review not found.', 404);
      await review.remove();
      return ApiResponse.success(res, null, 'Review deleted');
    } catch (error) { next(error); }
  }

  async voteHelpful(req, res, next) {
    try {
      const review = await Review.findById(req.params.id);
      if (!review) throw new AppError('Review not found.', 404);

      const userId = req.user._id;
      const alreadyVoted = review.helpfulVotes.includes(userId);

      if (alreadyVoted) {
        review.helpfulVotes.pull(userId);
      } else {
        review.helpfulVotes.push(userId);
      }
      await review.save();

      return ApiResponse.success(res, { helpfulCount: review.helpfulVotes.length, voted: !alreadyVoted });
    } catch (error) { next(error); }
  }
}

module.exports = new ReviewController();
