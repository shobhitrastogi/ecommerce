'use strict';

const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

const orderValidation = [
  body('shippingAddress.street').notEmpty().withMessage('Street is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
  body('shippingAddress.zipCode').notEmpty().withMessage('Zip code is required'),
  body('paymentMethod').isIn(['stripe', 'cod', 'paypal']).withMessage('Invalid payment method'),
];

router.post('/', orderValidation, orderController.createOrder.bind(orderController));
router.get('/my-orders', orderController.getMyOrders.bind(orderController));
router.get('/my-orders/:id', orderController.getOrderById.bind(orderController));
router.put('/my-orders/:id/cancel', orderController.cancelOrder.bind(orderController));

// Admin
router.get('/', authorize('admin', 'superadmin'), orderController.getAllOrders.bind(orderController));
router.put('/:id/status', authorize('admin', 'superadmin'), orderController.updateOrderStatus.bind(orderController));

module.exports = router;
