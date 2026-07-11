const RescueCase = require('../models/RescueCase');
const { generateRescuePlan } = require('../services/rescueEngine');

exports.reportRescueCase = async (req, res) => {
  try {
    const { animalType, location, conditionDescription, emergencyLevel } = req.body;
    const aiRecommendation = generateRescuePlan({ animalType, conditionDescription, emergencyLevel });

    const rescueCase = await RescueCase.create({
      animalType,
      location,
      conditionDescription,
      emergencyLevel,
      aiRecommendation,
      status: 'Reported',
      reportedBy: req.user.id,
    });

    res.status(201).json({ success: true, rescueCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllRescueCases = async (req, res) => {
  try {
    const cases = await RescueCase.find().populate('reportedBy', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: cases.length, cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRescueStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const rescueCase = await RescueCase.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!rescueCase) return res.status(404).json({ success: false, message: 'Rescue case not found' });
    res.status(200).json({ success: true, rescueCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};