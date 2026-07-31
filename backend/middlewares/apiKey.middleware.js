const Clinic = require('../models/Clinic');

const validateApiKey = async (req, res, next) => {
  const apiKeyHeader = req.headers['x-api-key'];
  let bearerToken = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    bearerToken = req.headers.authorization.split(' ')[1];
  }

  const providedKey = apiKeyHeader || bearerToken;

  if (!providedKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Gateway API Key is missing.'
    });
  }

  try {
    const clinic = await Clinic.findOne({ apiKey: providedKey, status: 'active' });

    if (!clinic) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Invalid Gateway API Key or Clinic is inactive.'
      });
    }

    req.clinic = clinic;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validateApiKey };
