const Clinic = require('../models/Clinic');
const MessageLog = require('../models/MessageLog');
const ProviderRegistry = require('./providers');

class MessageService {
  /**
   * Send text message via configured provider and log the status.
   * @param {string} clinicId - Clinic code (e.g. 'clinic001') or MongoDB _id
   * @param {string} mobile - Recipient mobile number
   * @param {string} message - Message text
   * @returns {Promise<{success: boolean, messageId: string, status: string}>}
   */
  static async sendTextMessage(clinicId, mobile, message) {
    // 1. Validation
    if (!clinicId) throw new Error('Clinic ID/Code is required');
    if (!mobile) throw new Error('Recipient mobile number is required');
    if (!message) throw new Error('Message text is required');

    // 2. Find Clinic
    // Attempt lookup by code (case-insensitive) first, then by MongoDB ObjectId format
    let clinic = await Clinic.findOne({
      $or: [
        { code: clinicId.toString().toLowerCase() },
        ...(clinicId.toString().match(/^[0-9a-fA-F]{24}$/) ? [{ _id: clinicId }] : [])
      ]
    });

    if (!clinic) {
      throw new Error(`Clinic with ID or Code '${clinicId}' not found`);
    }

    if (clinic.status !== 'active') {
      throw new Error(`Clinic '${clinic.name}' is currently inactive`);
    }

    // 3. Resolve Provider
    let provider;
    try {
      provider = ProviderRegistry.getProvider(clinic);
    } catch (err) {
      throw new Error(`Failed to initialize provider: ${err.message}`);
    }

    // 4. Send Message via Provider
    let logStatus = 'failed';
    let providerMessageId = null;
    let apiResponse = null;

    try {
      const result = await provider.sendTextMessage(mobile, message);
      logStatus = 'sent';
      providerMessageId = result.messageId;
      apiResponse = result.rawResponse;

      return {
        success: true,
        message: 'Message Sent Successfully',
        messageId: providerMessageId,
        status: logStatus
      };
    } catch (error) {
      logStatus = 'failed';
      apiResponse = error.rawResponse || { error: error.message };
      throw error; // Re-throw to be handled by controller, but log database record first!
    } finally {
      // 5. Save Log
      try {
        await MessageLog.create({
          clinic: clinic._id,
          recipientMobile: mobile,
          message,
          providerMessageId,
          status: logStatus,
          apiResponse
        });
      } catch (logError) {
        console.error('Failed to write message log to MongoDB:', logError.message);
      }
    }
  }
}

module.exports = MessageService;
