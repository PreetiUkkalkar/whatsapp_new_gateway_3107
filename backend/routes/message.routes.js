const express = require('express');
const router = express.Router();
const { sendTestMessage } = require('../controllers/message.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/send-test', protect, sendTestMessage);

module.exports = router;
