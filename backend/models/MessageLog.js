const mongoose = require('mongoose');

const MessageLogSchema = new mongoose.Schema(
  {
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true
    },
    recipientMobile: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    providerMessageId: {
      type: String,
      trim: true,
      default: null
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      required: true
    },
    apiResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

module.exports = mongoose.model('MessageLog', MessageLogSchema);
