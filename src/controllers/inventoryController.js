const InventoryItem = require('../models/InventoryItem');
const InventoryTransaction = require('../models/InventoryTransaction');
const AIAlert = require('../models/AIAlert');

// CREATE a new inventory item
exports.createItem = async (req, res) => {
  try {
    const item = await InventoryItem.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all items, optionally filtered by category, with a lowStockOnly filter
exports.getAllItems = async (req, res) => {
  try {
    const { category, lowStockOnly } = req.query;
    const filter = {};
    if (category) filter.category = category;

    let items = await InventoryItem.find(filter).sort({ name: 1 });

    if (lowStockOnly === 'true') {
      items = items.filter((i) => i.quantity <= i.lowStockThreshold);
    }

    res.status(200).json({ success: true, count: items.length, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET a single item by id
exports.getItemById = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.status(200).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE item metadata (name, thresholds, supplier, etc.) — NOT quantity.
// Quantity only ever changes through adjustStock, so it's always logged.
exports.updateItem = async (req, res) => {
  try {
    const { quantity, ...safeUpdates } = req.body; // strip quantity if present
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, safeUpdates, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.status(200).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE an item (SuperAdmin only, enforced in routes)
exports.deleteItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.status(200).json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADJUST STOCK — the only path that changes quantity. Always logs a transaction
// and checks/creates a low-stock AIAlert if the new quantity crosses the threshold.
exports.adjustStock = async (req, res) => {
  try {
    const { type, quantity, reason } = req.body;

    if (!['IN', 'OUT'].includes(type)) {
      return res.status(400).json({ success: false, message: "type must be 'IN' or 'OUT'" });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive number' });
    }

    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (type === 'OUT' && item.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Not enough stock: only ${item.quantity}${item.unit} available`,
      });
    }

    item.quantity = type === 'IN' ? item.quantity + quantity : item.quantity - quantity;
    await item.save();

    const transaction = await InventoryTransaction.create({
      itemId: item._id,
      type,
      quantity,
      reason: reason || (type === 'IN' ? 'Restock' : 'Usage'),
      performedBy: req.user.id,
    });

    let alertCreated = null;

    // Low-stock check — only relevant after an OUT (consumption) transaction
    if (type === 'OUT' && item.quantity <= item.lowStockThreshold) {
      const existingAlert = await AIAlert.findOne({
        // ASSUMPTION: AIAlert.animalId is required in your current schema, but
        // low-stock alerts aren't tied to a specific animal. If animalId is
        // required, this will need either a schema change (make it optional)
        // or a separate lightweight InventoryAlert model instead. Flagging this
        // explicitly rather than guessing — see note below.
        alertType: 'Inventory',
        status: { $ne: 'Resolved' },
        observation: { $regex: item.name, $options: 'i' },
      });

      if (!existingAlert) {
        alertCreated = await AIAlert.create({
          alertType: 'Inventory',
          severity: item.quantity === 0 ? 'Critical' : 'Warning',
          observation: `${item.name} stock is low: ${item.quantity}${item.unit} remaining (threshold: ${item.lowStockThreshold}${item.unit})`,
          possibleConcern: item.quantity === 0
            ? `${item.name} is fully out of stock`
            : `${item.name} is approaching depletion`,
          recommendedAction: `Reorder ${item.name} from ${item.supplier || 'your usual supplier'} as soon as possible`,
          status: 'Open',
        });
      }
    }

    res.status(200).json({
      success: true,
      item,
      transaction,
      alertCreated: !!alertCreated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET transaction history for one item
exports.getTransactionHistory = async (req, res) => {
  try {
    const transactions = await InventoryTransaction.find({ itemId: req.params.id })
      .populate('performedBy', 'name role')
      .sort({ timestamp: -1 });

    res.status(200).json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};