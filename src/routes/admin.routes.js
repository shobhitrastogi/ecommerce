'use strict';

const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('admin', 'superadmin'));

router.get('/dashboard', adminController.getDashboard.bind(adminController));
router.get('/analytics/sales', adminController.getSalesAnalytics.bind(adminController));

module.exports = router;
