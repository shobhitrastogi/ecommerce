'use strict';

const express = require('express');
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', cartController.getCart.bind(cartController));
router.post('/add', cartController.addToCart.bind(cartController));
router.put('/items/:itemId', cartController.updateCartItem.bind(cartController));
router.delete('/items/:itemId', cartController.removeFromCart.bind(cartController));
router.delete('/', cartController.clearCart.bind(cartController));

module.exports = router;
