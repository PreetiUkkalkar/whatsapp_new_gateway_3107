const express = require('express');
const router = express.Router();
const { loginAdmin, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/login', loginAdmin);
router.get('/me', protect, getMe);

module.exports = router;
