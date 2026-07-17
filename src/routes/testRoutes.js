const express = require('express');
const router = express.Router();
const { runDailyMonitoringCheck } = require('../jobs/dailyMonitoringJob');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Manually trigger the daily check immediately, for testing/demo purposes
router.post('/run-daily-check', authorize('SuperAdmin'), async (req, res) => {
  await runDailyMonitoringCheck();
  res.status(200).json({ success: true, message: 'Daily monitoring check completed' });
});

module.exports = router;