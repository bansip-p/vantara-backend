const express = require('express');
const router = express.Router();
const {
  getDietRecommendation,
  logMeal,
  getNutritionHistory,
  getComplianceSummary,
} = require('../controllers/dietController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// NEW routes
router.post('/log/:animalId', authorize('SuperAdmin', 'Veterinarian', 'Keeper'), logMeal);
router.get('/log/:animalId', getNutritionHistory);
router.get('/compliance/:animalId', getComplianceSummary);

// EXISTING route — unchanged, kept last so /log and /compliance aren't
// swallowed by the generic /:animalId param match
router.get('/:animalId', getDietRecommendation);

module.exports = router;