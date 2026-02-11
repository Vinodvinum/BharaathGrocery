const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrders,
  updateOrder
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.get('/', protect, admin, getOrders);
router.put('/:id', protect, admin, updateOrder);

module.exports = router;
