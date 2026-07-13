const MedicalRecord = require('../models/MedicalRecord');
const Animal = require('../models/Animal');

// CREATE a new medical record entry
exports.createRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.create({
      ...req.body,
      animalId: req.params.animalId,
      recordedBy: req.user.id,
    });

    // If this visit sets a next checkup date, keep the animal's own record loosely in sync (optional convenience)
    const populated = await record.populate('recordedBy', 'name role');

    res.status(201).json({ success: true, record: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all medical records for one animal, newest first
exports.getRecordsForAnimal = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ animalId: req.params.animalId })
      .populate('recordedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all upcoming checkups across all animals — for the future Dashboard widget
exports.getUpcomingCheckups = async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      nextCheckupDate: { $gte: new Date() },
    })
      .populate('animalId', 'name species')
      .sort({ nextCheckupDate: 1 })
      .limit(20);

    res.status(200).json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE a record (correcting a mistake — SuperAdmin only, enforced in routes)
exports.deleteRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    res.status(200).json({ success: true, message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};