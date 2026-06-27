'use strict';

const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.get('/profile', authenticate, userController.getProfile.bind(userController));
router.put('/profile', authenticate, upload.single('avatar'), userController.updateProfile.bind(userController));
router.get('/wishlist', authenticate, userController.getWishlist.bind(userController));
router.post('/wishlist', authenticate, userController.toggleWishlist.bind(userController));
router.post('/addresses', authenticate, userController.addAddress.bind(userController));
router.put('/addresses/:addressId', authenticate, userController.updateAddress.bind(userController));
router.delete('/addresses/:addressId', authenticate, userController.deleteAddress.bind(userController));

// Admin
router.get('/', authenticate, authorize('admin', 'superadmin'), userController.getAllUsers.bind(userController));
router.patch('/:id/block', authenticate, authorize('admin', 'superadmin'), userController.toggleBlockUser.bind(userController));

module.exports = router;
