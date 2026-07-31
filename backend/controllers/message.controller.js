const MessageService = require('../services/message.service');

// @desc    Send WhatsApp message (HMS REST API endpoint)
// @route   POST /api/send-message
// @access  Public (Validated via x-api-key)
const sendMessage = async (req, res, next) => {
  try {
    const { clinicId, mobile, message } = req.body;

    if (!clinicId) {
      res.status(400);
      throw new Error("Required field 'clinicId' is missing");
    }
    if (!mobile) {
      res.status(400);
      throw new Error("Required field 'mobile' is missing");
    }
    if (!message) {
      res.status(400);
      throw new Error("Required field 'message' is missing");
    }

    // Limit message length for sanity check
    if (message.length > 4096) {
      res.status(400);
      throw new Error('Message is too long. Max limit is 4096 characters.');
    }

    // Verify that the clinicId in the request body matches the clinic associated with the API Key
    const isCodeMatch = req.clinic.code === clinicId.toString().toLowerCase().trim();
    const isIdMatch = req.clinic._id.toString() === clinicId.toString();

    if (!isCodeMatch && !isIdMatch) {
      res.status(403);
      throw new Error(`Forbidden: This API Key is not authorized to send messages for clinic '${clinicId}'`);
    }

    const response = await MessageService.sendTextMessage(clinicId, mobile, message);
    
    res.status(200).json({
      success: true,
      message: 'Message Sent Successfully',
      messageId: response.messageId,
      status: response.status
    });
  } catch (error) {
    // If the error response was formatted by the service (like Meta response), pass it along
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    next(error);
  }
};

// @desc    Send test message from dashboard UI
// @route   POST /api/messages/send-test
// @access  Private (Admin session JWT)
const sendTestMessage = async (req, res, next) => {
  try {
    const { clinicId, mobile, message } = req.body;

    if (!clinicId || !mobile || !message) {
      res.status(400);
      throw new Error('All fields (Clinic, Mobile, Message) are required');
    }

    const response = await MessageService.sendTextMessage(clinicId, mobile, message);
    
    res.status(200).json({
      success: true,
      message: 'Test Message Sent Successfully',
      messageId: response.messageId,
      status: response.status
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    next(error);
  }
};

module.exports = {
  sendMessage,
  sendTestMessage
};
