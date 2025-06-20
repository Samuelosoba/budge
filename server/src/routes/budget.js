const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user's budget settings
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      monthlyBudget: user.monthlyBudget,
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update monthly budget
router.put('/monthly', auth, [
  body('monthlyBudget')
    .notEmpty()
    .withMessage('Monthly budget is required')
    .isNumeric()
    .withMessage('Monthly budget must be a number')
    .toFloat()
    .isFloat({ min: 0 })
    .withMessage('Monthly budget must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { monthlyBudget: req.body.monthlyBudget },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Monthly budget updated successfully',
      monthlyBudget: user.monthlyBudget
    });
  } catch (error) {
    console.error('Update monthly budget error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user preferences
router.put('/preferences', auth, [
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('notifications').optional().isBoolean().withMessage('Notifications must be boolean'),
  body('theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Theme must be light, dark, or auto')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const updateData = {};
    if (req.body.currency) updateData['preferences.currency'] = req.body.currency;
    if (req.body.notifications !== undefined) updateData['preferences.notifications'] = req.body.notifications;
    if (req.body.theme) updateData['preferences.theme'] = req.body.theme;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;