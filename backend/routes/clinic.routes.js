const express = require('express');
const router = express.Router();
const {
  getClinics,
  getClinicById,
  createClinic,
  updateClinic,
  deleteClinic
} = require('../controllers/clinic.controller');
const { protect } = require('../middlewares/auth.middleware');

// Apply JWT authentication to all clinic routes
router.use(protect);

router.route('/')
  .get(getClinics)
  .post(createClinic);

router.route('/:id')
  .get(getClinicById)
  .put(updateClinic)
  .delete(deleteClinic);

module.exports = router;
