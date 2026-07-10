const express = require('express');
const router = express.Router();
const { getAnalyticsSummary } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/summary', authorize('SuperAdmin', 'ManagementViewer', 'Veterinarian'), getAnalyticsSummary);

module.exports = router;