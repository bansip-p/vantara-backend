const DailyCare = require('../models/DailyCare');
const Animal = require('../models/Animal');

const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0));

// GET or CREATE today's checklist for an animal
exports.getTodayChecklist = async (req, res) => {
  try {
    const { animalId } = req.params;
    const today = startOfToday();

    let checklist = await DailyCare.findOneAndUpdate(
      { animalId, date: today },
      { $setOnInsert: { animalId, caretakerId: req.user.id, date: today } },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, checklist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE checklist items (tapping checkboxes)
exports.updateChecklist = async (req, res) => {
  try {
    const updates = req.body; // e.g. { foodGiven: true }

    const checklist = await DailyCare.findByIdAndUpdate(
      req.params.id,
      { ...updates, completedAt: new Date() },
      { new: true }
    );

    res.status(200).json({ success: true, checklist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};