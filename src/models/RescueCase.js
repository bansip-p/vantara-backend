const mongoose = require('mongoose');

const rescueCaseSchema = new mongoose.Schema(
  {
    animalType: { type: String, required: true },
    linkedAnimalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal' },
    location: { address: String, latitude: Number, longitude: Number },
    conditionDescription: { type: String, required: true },
    emergencyLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    aiRecommendation: {
      recommendedTeam: String,
      equipment: [String],
      riskLevel: String,
      transportRequired: Boolean,
      medicalPreparation: [String],
    },
    assignedTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Reported', 'Team Dispatched', 'Rescued', 'Under Treatment', 'Closed'], default: 'Reported' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RescueCase', rescueCaseSchema);