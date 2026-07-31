const express = require('express');
const router = express.Router();
const { getLogs, getDashboardStats } = require('../controllers/log.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/', getLogs);
router.get('/stats', getDashboardStats);

module.exports = router;
