const Animal = require('../models/Animal');
const DigitalTwin = require('../models/DigitalTwin');
const AIAlert = require('../models/AIAlert');

exports.getAnalyticsSummary = async (req, res) => {
  try {
    const totalAnimals = await Animal.countDocuments({ isActive: true });

    // Group animals by species
    const speciesBreakdown = await Animal.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$species', count: { $sum: 1 } } },
    ]);

    // Group animals by current status
    const statusBreakdown = await Animal.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$currentStatus', count: { $sum: 1 } } },
    ]);

    // Count digital twins by risk level
    const riskBreakdown = await DigitalTwin.aggregate([
      { $group: { _id: '$aiRiskLevel', count: { $sum: 1 } } },
    ]);

    const openAlerts = await AIAlert.countDocuments({ status: 'Open' });
    const criticalAlerts = await AIAlert.countDocuments({ status: 'Open', severity: 'Critical' });

    // Average health score across all animals
    const avgHealthResult = await DigitalTwin.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$healthScore' } } },
    ]);
    const averageHealthScore = avgHealthResult[0] ? Math.round(avgHealthResult[0].avgScore) : 0;

    res.status(200).json({
      success: true,
      totalAnimals,
      speciesBreakdown,
      statusBreakdown,
      riskBreakdown,
      openAlerts,
      criticalAlerts,
      averageHealthScore,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};