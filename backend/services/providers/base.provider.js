/**
 * Base class for all WhatsApp providers.
 * All custom providers must extend this class and implement the sendTextMessage method.
 */
class BaseProvider {
  constructor(config) {
    this.config = config; // Contains accessToken, phoneNumberId, senderMobile, etc.
  }

  /**
   * Send a text message.
   * @param {string} recipient - The recipient mobile number.
   * @param {string} text - The message text content.
   * @returns {Promise<{success: boolean, messageId: string, rawResponse: any}>}
   */
  async sendTextMessage(recipient, text) {
    throw new Error('sendTextMessage method must be implemented by the provider');
  }
}

module.exports = BaseProvider;
