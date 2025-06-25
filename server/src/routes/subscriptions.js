const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Webhook endpoint for RevenueCat
router.post('/webhook', [
  body('event').exists().withMessage('Event is required'),
  body('api_version').exists().withMessage('API version is required'),
  body('app_user_id').exists().withMessage('App user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { event, app_user_id } = req.body;

    // Find user by ID (app_user_id should be the user's MongoDB _id)
    const user = await User.findById(app_user_id);
    if (!user) {
      console.log(`User not found for app_user_id: ${app_user_id}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle different webhook events
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
        // User has an active subscription
        if (!user.isPro) {
          user.isPro = true;
          await user.save();
          console.log(`User ${user.email} upgraded to Pro via RevenueCat`);
        }
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
      case 'BILLING_ISSUE':
        // User's subscription has ended
        if (user.isPro) {
          user.isPro = false;
          await user.save();
          console.log(`User ${user.email} downgraded from Pro via RevenueCat`);
        }
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('RevenueCat webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get user subscription status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      isPro: user.isPro,
      subscriptionStatus: user.isPro ? 'active' : 'inactive',
      features: {
        aiAssistant: user.isPro,
        advancedAnalytics: user.isPro,
        unlimitedCategories: user.isPro,
        prioritySupport: user.isPro
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manual subscription update (for testing or web purchases)
router.post('/update', auth, [
  body('isPro').isBoolean().withMessage('isPro must be boolean'),
  body('source').optional().isString().withMessage('Source must be string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isPro, source = 'manual' } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isPro },
      { new: true, runValidators: true }
    );

    console.log(`User ${user.email} subscription updated to ${isPro ? 'Pro' : 'Free'} via ${source}`);

    res.json({
      message: `Subscription ${isPro ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPro: user.isPro,
        monthlyBudget: user.monthlyBudget,
        currency: user.currency || user.preferences?.currency || 'USD'
      }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;