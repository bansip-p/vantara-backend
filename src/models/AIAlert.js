const mongoose = require('mongoose');

const aiAlertSchema = new mongoose.Schema(
  {
    animalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Animal',
      required: false, // optional now — Inventory alerts aren't tied to a specific animal
    },
    alertType: {
      type: String,
      enum: ['Behavior', 'Health Prediction', 'Diet', 'Medical', 'Medicine Overdue', 'Checkup Overdue', 'Inventory'],
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