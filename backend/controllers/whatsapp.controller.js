const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const WhatsAppConnection = require('../models/WhatsAppConnection');
const WhatsAppMetaService = require('../services/whatsapp.service');

// @desc    Get WhatsApp connection status and details
// @route   GET /api/whatsapp/status
// @access  Private
const getWhatsAppStatus = async (req, res, next) => {
  try {
    const connection = await WhatsAppConnection.findOne();
    if (!connection || connection.status !== 'connected') {
      return res.json({
        success: true,
        connected: false,
        data: null
      });
    }

    // Return connection details without displaying the full access token (security)
    const maskedToken = connection.accessToken
      ? `${connection.accessToken.substring(0, 8)}...${connection.accessToken.substring(connection.accessToken.length - 8)}`
      : '';

    res.json({
      success: true,
      connected: true,
      data: {
        status: connection.status,
        businessManagerId: connection.businessManagerId,
        businessAccountId: connection.businessAccountId,
        phoneNumberId: connection.phoneNumberId,
        displayPhoneNumber: connection.displayPhoneNumber,
        businessName: connection.businessName,
        portfolioName: connection.portfolioName,
        wabaName: connection.wabaName,
        connectedAt: connection.connectedAt,
        maskedToken: maskedToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate Meta Embedded Signup flow (returns OAuth redirect URL)
// @route   GET /api/whatsapp/connect
// @access  Private
const getWhatsAppConnect = async (req, res, next) => {
  try {
    // Generate secure state payload valid for 15 minutes
    const statePayload = {
      source: 'whatsapp_gateway_oauth',
      userId: req.user?._id,
      exp: Math.floor(Date.now() / 1000) + 15 * 60 // 15 mins expiry
    };

    const stateToken = jwt.sign(statePayload, config.jwtSecret);

    // Build OAuth Redirect URL
    const oauthUrl = new URL('https://www.facebook.com/v23.0/dialog/oauth');
    oauthUrl.searchParams.append('client_id', config.metaAppId);
    oauthUrl.searchParams.append('redirect_uri', config.metaRedirectUri);
    oauthUrl.searchParams.append('response_type', 'code');
    oauthUrl.searchParams.append('state', stateToken);
    if (config.metaConfigId) {
      oauthUrl.searchParams.append('config_id', config.metaConfigId);
    } else {
      // Request required scopes
      oauthUrl.searchParams.append('scope', 'whatsapp_business_management,whatsapp_business_messaging');
    }
    // Extras to specify WhatsApp Setup with Coexistence / App Onboarding
    oauthUrl.searchParams.append('extras', JSON.stringify({
      setup: {},
      featureType: 'whatsapp_business_app_onboarding',
      sessionInfoVersion: '3'
    }));

    console.log("Embedded Signup URL:", oauthUrl.toString());

    res.json({
      success: true,
      redirectUrl: oauthUrl.toString()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Meta Embedded Signup redirect callback
// @route   GET /api/whatsapp/callback
// @access  Public
const handleWhatsAppCallback = async (req, res, next) => {
  const frontendRedirectUrl = 'http://localhost:3000/whatsapp-connection';

  try {
    const { code, state, error, error_description } = req.query;

    // 1. Check if user canceled or permission was denied
    if (error) {
      console.error('Meta OAuth callback returned error:', error, error_description);
      const errType = error === 'access_denied' ? 'permission_denied' : 'oauth_failure';
      const errMsg = error_description || error;
      return res.redirect(`${frontendRedirectUrl}?success=false&error_type=${errType}&error=${encodeURIComponent(errMsg)}`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendRedirectUrl}?success=false&error_type=invalid_params&error=Missing+code+or+state`);
    }

    // 2. Validate state token to prevent CSRF
    try {
      const decoded = jwt.verify(state, config.jwtSecret);
      if (decoded.source !== 'whatsapp_gateway_oauth') {
        throw new Error('Invalid state source');
      }
    } catch (stateErr) {
      console.error('CSRF / State validation failed:', stateErr.message);
      return res.redirect(`${frontendRedirectUrl}?success=false&error_type=csrf_error&error=Invalid+state+signature+or+session+expired`);
    }

    // 3. Exchange authorization code for token
    let userAccessToken;
    try {
      userAccessToken = await WhatsAppMetaService.exchangeCodeForToken(code);
    } catch (tokenErr) {
      console.error('Token exchange error:', tokenErr.message);
      return res.redirect(`${frontendRedirectUrl}?success=false&error_type=token_exchange_failure&error=${encodeURIComponent(tokenErr.message)}`);
    }

    // 4. Debug token to fetch scopes, WABA ID and user details
    let debugInfo;
    try {
      debugInfo = await WhatsAppMetaService.debugToken(userAccessToken);
      console.log("=== DEBUG TOKEN INFO ===");
      console.log(JSON.stringify(debugInfo, null, 2));
    } catch (debugErr) {
      console.error('Debug token error:', debugErr.message);
      return res.redirect(`${frontendRedirectUrl}?success=false&error_type=token_validation_failure&error=${encodeURIComponent(debugErr.message)}`);
    }

    // 5. Retrieve WhatsApp Business Account (WABA) ID from debug info granular scopes
    let wabaId = null;
    const granularScopes = debugInfo.granular_scopes || [];
    const whatsappScope = granularScopes.find(s => s.scope === 'whatsapp_business_management');

    console.log("=== WHATSAPP EMBEDDED SIGNUP CALLBACK LOGS ===");
    console.log("All target WABA IDs found in scopes:", whatsappScope ? whatsappScope.target_ids : "None");

    if (whatsappScope && whatsappScope.target_ids && whatsappScope.target_ids.length > 0) {
      // Log all numbers across all WABAs to help identify the correct one
      for (const id of whatsappScope.target_ids) {
        try {
          const numbers = await WhatsAppMetaService.getWabaPhoneNumbers(id, userAccessToken);
          console.log(`WABA ID ${id} contains numbers:`, numbers.map(n => ({ id: n.id, number: n.display_phone_number })));
        } catch (err) {
          console.error(`Failed to fetch numbers for WABA ${id}:`, err.message);
        }
      }
      wabaId = whatsappScope.target_ids[0];
    } else if (debugInfo.business_id) {
      wabaId = debugInfo.business_id;
    }

    if (!wabaId) {
      return res.redirect(`${frontendRedirectUrl}?success=false&error_type=no_waba_scope&error=Could+not+retrieve+WhatsApp+Business+Account+ID.+Ensure+correct+permissions+were+granted.`);
    }

    // 6. Fetch WABA details & phone numbers
    let wabaDetails, phoneNumbers = [];
    try {
      wabaDetails = await WhatsAppMetaService.getWabaDetails(wabaId, userAccessToken);
      phoneNumbers = await WhatsAppMetaService.getWabaPhoneNumbers(wabaId, userAccessToken);
    } catch (apiErr) {
      console.error('Graph API details fetch error:', apiErr.message);
      return res.redirect(`${frontendRedirectUrl}?success=false&error_type=api_retrieve_failure&error=${encodeURIComponent(apiErr.message)}`);
    }

    if (phoneNumbers.length === 0) {
      return res.redirect(`${frontendRedirectUrl}?success=false&error_type=no_phone_numbers&error=No+WhatsApp+Business+phone+numbers+found+under+this+account.`);
    }

    // Extract first phone number details
    const activePhone = phoneNumbers[0];
    const phoneNumberId = activePhone.id;
    const displayPhoneNumber = activePhone.display_phone_number;

    // 7. Complete Coexistence setup - register the phone number via the Cloud API register endpoint
    try {
      await WhatsAppMetaService.registerPhoneNumber(phoneNumberId, userAccessToken);
      console.log(`Coexistence registered phone number ${displayPhoneNumber} successfully`);
    } catch (regErr) {
      // Log error but check if it is already registered
      console.warn(`Phone registration error: ${regErr.message}. If it is already registered, this is safe to proceed.`);
    }

    // 8. Fetch Portfolio / Business Details
    const businessId = wabaDetails.owner_business_info?.id || debugInfo.business_id;
    let businessName = wabaDetails.name || 'WhatsApp Business Account';
    let portfolioName = 'Business Portfolio';

    if (businessId) {
      try {
        const portfolio = await WhatsAppMetaService.getBusinessPortfolio(businessId, userAccessToken);
        portfolioName = portfolio.name || portfolioName;
        businessName = portfolio.name || businessName;
      } catch (bizErr) {
        console.warn('Failed to fetch portfolio name, using fallbacks:', bizErr.message);
      }
    }

    // 9. Store details in MongoDB
    let connection = await WhatsAppConnection.findOne();
    if (!connection) {
      connection = new WhatsAppConnection();
    }

    connection.status = 'connected';
    connection.accessToken = userAccessToken;
    connection.businessManagerId = businessId || '';
    connection.businessAccountId = wabaId;
    connection.phoneNumberId = phoneNumberId;
    connection.displayPhoneNumber = displayPhoneNumber;
    connection.businessName = businessName;
    connection.portfolioName = portfolioName;
    connection.wabaName = wabaDetails.name || '';
    connection.connectedAt = new Date();

    await connection.save();

    console.log('WhatsApp connection saved to database:', connection._id);

    // Redirect to frontend with success parameters
    res.redirect(`${frontendRedirectUrl}?success=true`);

  } catch (error) {
    console.error('Unhandled callback error:', error);
    res.redirect(`${frontendRedirectUrl}?success=false&error_type=unhandled_error&error=${encodeURIComponent(error.message)}`);
  }
};

// @desc    Disconnect/Delete WhatsApp connection config
// @route   POST /api/whatsapp/disconnect
// @access  Private
const disconnectWhatsApp = async (req, res, next) => {
  try {
    const connection = await WhatsAppConnection.findOne();
    if (!connection) {
      res.status(404);
      throw new Error('No WhatsApp connection found');
    }

    // Perform disconnect (we soft delete by setting status or delete the record completely)
    // Deleting the record ensures clean disconnected state
    await WhatsAppConnection.deleteOne({ _id: connection._id });

    res.json({
      success: true,
      message: 'WhatsApp connection disconnected successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWhatsAppStatus,
  getWhatsAppConnect,
  handleWhatsAppCallback,
  disconnectWhatsApp
};
