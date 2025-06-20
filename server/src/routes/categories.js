const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all categories for user
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user._id })
      .sort({ type: 1, name: 1 });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get category by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new category
router.post('/', auth, [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Name must be between 1 and 50 characters'),
  body('color').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Please enter a valid hex color'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('icon').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Icon must be between 1 and 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = new Category({
      ...req.body,
      user: req.user._id
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update category
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Name must be between 1 and 50 characters'),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Please enter a valid hex color'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('icon').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Icon must be between 1 and 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if category has transactions
    const transactionCount = await Transaction.countDocuments({
      category: req.params.id,
      user: req.user._id
    });

    if (transactionCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing transactions',
        transactionCount
      });
    }

    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get category spending statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const stats = await Transaction.aggregate([
      {
        $match: {
          category: category._id,
          user: req.user._id
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalSpent: 0,
      transactionCount: 0,
      avgAmount: 0,
      maxAmount: 0,
      minAmount: 0
    };

    // Calculate budget utilization if budget is set
    if (category.budget) {
      result.budgetUtilization = (result.totalSpent / category.budget) * 100;
      result.remainingBudget = category.budget - result.totalSpent;
    }

    res.json({
      category: {
        id: category._id,
        name: category.name,
        type: category.type,
        budget: category.budget
      },
      stats: result
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;