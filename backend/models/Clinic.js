const mongoose = require('mongoose');

const ClinicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    senderMobile: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumberId: {
      type: String,
      required: true,
      trim: true
    },
    businessAccountId: {
      type: String,
      required: true,
      trim: true
    },
    accessToken: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    apiKey: {
      type: String,
      unique: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const crypto = require('crypto');

ClinicSchema.pre('save', function (next) {
  if (!this.apiKey) {
    this.apiKey = 'hms_key_' + crypto.randomBytes(16).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Clinic', ClinicSchema);
