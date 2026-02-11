const express = require('express');
const router = express.Router();
const { getDashboardOverview } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

router.get('/dashboard', protect, admin, getDashboardOverview);

module.exports = router;
