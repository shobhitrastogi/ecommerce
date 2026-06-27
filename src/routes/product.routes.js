'use strict';

const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

router.get('/', productController.getProducts.bind(productController));
router.get('/featured', productController.getFeaturedProducts.bind(productController));
router.get('/slug/:slug', productController.getProductBySlug.bind(productController));
router.get('/:id', productController.getProductById.bind(productController));

router.post('/', authenticate, authorize('admin', 'superadmin'), upload.array('images', 5), productValidation, productController.createProduct.bind(productController));
router.put('/:id', authenticate, authorize('admin', 'superadmin'), upload.array('images', 5), productController.updateProduct.bind(productController));
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), productController.deleteProduct.bind(productController));

module.exports = router;
