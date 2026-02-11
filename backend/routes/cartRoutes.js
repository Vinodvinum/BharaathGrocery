const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCart);
router.post('/items', protect, addToCart);
router.put('/items/:itemId', protect, updateCartItem);
router.delete('/items/:itemId', protect, removeCartItem);
router.delete('/', protect, clearCart);

module.exports = router;
