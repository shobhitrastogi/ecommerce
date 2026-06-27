'use strict';

const express = require('express');
const categoryController = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.get('/', categoryController.getCategories.bind(categoryController));
router.get('/:slug', categoryController.getCategoryBySlug.bind(categoryController));
router.post('/', authenticate, authorize('admin', 'superadmin'), upload.single('image'), categoryController.createCategory.bind(categoryController));
router.put('/:id', authenticate, authorize('admin', 'superadmin'), upload.single('image'), categoryController.updateCategory.bind(categoryController));
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), categoryController.deleteCategory.bind(categoryController));

module.exports = router;
