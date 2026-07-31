const mongoose = require('mongoose');

const WhatsAppConnectionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['connected', 'disconnected'],
      default: 'disconnected',
      required: true
    },
    accessToken: {
      type: String,
      trim: true
    },
    businessManagerId: {
      type: String,
      trim: true
    },
    businessAccountId: {
      type: String,
      trim: true
    },
    phoneNumberId: {
      type: String,
      trim: true
    },
    displayPhoneNumber: {
      type: String,
      trim: true
    },
    businessName: {
      type: String,
      trim: true
    },
    portfolioName: {
      type: String,
      trim: true
    },
    wabaName: {
      type: String,
      trim: true
    },
    connectedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('WhatsAppConnection', WhatsAppConnectionSchema);
