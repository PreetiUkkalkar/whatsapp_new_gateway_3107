const Clinic = require('../models/Clinic');

// @desc    Get all clinics
// @route   GET /api/clinics
// @access  Private
const getClinics = async (req, res, next) => {
  try {
    const clinics = await Clinic.find().sort({ createdAt: -1 });
    
    let hasUpdates = false;
    for (let clinic of clinics) {
      if (!clinic.apiKey) {
        const crypto = require('crypto');
        clinic.apiKey = 'hms_key_' + crypto.randomBytes(16).toString('hex');
        await clinic.save();
        hasUpdates = true;
      }
    }
    
    const finalClinics = hasUpdates ? await Clinic.find().sort({ createdAt: -1 }) : clinics;
    res.json({ success: true, count: finalClinics.length, data: finalClinics });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single clinic
// @route   GET /api/clinics/:id
// @access  Private
const getClinicById = async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      res.status(404);
      throw new Error('Clinic not found');
    }
    res.json({ success: true, data: clinic });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new clinic config
// @route   POST /api/clinics
// @access  Private
const createClinic = async (req, res, next) => {
  try {
    const { name, code, senderMobile, phoneNumberId, businessAccountId, accessToken, status } = req.body;

    // Validate required fields
    if (!name || !code || !senderMobile || !phoneNumberId || !businessAccountId || !accessToken) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    const cleanCode = code.toString().toLowerCase().trim();

    // Check duplicate code
    const existingClinic = await Clinic.findOne({ code: cleanCode });
    if (existingClinic) {
      res.status(400);
      throw new Error(`Clinic Code '${cleanCode}' is already in use`);
    }

    const clinic = await Clinic.create({
      name,
      code: cleanCode,
      senderMobile,
      phoneNumberId,
      businessAccountId,
      accessToken,
      status: status || 'active'
    });

    res.status(201).json({ success: true, data: clinic });
  } catch (error) {
    next(error);
  }
};

// @desc    Update clinic config
// @route   PUT /api/clinics/:id
// @access  Private
const updateClinic = async (req, res, next) => {
  try {
    const { name, code, senderMobile, phoneNumberId, businessAccountId, accessToken, status } = req.body;

    let clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      res.status(404);
      throw new Error('Clinic not found');
    }

    if (code) {
      const cleanCode = code.toString().toLowerCase().trim();
      // Check duplicate code
      const existingClinic = await Clinic.findOne({ code: cleanCode, _id: { $ne: req.params.id } });
      if (existingClinic) {
        res.status(400);
        throw new Error(`Clinic Code '${cleanCode}' is already in use`);
      }
      clinic.code = cleanCode;
    }

    if (name) clinic.name = name;
    if (senderMobile) clinic.senderMobile = senderMobile;
    if (phoneNumberId) clinic.phoneNumberId = phoneNumberId;
    if (businessAccountId) clinic.businessAccountId = businessAccountId;
    if (accessToken) clinic.accessToken = accessToken;
    if (status) clinic.status = status;

    const updatedClinic = await clinic.save();
    res.json({ success: true, data: updatedClinic });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete clinic config
// @route   DELETE /api/clinics/:id
// @access  Private
const deleteClinic = async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      res.status(404);
      throw new Error('Clinic not found');
    }

    await Clinic.deleteOne({ _id: req.params.id });
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClinics,
  getClinicById,
  createClinic,
  updateClinic,
  deleteClinic
};
