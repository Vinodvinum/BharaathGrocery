const express = require('express');
const router = express.Router();
const { getOrders, updateOrder } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, getOrders);
router.put('/:id', protect, admin, updateOrder);

module.exports = router;
