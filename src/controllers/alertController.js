const AIAlert = require('../models/AIAlert');
const { getIO } = require('../utils/socket');

// GET all open alerts (for the dashboard alert feed)
exports.getAllAlerts = async (req, res) => {
  try {
    const alerts = await AIAlert.find()
      .populate('animalId', 'name species qrCode') // pulls in animal name/species alongside the alert
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET alerts for one specific animal
exports.getAlertsForAnimal = async (req, res) => {
  try {
    const alerts = await AIAlert.find({ animalId: req.params.animalId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE alert status (acknowledge or resolve)
exports.updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const alert = await AIAlert.findByIdAndUpdate(
      req.params.id,
      {
        status,
        acknowledgedBy: req.user.id,
      },
      { new: true }
    ).populate('animalId', 'name species qrCode');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    // 📡 Tell every connected browser this alert's status changed
    getIO().emit('alertUpdated', alert);

    res.status(200).json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};