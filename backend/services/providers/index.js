const MetaProvider = require('./meta.provider');

/**
 * Registry to instantiate appropriate providers.
 * For V1, this is pre-wired to return MetaProvider, but can easily be configured
 * to support Twilio, Gupshup, etc. in future versions by switching on a provider field.
 */
class ProviderRegistry {
  /**
   * Instantiate and return the appropriate provider instance.
   * @param {Object} clinic - The clinic configuration object.
   * @returns {BaseProvider}
   */
  static getProvider(clinic) {
    // In V1, we default to 'meta' provider.
    // In V2+, we can check clinic.provider (e.g. 'gupshup', 'twilio') to resolve other providers.
    const providerType = clinic.provider || 'meta';

    switch (providerType.toLowerCase()) {
      case 'meta':
        return new MetaProvider({
          accessToken: clinic.accessToken,
          phoneNumberId: clinic.phoneNumberId,
          businessAccountId: clinic.businessAccountId,
          senderMobile: clinic.senderMobile
        });
      default:
        throw new Error(`Unsupported WhatsApp provider: ${providerType}`);
    }
  }
}

module.exports = ProviderRegistry;
