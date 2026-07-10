const mongoose = require('mongoose');

const dailyCareSchema = new mongoose.Schema(
  {
    animalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Animal',
      required: true,
    },
    caretakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date(new Date().setHours(0, 0, 0, 0)), // stores just the day, no time
    },
    foodGiven: { type: Boolean, default: false },
    waterGiven: { type: Boolean, default: false },
    medicineGiven: { type: Boolean, default: false },
    enclosureCleaned: { type: Boolean, default: false },
    behaviorNotes: { type: String, default: '' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);
dailyCareSchema.index({ animalId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyCare', dailyCareSchema);