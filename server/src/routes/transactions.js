const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all transactions for user
router.get(
  '/',
  auth,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('type')
      .optional()
      .isIn(['income', 'expense'])
      .withMessage('Type must be income or expense'),
    query('category').optional().isMongoId().withMessage('Invalid category ID'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = { user: req.user._id };

      if (req.query.type) filter.type = req.query.type;
      if (req.query.category) filter.category = req.query.category;

      if (req.query.startDate || req.query.endDate) {
        filter.date = {};
        if (req.query.startDate)
          filter.date.$gte = new Date(req.query.startDate);
        if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
      }

      const transactions = await Transaction.find(filter)
        .populate('category', 'name color type')
        .populate('bankAccount', 'name type')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Transaction.countDocuments(filter);

      res.json({
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get transaction by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('category', 'name color type')
      .populate('bankAccount', 'name type');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new transaction
router.post(
  '/',
  auth,
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('description')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Description must be between 1 and 200 characters'),
    body('category').isMongoId().withMessage('Invalid category ID'),
    body('type')
      .isIn(['income', 'expense'])
      .withMessage('Type must be income or expense'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('bankAccount')
      .optional()
      .isMongoId()
      .withMessage('Invalid bank account ID'),
    body('isRecurring')
      .optional()
      .isBoolean()
      .withMessage('isRecurring must be boolean'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verify category belongs to user
      const category = await Category.findOne({
        _id: req.body.category,
        user: req.user._id,
      });

      if (!category) {
        return res
          .status(400)
          .json({ error: 'Category not found or does not belong to user' });
      }

      // Verify category type matches transaction type
      if (category.type !== req.body.type) {
        return res
          .status(400)
          .json({ error: 'Category type does not match transaction type' });
      }

      const transaction = new Transaction({
        ...req.body,
        user: req.user._id,
      });

      await transaction.save();
      await transaction.populate('category', 'name color type');

      res.status(201).json({
        message: 'Transaction created successfully',
        transaction,
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update transaction
router.put(
  '/:id',
  auth,
  [
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Description must be between 1 and 200 characters'),
    body('category').optional().isMongoId().withMessage('Invalid category ID'),
    body('type')
      .optional()
      .isIn(['income', 'expense'])
      .withMessage('Type must be income or expense'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // If category is being updated, verify it belongs to user and type matches
      if (req.body.category) {
        const category = await Category.findOne({
          _id: req.body.category,
          user: req.user._id,
        });

        if (!category) {
          return res
            .status(400)
            .json({ error: 'Category not found or does not belong to user' });
        }

        const transactionType =
          req.body.type || (await Transaction.findById(req.params.id)).type;
        if (category.type !== transactionType) {
          return res
            .status(400)
            .json({ error: 'Category type does not match transaction type' });
        }
      }

      const transaction = await Transaction.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        req.body,
        { new: true, runValidators: true }
      ).populate('category', 'name color type');

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({
        message: 'Transaction updated successfully',
        transaction,
      });
    } catch (error) {
      console.error('Update transaction error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get transaction statistics
router.get(
  '/stats/summary',
  auth,
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filter = { user: req.user._id };

      if (req.query.startDate || req.query.endDate) {
        filter.date = {};
        if (req.query.startDate)
          filter.date.$gte = new Date(req.query.startDate);
        if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
      }

      const stats = await Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' },
          },
        },
      ]);

      const summary = {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        transactionCount: 0,
      };

      stats.forEach((stat) => {
        if (stat._id === 'income') {
          summary.totalIncome = stat.total;
        } else if (stat._id === 'expense') {
          summary.totalExpenses = stat.total;
        }
        summary.transactionCount += stat.count;
      });

      summary.balance = summary.totalIncome - summary.totalExpenses;

      res.json({ summary });
    } catch (error) {
      console.error('Get transaction stats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
