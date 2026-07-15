const express = require('express');
const router = express.Router();
const {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  adjustStock,
  getTransactionHistory,
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('SuperAdmin', 'Veterinarian'), createItem);
router.get('/', getAllItems);
router.get('/:id', getItemById);
router.put('/:id', authorize('SuperAdmin', 'Veterinarian'), updateItem);
router.delete('/:id', authorize('SuperAdmin'), deleteItem);

router.post('/:id/adjust', authorize('SuperAdmin', 'Veterinarian', 'Keeper'), adjustStock);
router.get('/:id/transactions', getTransactionHistory);

module.exports = router;