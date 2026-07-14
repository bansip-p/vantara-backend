const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true }, // e.g. 'kg', 'g', 'liters', 'units'
}, { _id: false });

const nutritionLogSchema = new mongoose.Schema({
  animalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    required: true,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mealType: {
    type: String,
    enum: ['morning', 'midday', 'evening', 'supplement'],
    required: true,
  },
  foodItems: {
    type: [foodItemSchema],
    required: true,
  },
  followedRecommendation: {
    type: Boolean,
    default: true, // did the keeper follow the system-generated diet plan?
  },
  notes: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

nutritionLogSchema.index({ animalId: 1, timestamp: -1 });

module.exports = mongoose.model('NutritionLog', nutritionLogSchema);