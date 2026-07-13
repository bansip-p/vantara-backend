const express = require('express');
const router = express.Router();
const { register, login, updateProfile, getStaffList } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.put('/me', protect, updateProfile);
router.get('/staff', protect, getStaffList);

module.exports = router;