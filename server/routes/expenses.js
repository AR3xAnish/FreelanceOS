const express = require('express');
const Expense = require('../models/Expense');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes with authMiddleware
router.use(authMiddleware);

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private (Freelancer only)
router.post('/', async (req, res) => {
  try {
    const { category, amount, date, note } = req.body;

    if (!category || amount === undefined || !date) {
      return res.status(400).json({ error: 'Category, amount and date are required fields.' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    const expense = new Expense({
      freelancerId: req.user._id,
      category,
      amount: parsedAmount,
      date,
      note: note || '',
    });

    await expense.save();
    res.status(201).json({ expense });
  } catch (error) {
    console.error('Create Expense Error:', error.message);
    res.status(500).json({ error: 'Server error. Could not log expense.' });
  }
});

// @route   GET /api/expenses
// @desc    Get all expenses for logged in freelancer
// @access  Private (Freelancer only)
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find({ freelancerId: req.user._id })
      .sort({ date: -1 });

    res.status(200).json({ expenses });
  } catch (error) {
    console.error('Get Expenses Error:', error.message);
    res.status(500).json({ error: 'Server error. Could not retrieve expenses.' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense by ID
// @access  Private (Freelancer only)
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      freelancerId: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found or unauthorized.' });
    }

    res.status(200).json({ message: 'Expense deleted successfully.' });
  } catch (error) {
    console.error('Delete Expense Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Expense not found.' });
    }
    res.status(500).json({ error: 'Server error. Could not delete expense.' });
  }
});

module.exports = router;
