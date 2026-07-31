const axios = require('axios');
const BaseProvider = require('./base.provider');

class MetaProvider extends BaseProvider {
  /**
   * Send a text message using Meta WhatsApp Cloud API.
   * @param {string} recipient - Recipient mobile number (e.g. '919876543210')
   * @param {string} text - Message text
   * @returns {Promise<{success: boolean, messageId: string, rawResponse: any}>}
   */
  async sendTextMessage(recipient, text) {
    const { accessToken, phoneNumberId } = this.config;

    if (!accessToken || !phoneNumberId) {
      throw new Error('Meta API Access Token or Phone Number ID is missing');
    }

    // Clean recipient phone number (remove '+', space, brackets)
    const cleanRecipient = recipient.replace(/\D/g, '');

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanRecipient,
      type: 'text',
      text: {
        preview_url: false,
        body: text
      }
    };

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    try {
      const response = await axios.post(url, payload, { headers, timeout: 15000 });
      
      const responseData = response.data;
      if (responseData && responseData.messages && responseData.messages.length > 0) {
        return {
          success: true,
          messageId: responseData.messages[0].id,
          rawResponse: responseData
        };
      }
      
      throw new Error('Meta API responded with success but no message ID was returned');
    } catch (error) {
      // Structure the error details cleanly
      let errorMessage = error.message;
      let errorResponse = null;

      if (error.response) {
        errorResponse = error.response.data;
        errorMessage = error.response.data.error?.message || JSON.stringify(error.response.data);
      }

      const metaError = new Error(`Meta API Error: ${errorMessage}`);
      metaError.rawResponse = errorResponse || { message: error.message };
      throw metaError;
    }
  }
}

module.exports = MetaProvider;
