const cron = require('node-cron');
const DigitalTwin = require('../models/DigitalTwin');
const AIAlert = require('../models/AIAlert');
const MedicalRecord = require('../models/MedicalRecord');
const { getIO } = require('../utils/socket');

async function createAlertIfNotExists({ animalId, alertType, severity, observation, possibleConcern, recommendedAction }) {
  const existingOpenAlert = await AIAlert.findOne({
    animalId,
    alertType,
    status: 'Open',
    possibleConcern,
  });

  if (existingOpenAlert) return null;

  const alert = await AIAlert.create({
    animalId, alertType, severity, observation, possibleConcern, recommendedAction, status: 'Open',
  });

  const populatedAlert = await alert.populate('animalId', 'name species qrCode');
  getIO().emit('newAlert', populatedAlert);
  return populatedAlert;
}

/**
 * Runs automatically every day. Checks three things:
 * 1. How long since an animal was last observed (existing Phase 8 logic)
 * 2. Whether any prescribed medicine's duration has run out without a follow-up
 * 3. Whether a scheduled next checkup date has passed
 */
async function runDailyMonitoringCheck() {
  console.log('🕐 Running daily monitoring check...');

  // ─── 1. Existing: Monitoring gap check ───
  const twins = await DigitalTwin.find();
  for (const twin of twins) {
    const daysSince = Math.floor((Date.now() - new Date(twin.lastCalculatedAt)) / (1000 * 60 * 60 * 24));
    twin.daysSinceLastObservation = daysSince;
    await twin.save();

    if (daysSince >= 3) {
      await createAlertIfNotExists({
        animalId: twin.animalId,
        alertType: 'Behavior',
        severity: 'Warning',
        observation: `No observation logged in ${daysSince} days`,
        possibleConcern: 'No recent observation logged',
        recommendedAction: 'Caretaker should log a fresh observation as soon as possible',
      });
    }
  }

  // ─── 2. NEW: Medicine overdue check ───
  const recentRecordsWithPrescriptions = await MedicalRecord.find({
    'prescriptions.0': { $exists: true },
  }).sort({ createdAt: -1 });

  const checkedAnimalMedicine = new Set();

  for (const record of recentRecordsWithPrescriptions) {
    const animalKey = record.animalId.toString();
    if (checkedAnimalMedicine.has(animalKey)) continue; // only check the MOST RECENT prescription per animal
    checkedAnimalMedicine.add(animalKey);

    for (const rx of record.prescriptions) {
      if (!rx.durationDays) continue;
      const daysSincePrescribed = Math.floor((Date.now() - new Date(record.createdAt)) / (1000 * 60 * 60 * 24));

      if (daysSincePrescribed > rx.durationDays) {
        await createAlertIfNotExists({
          animalId: record.animalId,
          alertType: 'Medicine Overdue',
          severity: 'Warning',
          observation: `Prescribed course of ${rx.medicineName} (${rx.durationDays} days) ended ${daysSincePrescribed - rx.durationDays} day(s) ago`,
          possibleConcern: 'Medicine course completed — follow-up may be needed',
          recommendedAction: 'Veterinarian should review and confirm if further treatment or follow-up is required',
        });
      }
    }
  }

  // ─── 3. NEW: Checkup overdue check ───
  const overdueCheckups = await MedicalRecord.find({
    nextCheckupDate: { $lt: new Date(), $ne: null },
  }).sort({ nextCheckupDate: -1 });

  const checkedAnimalCheckup = new Set();

  for (const record of overdueCheckups) {
    const animalKey = record.animalId.toString();
    if (checkedAnimalCheckup.has(animalKey)) continue;
    checkedAnimalCheckup.add(animalKey);

    const daysOverdue = Math.floor((Date.now() - new Date(record.nextCheckupDate)) / (1000 * 60 * 60 * 24));

    await createAlertIfNotExists({
      animalId: record.animalId,
      alertType: 'Checkup Overdue',
      severity: daysOverdue > 7 ? 'Critical' : 'Warning',
      observation: `Scheduled checkup was due ${daysOverdue} day(s) ago`,
      possibleConcern: 'Follow-up checkup has not been completed on schedule',
      recommendedAction: 'Schedule the overdue checkup as soon as possible',
    });
  }

  console.log(`✅ Daily monitoring check complete — checked ${twins.length} animals, ${checkedAnimalMedicine.size} medicine schedules, ${checkedAnimalCheckup.size} checkup schedules`);
}

function startDailyMonitoringJob() {
  cron.schedule('0 6 * * *', runDailyMonitoringCheck);
  console.log('📅 Daily monitoring job scheduled (runs every day at 6:00 AM)');
}

module.exports = { startDailyMonitoringJob, runDailyMonitoringCheck };