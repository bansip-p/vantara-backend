const express = require('express');
const router = express.Router();
const { getTodayChecklist, updateChecklist } = require('../controllers/dailyCareController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/today/:animalId', getTodayChecklist);
router.put('/:id', updateChecklist);

module.exports = router;