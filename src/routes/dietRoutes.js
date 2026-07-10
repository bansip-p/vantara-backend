const express = require('express');
const router = express.Router();
const { getDietRecommendation } = require('../controllers/dietController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/:animalId', getDietRecommendation);

module.exports = router;