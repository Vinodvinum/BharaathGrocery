const express = require('express');
const router = express.Router();
const { getUsers, getUserDetails, updateUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, getUsers);
router.get('/:id', protect, admin, getUserDetails);
router.put('/:id', protect, admin, updateUser);

module.exports = router;
