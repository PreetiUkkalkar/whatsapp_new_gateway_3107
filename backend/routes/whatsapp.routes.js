const express = require('express');
const router = express.Router();
const {
  getWhatsAppStatus,
  getWhatsAppConnect,
  handleWhatsAppCallback,
  disconnectWhatsApp
} = require('../controllers/whatsapp.controller');
const { protect } = require('../middlewares/auth.middleware');

// Private routes (require admin session token)
router.get('/status', protect, getWhatsAppStatus);
router.get('/connect', protect, getWhatsAppConnect);
router.post('/disconnect', protect, disconnectWhatsApp);

// Public routes (Meta redirect landing)
router.get('/callback', handleWhatsAppCallback);

module.exports = router;
