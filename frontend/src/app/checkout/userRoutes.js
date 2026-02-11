const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUsers } = require('./userController');
const { protect, admin } = require('./authMiddleware');

router.get('/', (req, res) => {
    res.send('User API is running');
});

router.get('/all', protect, admin, getUsers);

router.route('/register')
    .post(registerUser)
    .get((req, res) => res.send('Register Page'));

router.route('/login')
    .post(authUser)
    .get((req, res) => res.send('Login Page'));

module.exports = router;