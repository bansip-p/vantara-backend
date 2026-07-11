const express = require('express');
const router = express.Router();
const { reportRescueCase, getAllRescueCases, updateRescueStatus } = require('../controllers/rescueController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', reportRescueCase);
router.get('/', getAllRescueCases);
router.put('/:id/status', updateRescueStatus);

module.exports = router;