const axios = require('axios');
const config = require('../config/config');

class WhatsAppMetaService {
  /**
   * Exchange authorization code for client access token
   * @param {string} code - The code from Meta redirect callback
   * @returns {Promise<string>} Access token
   */
  static async exchangeCodeForToken(code) {
    const url = 'https://graph.facebook.com/v19.0/oauth/access_token';
    const params = {
      client_id: config.metaAppId,
      redirect_uri: config.metaRedirectUri,
      client_secret: config.metaAppSecret,
      code: code
    };

    try {
      const response = await axios.get(url, { params });
      if (response.data && response.data.access_token) {
        return response.data.access_token;
      }
      throw new Error('No access token returned from Meta');
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      throw new Error(`Token exchange failed: ${errorMsg}`);
    }
  }

  /**
   * Inspect access token details to extract WABA and permissions
   * @param {string} accessToken - User access token
   * @returns {Promise<any>} Debug token data
   */
  static async debugToken(accessToken) {
    const url = 'https://graph.facebook.com/debug_token';
    const params = {
      input_token: accessToken,
      access_token: `${config.metaAppId}|${config.metaAppSecret}`
    };

    try {
      const response = await axios.get(url, { params });
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      throw new Error(`Debug token failed: ${errorMsg}`);
    }
  }

  /**
   * Get WABA Details (WhatsApp Business Account Name, etc.)
   * @param {string} wabaId - WABA ID
   * @param {string} accessToken - Access token
   * @returns {Promise<any>} WABA Details
   */
  static async getWabaDetails(wabaId, accessToken) {
    const url = `https://graph.facebook.com/v19.0/${wabaId}`;
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      throw new Error(`Failed to fetch WABA details: ${errorMsg}`);
    }
  }

  /**
   * Get registered phone numbers for a WABA
   * @param {string} wabaId - WABA ID
   * @param {string} accessToken - Access token
   * @returns {Promise<Array>} List of phone numbers
   */
  static async getWabaPhoneNumbers(wabaId, accessToken) {
    const url = `https://graph.facebook.com/v19.0/${wabaId}/phone_numbers`;
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data.data || [];
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      throw new Error(`Failed to fetch WABA phone numbers: ${errorMsg}`);
    }
  }

  /**
   * Get Business Portfolio details (Name, ID)
   * @param {string} businessId - Business Portfolio/Manager ID
   * @param {string} accessToken - Access token
   * @returns {Promise<any>} Business details
   */
  static async getBusinessPortfolio(businessId, accessToken) {
    const url = `https://graph.facebook.com/v19.0/${businessId}`;
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    } catch (error) {
      // In sandbox mode business information fetch might fail if user doesn't own it or has limited permissions
      // We return a fallback rather than crashing
      console.warn(`Failed to fetch business details for ID ${businessId}:`, error.message);
      return { id: businessId, name: 'Business Portfolio' };
    }
  }

  /**
   * Complete WhatsApp Coexistence Phone Number registration
   * @param {string} phoneNumberId - Phone Number ID
   * @param {string} accessToken - Access Token
   * @param {string} pin - 6-digit PIN code (optional, defaults to '123456')
   * @returns {Promise<boolean>} Success status
   */
  static async registerPhoneNumber(phoneNumberId, accessToken, pin = '123456') {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/register`;
    const payload = {
      messaging_product: 'whatsapp',
      pin: pin
    };

    try {
      await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      throw new Error(`Phone number registration failed: ${errorMsg}`);
    }
  }
}

module.exports = WhatsAppMetaService;
