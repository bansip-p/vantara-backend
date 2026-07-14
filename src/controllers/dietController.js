const Animal = require('../models/Animal');
const DigitalTwin = require('../models/DigitalTwin');
const NutritionLog = require('../models/NutritionLog');
const AIAlert = require('../models/AIAlert');
const { generateDietPlan } = require('../services/dietEngine');

// EXISTING — unchanged
exports.getDietRecommendation = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.animalId);
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    const twin = await DigitalTwin.findOne({ animalId: animal._id });
    if (!twin) {
      return res.status(404).json({ success: false, message: 'Digital twin not found for this animal' });
    }

    const dietPlan = generateDietPlan({
      species: animal.species,
      estimatedAge: animal.estimatedAge,
      healthScore: twin.healthScore,
      activityLevel: twin.activityLevel,
      dietStatus: twin.dietStatus,
      stressLevel: twin.stressLevel,
    });

    res.status(200).json({ success: true, dietPlan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW — log an actual feeding event
exports.logMeal = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.animalId);
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    const log = await NutritionLog.create({
      ...req.body,
      animalId: req.params.animalId,
      recordedBy: req.user.id,
    });

    const populated = await log.populate('recordedBy', 'name role');

    res.status(201).json({ success: true, log: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW — full feeding history for one animal, newest first
exports.getNutritionHistory = async (req, res) => {
  try {
    const logs = await NutritionLog.find({ animalId: req.params.animalId })
      .populate('recordedBy', 'name role')
      .sort({ timestamp: -1 });

    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW — compliance check: has this animal missed meals recently?
// Generates an Alert (same collection/pattern as Phase 5 overdue checkups/medicine)
// if no feeding has been logged within the expected window.
exports.getComplianceSummary = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.animalId);
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    const EXPECTED_MEALS_PER_DAY = 3;
    const WINDOW_HOURS = 24;
    const windowStart = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);

    const recentLogs = await NutritionLog.find({
      animalId: req.params.animalId,
      timestamp: { $gte: windowStart },
    });

    const mealsLogged = recentLogs.length;
    const isCompliant = mealsLogged >= EXPECTED_MEALS_PER_DAY;

    let alertCreated = null;

    if (!isCompliant) {
      // Avoid duplicate alerts: only create if there isn't already an open/acknowledged
      // Diet alert for this animal.
      const existingAlert = await AIAlert.findOne({
        animalId: animal._id,
        alertType: 'Diet',
        status: { $ne: 'Resolved' },
      });

      if (!existingAlert) {
        alertCreated = await AIAlert.create({
          animalId: animal._id,
          alertType: 'Diet',
          severity: mealsLogged === 0 ? 'Critical' : 'Warning',
          observation: `${animal.name} has only ${mealsLogged}/${EXPECTED_MEALS_PER_DAY} expected meals logged in the last ${WINDOW_HOURS}h`,
          possibleConcern: mealsLogged === 0
            ? 'No feeding recorded in the last 24 hours; animal may be underfed or logs are being missed'
            : 'Feeding frequency below expected schedule; possible partial missed meals',
          recommendedAction: 'Verify feeding status in person and log any completed meals; escalate to vet if animal shows signs of distress',
          status: 'Open',
        });
      }
    }

    res.status(200).json({
      success: true,
      animalId: animal._id,
      mealsLogged,
      expectedMeals: EXPECTED_MEALS_PER_DAY,
      isCompliant,
      alertCreated: !!alertCreated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};