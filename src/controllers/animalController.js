const Animal = require('../models/Animal');
const DigitalTwin = require('../models/DigitalTwin');
const { calculateHealthScore } = require('../services/healthScoreEngine');
const crypto = require('crypto');
const AIAlert = require('../models/AIAlert');
const { getIO } = require('../utils/socket');

// CREATE a new animal + its initial digital twin
exports.createAnimal = async (req, res) => {
  try {
    const {
      name, species, scientificName, gender, dateOfBirth, estimatedAge, dateOfArrival, enclosureLocation,
      microchipNumber, rescueNumber, conservationStatus, origin, governmentCaseNumber, forestDepartmentDetails, previousOwner,
      currentWeightKg, heightCm, bodyConditionScore, bloodGroup, allergyInformation, medicalNotes, currentDiet,
      currentVeterinarian, currentKeeper, speciesCategory, behaviorStatus, pregnancyStatus, parentInformation,
    } = req.body;

    const qrCode = `VANTARA-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const animal = await Animal.create({
      name, species, scientificName, gender, dateOfBirth, estimatedAge, dateOfArrival, enclosureLocation, qrCode,
      microchipNumber, rescueNumber, conservationStatus, origin, governmentCaseNumber, forestDepartmentDetails, previousOwner,
      currentWeightKg, heightCm, bodyConditionScore, bloodGroup, allergyInformation, medicalNotes, currentDiet,
      currentVeterinarian: currentVeterinarian || undefined,
      currentKeeper: currentKeeper || undefined,
      speciesCategory, behaviorStatus, pregnancyStatus, parentInformation,
    });

    const twin = await DigitalTwin.create({
      animalId: animal._id,
      healthScore: 100,
      activityLevel: 'Normal',
      dietStatus: 'Good',
      stressLevel: 'Low',
      aiPredictionText: 'Healthy next 30 days',
      aiRiskLevel: 'Low',
    });

    res.status(201).json({ success: true, animal, digitalTwin: twin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all animals (for dashboard list view)
exports.getAllAnimals = async (req, res) => {
  try {
    const animals = await Animal.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: animals.length, animals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET one animal's full profile (Animal + Digital Twin combined)
exports.getAnimalProfile = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id)
      .populate('currentVeterinarian', 'name')
      .populate('currentKeeper', 'name');

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    const digitalTwin = await DigitalTwin.findOne({ animalId: animal._id });

    res.status(200).json({ success: true, animal, digitalTwin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET animal profile by QR code
exports.getAnimalByQRCode = async (req, res) => {
  try {
    const { qrCode } = req.params;
    if (!qrCode || qrCode.trim() === '') {
      return res.status(400).json({ success: false, message: 'QR code is required.' });
    }

    const animal = await Animal.findOne({ qrCode });
    if (!animal) {
      return res.status(404).json({ success: false, message: 'No animal found for this QR code' });
    }

    const digitalTwin = await DigitalTwin.findOne({ animalId: animal._id });
    res.status(200).json({ success: true, animal, digitalTwin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE an animal's details
exports.updateAnimal = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'species', 'scientificName', 'gender', 'estimatedAge', 'dateOfArrival', 'enclosureLocation', 'currentStatus',
      'microchipNumber', 'rescueNumber', 'conservationStatus', 'origin', 'governmentCaseNumber', 'forestDepartmentDetails', 'previousOwner',
      'currentWeightKg', 'heightCm', 'bodyConditionScore', 'bloodGroup', 'allergyInformation', 'medicalNotes', 'currentDiet',
      'currentVeterinarian', 'currentKeeper', 'speciesCategory', 'behaviorStatus', 'pregnancyStatus', 'parentInformation',
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // ObjectId reference fields can't accept an empty string — an empty selection
    // in the Edit Animal form means "no vet/keeper assigned," so treat "" as null
    // rather than letting Mongoose try (and fail) to cast it to an ObjectId.
    const objectIdFields = ['currentVeterinarian', 'currentKeeper'];
    objectIdFields.forEach((field) => {
      if (updates[field] === '') updates[field] = null;
    });

    const animal = await Animal.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    res.status(200).json({ success: true, animal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// SOFT DELETE an animal — marks inactive, never permanently erases the record
exports.deleteAnimal = async (req, res) => {
  try {
    const animal = await Animal.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    res.status(200).json({ success: true, message: 'Animal removed successfully', animal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE the digital twin's health score based on new signals (this is where the "AI" runs)
exports.recalculateHealthScore = async (req, res) => {
  try {
    const { movementChangePercent, foodIntakeChangePercent, weightChangePercent, stressLevel } = req.body;

    const result = calculateHealthScore({
      movementChangePercent,
      foodIntakeChangePercent,
      weightChangePercent,
      stressLevel,
    });

    const twin = await DigitalTwin.findOneAndUpdate(
      { animalId: req.params.id },
      {
        healthScore: result.healthScore,
        aiRiskLevel: result.riskLevel,
        aiPredictionText: result.predictionText,
        contributingFactors: result.contributingFactors,
        stressLevel,
        lastCalculatedAt: new Date(),
        $push: {
          snapshotHistory: {
            date: new Date(),
            healthScore: result.healthScore,
            activityLevel: 'Normal',
            stressLevel,
          },
        },
      },
      { new: true }
    );

    if (!twin) {
      return res.status(404).json({ success: false, message: 'Digital twin not found for this animal' });
    }

    let createdAlert = null;
    if (result.riskLevel === 'Medium' || result.riskLevel === 'High') {
      createdAlert = await AIAlert.create({
        animalId: req.params.id,
        alertType: 'Health Prediction',
        severity: result.riskLevel === 'High' ? 'Critical' : 'Warning',
        observation: result.contributingFactors.join(', ') || 'Health score dropped',
        possibleConcern:
          result.riskLevel === 'High' ? 'Significant health discomfort' : 'Early signs of health decline',
        recommendedAction:
          result.riskLevel === 'High'
            ? 'Immediate veterinary examination required'
            : 'Schedule a veterinary check-up soon',
        status: 'Open',
      });

      const populatedAlert = await createdAlert.populate('animalId', 'name species qrCode');
      getIO().emit('newAlert', populatedAlert);
    }

    res.status(200).json({ success: true, digitalTwin: twin, alertCreated: createdAlert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPLOAD or REPLACE an animal's profile photo
exports.uploadAnimalPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const animal = await Animal.findByIdAndUpdate(
      req.params.id,
      { profileImage: imageUrl },
      { new: true }
    );

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    res.status(200).json({ success: true, animal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};