const express = require('express');
const router = express.Router();
const { runDailyMonitoringCheck } = require('../jobs/dailyMonitoringJob');
const { protect, authorize } = require('../middleware/authMiddleware');
const MedicalRecord = require('../models/MedicalRecord');

router.use(protect);

// Manually trigger the daily check immediately, for testing/demo purposes
router.post('/run-daily-check', authorize('SuperAdmin'), async (req, res) => {
  await runDailyMonitoringCheck();
  res.status(200).json({ success: true, message: 'Daily monitoring check completed' });
});

// TEMPORARY — creates a backdated medical record with an overdue prescription,
// then immediately runs the check, so Medicine Overdue can be verified same-day.
// Remove this route once testing is done.
router.post('/seed-overdue-medicine/:animalId', authorize('SuperAdmin'), async (req, res) => {
  try {
    const backdatedDate = new Date();
    backdatedDate.setDate(backdatedDate.getDate() - 10); // 10 days ago

    const record = await MedicalRecord.create({
      animalId: req.params.animalId,
      recordedBy: req.user.id,
      visitType: 'Routine Checkup',
      diagnosis: 'Test seed record for Medicine Overdue verification',
      prescriptions: [
        {
          medicineName: 'TestMedicine',
          dosage: '100mg',
          frequency: 'Once daily',
          durationDays: 5, // course should have ended 5 days ago (10 days elapsed - 5 day course)
        },
      ],
    });

    // Force createdAt to the backdated value directly using the raw MongoDB driver.
    // Mongoose's timestamps:true marks createdAt as immutable and silently strips it
    // from updateOne()/$set — going through .collection bypasses that Mongoose layer.
    await MedicalRecord.collection.updateOne(
      { _id: record._id },
      { $set: { createdAt: backdatedDate } }
    );

    // Now run the check immediately
    await runDailyMonitoringCheck();

    res.status(200).json({
      success: true,
      message: 'Seeded backdated record and ran check. Look for a new Medicine Overdue alert.',
      recordId: record._id,
      backdatedTo: backdatedDate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;