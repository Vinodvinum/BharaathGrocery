const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createRazorpayOrder,
  verifyRazorpayPayment
} = require('../controllers/paymentController');

router.post('/razorpay/order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

module.exports = router;
