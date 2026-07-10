const mongoose = require('mongoose');

const aiAlertSchema = new mongoose.Schema(
  {
    animalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Animal',
      required: true,
    },
    alertType: {
      type: String,
      enum: ['Behavior', 'Health Prediction', 'Diet', 'Medical'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['Info', 'Warning', 'Critical'],
      required: true,
    },
    observation: {
      type: String,
      required: true,
    },
    possibleConcern: {
      type: String,
      required: true,
    },
    recommendedAction: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Acknowledged', 'Resolved'],
      default: 'Open',
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIAlert', aiAlertSchema);