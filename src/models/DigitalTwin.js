const mongoose = require('mongoose');

const digitalTwinSchema = new mongoose.Schema(
  {
    animalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Animal',
      required: true,
      unique: true, // one live twin per animal
    },
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    activityLevel: {
      type: String,
      enum: ['Low', 'Normal', 'High'],
      default: 'Normal',
    },
    dietStatus: {
      type: String,
      enum: ['Poor', 'Fair', 'Good', 'Excellent'],
      default: 'Good',
    },
    stressLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
    },
    aiPredictionText: {
      type: String,
      default: 'Insufficient data for prediction',
    },
    aiRiskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
    },
    contributingFactors: {
      type: [String],
      default: [],
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
    daysSinceLastObservation: {
      type: Number,
      default: 0,
    },
    snapshotHistory: [
      {
        date: { type: Date, default: Date.now },
        healthScore: Number,
        activityLevel: String,
        stressLevel: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('DigitalTwin', digitalTwinSchema);