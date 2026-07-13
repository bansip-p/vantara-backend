const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema(
  {
    // ─── EXISTING FIELDS (unchanged) ───
    name: { type: String, required: [true, 'Animal name is required'], trim: true },
    species: { type: String, required: [true, 'Species is required'], trim: true },
    scientificName: { type: String, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Unknown'], default: 'Unknown' },
    dateOfBirth: { type: Date },
    estimatedAge: { type: Number },
    dateOfArrival: { type: Date, required: [true, 'Date of arrival is required'], default: Date.now },
    qrCode: { type: String, unique: true, required: true },
    currentStatus: {
      type: String,
      enum: ['Stable', 'Under Observation', 'Critical', 'Recovering', 'Deceased'],
      default: 'Stable',
    },
    enclosureLocation: { type: String, trim: true },
    profileImage: { type: String },
    isActive: { type: Boolean, default: true },

    // ─── NEW: Identity & Legal ───
    microchipNumber: { type: String, trim: true },
    rescueNumber: { type: String, trim: true },
    conservationStatus: {
      type: String,
      enum: ['Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered', 'Unknown'],
      default: 'Unknown',
    },
    origin: { type: String, trim: true }, // e.g. "Wild rescue - Gir Forest"
    governmentCaseNumber: { type: String, trim: true },
    forestDepartmentDetails: { type: String, trim: true },
    previousOwner: { type: String, trim: true },

    // ─── NEW: Physical & Medical ───
    currentWeightKg: { type: Number },
    heightCm: { type: Number },
    bodyConditionScore: { type: Number, min: 1, max: 9 }, // standard 1-9 veterinary scale
    bloodGroup: { type: String, trim: true },
    allergyInformation: { type: String, trim: true },
    medicalNotes: { type: String, trim: true },
    currentDiet: { type: String, trim: true },

    // ─── NEW: Care Team ───
    currentVeterinarian: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    currentKeeper: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ─── NEW: Behavior & Family ───
    speciesCategory: {
      type: String,
      enum: ['Mammal', 'Bird', 'Reptile', 'Amphibian', 'Fish', 'Other'],
      default: 'Mammal',
    },
    behaviorStatus: {
      type: String,
      enum: ['Calm', 'Normal', 'Alert', 'Aggressive', 'Fearful', 'Withdrawn'],
      default: 'Normal',
    },
    pregnancyStatus: {
      type: String,
      enum: ['Not Applicable', 'Not Pregnant', 'Pregnant', 'Nursing'],
      default: 'Not Applicable',
    },
    parentInformation: { type: String, trim: true }, // free text, e.g. "Mother: Rani (ID xxxx)"
  },
  { timestamps: true }
);

module.exports = mongoose.model('Animal', animalSchema);