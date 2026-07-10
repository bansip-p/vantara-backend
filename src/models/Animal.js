const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Animal name is required'],
      trim: true,
    },
    species: {
      type: String,
      required: [true, 'Species is required'],
      trim: true,
    },
    scientificName: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Unknown'],
      default: 'Unknown',
    },
    dateOfBirth: {
      type: Date,
    },
    estimatedAge: {
      type: Number, // used when exact birth date is unknown
    },
    dateOfArrival: {
      type: Date,
      required: [true, 'Date of arrival is required'],
      default: Date.now,
    },
    qrCode: {
      type: String,
      unique: true,
      required: true,
    },
    currentStatus: {
      type: String,
      enum: ['Stable', 'Under Observation', 'Critical', 'Recovering', 'Deceased'],
      default: 'Stable',
    },
    enclosureLocation: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String, // URL to photo, added later when we set up file uploads
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Animal', animalSchema);