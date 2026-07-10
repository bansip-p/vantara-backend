const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    animalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Animal',
      required: true,
    },
    reportType: {
      type: String,
      enum: ['Conservation Story', 'Health Summary', 'Rescue Journey'],
      default: 'Conservation Story',
    },
    generatedContent: {
      type: String,
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);