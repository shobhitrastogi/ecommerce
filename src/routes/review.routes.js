'use strict';

const express = require('express');
const { body } = require('express-validator');
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.get('/product/:productId', reviewController.getProductReviews.bind(reviewController));

router.use(authenticate);
router.post('/', upload.array('images', 3), [
  body('productId').isMongoId().withMessage('Valid product ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').notEmpty().withMessage('Comment is required'),
], reviewController.createReview.bind(reviewController));

router.put('/:id', reviewController.updateReview.bind(reviewController));
router.delete('/:id', reviewController.deleteReview.bind(reviewController));
router.post('/:id/helpful', reviewController.voteHelpful.bind(reviewController));

module.exports = router;
