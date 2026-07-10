const Animal = require('../models/Animal');
const DigitalTwin = require('../models/DigitalTwin');
const { calculateHealthScore } = require('../services/healthScoreEngine');
const crypto = require('crypto');
const AIAlert = require('../models/AIAlert');
const { getIO } = require('../utils/socket');

// CREATE a new animal + its initial digital twin
exports.createAnimal = async (req, res) => {
  try {
    const { name, species, scientificName, gender, dateOfBirth, estimatedAge, dateOfArrival, enclosureLocation } = req.body;

    // Generate a unique QR code string (e.g. VANTARA-A1B2C3D4)
    const qrCode = `VANTARA-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const animal = await Animal.create({
      name,
      species,
      scientificName,
      gender,
      dateOfBirth,
      estimatedAge,
      dateOfArrival,
      enclosureLocation,
      qrCode,
    });

    // Every new animal automatically gets a starting Digital Twin
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
    const animal = await Animal.findById(req.params.id);
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    const digitalTwin = await DigitalTwin.findOne({ animalId: animal._id });

    res.status(200).json({ success: true, animal, digitalTwin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET animal profile by QR code (Feature 8)
exports.getAnimalByQRCode = async (req, res) => {
  try {
    const animal = await Animal.findOne({ qrCode: req.params.qrCode });
    if (!animal) {
      return res.status(404).json({ success: false, message: 'No animal found for this QR code' });
    }

    const digitalTwin = await DigitalTwin.findOne({ animalId: animal._id });

    res.status(200).json({ success: true, animal, digitalTwin });
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

    // 🚨 NEW: Automatically create an alert if risk is Medium or High
    let createdAlert = null;
    if (result.riskLevel === 'Medium' || result.riskLevel === 'High') {
      const animal = await Animal.findById(req.params.id);

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

      // 📡 Broadcast the new alert LIVE to every connected browser
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