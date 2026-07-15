const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Food', 'Medicine', 'Equipment'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  unit: {
    type: String,
    required: true, // e.g. 'kg', 'liters', 'units', 'boxes'
  },
  lowStockThreshold: {
    type: Number,
    required: true,
    default: 5,
  },
  supplier: {
    type: String,
  },
  expiryDate: {
    type: Date, // relevant mainly for Medicine/some Food items; optional otherwise
  },
  notes: {
    type: String,
  },
}, { timestamps: true });

inventoryItemSchema.index({ category: 1, name: 1 });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);