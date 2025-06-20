const express = require('express');
const { body, validationResult } = require('express-validator');
const BankAccount = require('../models/BankAccount');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all bank accounts for user
router.get('/', auth, async (req, res) => {
  try {
    const accounts = await BankAccount.find({
      user: req.user._id,
      isActive: true,
    }).sort({ name: 1 });

    res.json({ accounts });
  } catch (error) {
    console.error('Get bank accounts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get bank account by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const account = await BankAccount.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true,
    });

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    res.json({ account });
  } catch (error) {
    console.error('Get bank account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new bank account
router.post(
  '/',
  auth,
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('type')
      .isIn(['checking', 'savings', 'credit', 'investment', 'loan'])
      .withMessage('Invalid account type'),
    body('balance').isFloat().withMessage('Balance must be a number'),
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be 3 characters'),
    body('bankName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Bank name cannot exceed 100 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const account = new BankAccount({
        ...req.body,
        user: req.user._id,
      });

      await account.save();

      res.status(201).json({
        message: 'Bank account created successfully',
        account,
      });
    } catch (error) {
      console.error('Create bank account error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update bank account
router.put(
  '/:id',
  auth,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('balance')
      .optional()
      .isFloat()
      .withMessage('Balance must be a number'),
    body('bankName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Bank name cannot exceed 100 characters'),
    body('isConnected')
      .optional()
      .isBoolean()
      .withMessage('isConnected must be boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const account = await BankAccount.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id, isActive: true },
        req.body,
        { new: true, runValidators: true }
      );

      if (!account) {
        return res.status(404).json({ error: 'Bank account not found' });
      }

      res.json({
        message: 'Bank account updated successfully',
        account,
      });
    } catch (error) {
      console.error('Update bank account error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Delete bank account (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const account = await BankAccount.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error('Delete bank account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
