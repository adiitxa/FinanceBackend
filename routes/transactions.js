const express = require('express');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all transactions
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add transaction
router.post('/', auth, async (req, res) => {
  try {
    const { person, amount, type, description, date } = req.body;
    
    const transaction = await Transaction.create({
      user: req.user.id,
      person,
      amount,
      type,
      description,
      date: date || new Date()
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transactions by person
router.get('/person/:name', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user.id,
      person: req.params.name
    }).sort({ date: -1 });
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;