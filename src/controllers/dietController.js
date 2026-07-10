const Animal = require('../models/Animal');
const DigitalTwin = require('../models/DigitalTwin');
const { generateDietPlan } = require('../services/dietEngine');

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