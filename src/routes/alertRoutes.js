const express = require('express');
const router = express.Router();
const { getAllAlerts, getAlertsForAnimal, updateAlertStatus } = require('../controllers/alertController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getAllAlerts);
router.get('/animal/:animalId', getAlertsForAnimal);
router.put('/:id/status', authorize('SuperAdmin', 'Veterinarian'), updateAlertStatus);

module.exports = router;