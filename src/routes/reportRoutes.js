const express = require('express');
const router = express.Router();
const { generateStory, getStoriesForAnimal, togglePublish } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/generate/:animalId', authorize('SuperAdmin', 'Veterinarian', 'ManagementViewer'), generateStory);
router.get('/animal/:animalId', getStoriesForAnimal);
router.put('/:id/publish', authorize('SuperAdmin', 'ManagementViewer'), togglePublish);

module.exports = router;