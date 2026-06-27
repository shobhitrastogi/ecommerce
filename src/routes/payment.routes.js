'use strict';

const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Stripe webhook must use raw body
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhook.bind(paymentController));

router.use(authenticate);
router.post('/create-intent', paymentController.createPaymentIntent.bind(paymentController));
router.post('/confirm', paymentController.confirmPayment.bind(paymentController));
router.post('/refund', authorize('admin', 'superadmin'), paymentController.refund.bind(paymentController));

module.exports = router;
