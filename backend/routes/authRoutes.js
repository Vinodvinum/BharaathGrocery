const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmailOtp,
  resendEmailOtp,
  login,
  forgotPassword,
  resetPasswordWithOtp,
  getMe,
  updateProfile,
  addAddress
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/verify-email-otp', verifyEmailOtp);
router.post('/resend-email-otp', resendEmailOtp);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password-otp', resetPasswordWithOtp);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/address', protect, addAddress);

module.exports = router;
