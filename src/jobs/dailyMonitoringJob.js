const cron = require('node-cron');
const DigitalTwin = require('../models/DigitalTwin');
const AIAlert = require('../models/AIAlert');
const { getIO } = require('../utils/socket');

/**
 * Runs automatically every day.
 * For each animal, checks how long it's been since the last observation.
 * If it's been too long, this itself becomes a risk factor — an unmonitored
 * animal is a blind spot, and the system should flag that honestly.
 */
async function runDailyMonitoringCheck() {
  console.log('🕐 Running daily monitoring check...');

  const twins = await DigitalTwin.find();

  for (const twin of twins) {
    const daysSince = Math.floor((Date.now() - new Date(twin.lastCalculatedAt)) / (1000 * 60 * 60 * 24));

    twin.daysSinceLastObservation = daysSince;
    await twin.save();

    // If an animal hasn't been checked in 3+ days, raise a monitoring alert
    if (daysSince >= 3) {
      const existingOpenAlert = await AIAlert.findOne({
        animalId: twin.animalId,
        alertType: 'Behavior',
        status: 'Open',
        possibleConcern: 'No recent observation logged',
      });

      if (!existingOpenAlert) {
        const alert = await AIAlert.create({
          animalId: twin.animalId,
          alertType: 'Behavior',
          severity: 'Warning',
          observation: `No observation logged in ${daysSince} days`,
          possibleConcern: 'No recent observation logged',
          recommendedAction: 'Caretaker should log a fresh observation as soon as possible',
          status: 'Open',
        });

        const populatedAlert = await alert.populate('animalId', 'name species qrCode');
        getIO().emit('newAlert', populatedAlert);
      }
    }
  }

  console.log(`✅ Daily monitoring check complete — checked ${twins.length} animals`);
}

function startDailyMonitoringJob() {
  // Runs every day at 6:00 AM server time
  cron.schedule('0 6 * * *', runDailyMonitoringCheck);
  console.log('📅 Daily monitoring job scheduled (runs every day at 6:00 AM)');
}

module.exports = { startDailyMonitoringJob, runDailyMonitoringCheck };