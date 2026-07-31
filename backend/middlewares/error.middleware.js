const config = require('../config/config');

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  console.error(`[Error Handler] ${err.stack || err.message}`);

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
    ...(err.rawResponse && { apiResponse: err.rawResponse })
  });
};

module.exports = { errorHandler };
