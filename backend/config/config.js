require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whatsapp-gateway',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_for_whatsapp_gateway_dashboard',
  gatewayApiKey: process.env.GATEWAY_API_KEY || 'hms_gateway_secret_api_key_2026',
  nodeEnv: process.env.NODE_ENV || 'development',
  metaAppId: process.env.META_APP_ID || '123456789012345',
  metaAppSecret: process.env.META_APP_SECRET || 'placeholder_meta_app_secret',
  metaRedirectUri: process.env.META_REDIRECT_URI || 'http://localhost:5000/api/whatsapp/callback',
  metaConfigId: process.env.META_CONFIG_ID || ''
};
