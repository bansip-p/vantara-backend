const express = require('express');
const router = express.Router();
const {
  createRecord,
  getRecordsForAnimal,
  getUpcomingCheckups,
  deleteRecord,
} = require('../controllers/medicalRecordController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/animal/:animalId', authorize('SuperAdmin', 'Veterinarian'), createRecord);
router.get('/animal/:animalId', getRecordsForAnimal);
router.get('/upcoming-checkups', getUpcomingCheckups);
router.delete('/:id', authorize('SuperAdmin'), deleteRecord);

module.exports = router;