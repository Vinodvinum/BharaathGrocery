const express = require('express');
const router = express.Router();
const { getOrders, updateOrderToDelivered } = require('./orderController');
const { protect, admin } = require('./authMiddleware');

router.route('/').get(protect, admin, getOrders);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);

module.exports = router;