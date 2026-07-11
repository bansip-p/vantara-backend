const upload = require('../middleware/uploadMiddleware');

const express = require('express');
const router = express.Router();
const {
  createAnimal,
  getAllAnimals,
  getAnimalProfile,
  getAnimalByQRCode,
  recalculateHealthScore,
  uploadAnimalPhoto,
  updateAnimal,
  deleteAnimal,
} = require('../controllers/animalController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All animal routes require login
router.use(protect);

router.post('/', authorize('SuperAdmin', 'Veterinarian'), createAnimal);
router.get('/', getAllAnimals);
router.get('/qrcode/:qrCode', getAnimalByQRCode);
router.get('/:id', getAnimalProfile);
router.put('/:id/recalculate', authorize('SuperAdmin', 'Veterinarian', 'Caretaker'), recalculateHealthScore);
router.put('/:id/photo', authorize('SuperAdmin', 'Veterinarian', 'Caretaker'), upload.single('photo'), uploadAnimalPhoto);
router.put('/:id', authorize('SuperAdmin', 'Veterinarian'), updateAnimal);
router.delete('/:id', authorize('SuperAdmin'), deleteAnimal);

module.exports = router;