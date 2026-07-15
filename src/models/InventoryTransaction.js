const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
  },
  type: {
    type: String,
    enum: ['IN', 'OUT'], // IN = restock/delivery, OUT = consumption/usage
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  reason: {
    type: String, // e.g. 'Restock delivery', 'Used for feeding', 'Damaged/expired removal'
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

inventoryTransactionSchema.index({ itemId: 1, timestamp: -1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);