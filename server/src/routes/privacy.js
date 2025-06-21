const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const BankAccount = require('../models/BankAccount');
const auth = require('../middleware/auth');

const router = express.Router();

// Export user data
router.get('/export', auth, [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, format = 'json' } = req.query;
    const userId = req.user._id;

    // Build date filter
    const dateFilter = { user: userId };
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // Fetch all user data
    const [user, transactions, categories, bankAccounts] = await Promise.all([
      User.findById(userId).select('-password'),
      Transaction.find(dateFilter).populate('category', 'name color type'),
      Category.find({ user: userId }),
      BankAccount.find({ user: userId, isActive: true })
    ]);

    // Calculate analytics
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const categorySpending = categories
      .filter(cat => cat.type === 'expense')
      .map(cat => {
        const spent = transactions
          .filter(t => t.category._id.toString() === cat._id.toString() && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          name: cat.name,
          color: cat.color,
          spent,
          budget: cat.budget || 0,
          percentage: totalExpenses > 0 ? (spent / totalExpenses) * 100 : 0
        };
      })
      .filter(item => item.spent > 0)
      .sort((a, b) => b.spent - a.spent);

    // Monthly spending trend (last 12 months)
    const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        income: monthIncome,
        expenses: monthExpenses,
        balance: monthIncome - monthExpenses
      };
    }).reverse();

    const exportData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        dateRange: {
          start: startDate || 'All time',
          end: endDate || 'All time'
        },
        totalRecords: {
          transactions: transactions.length,
          categories: categories.length,
          bankAccounts: bankAccounts.length
        }
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPro: user.isPro,
        monthlyBudget: user.monthlyBudget,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      analytics: {
        summary: {
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
          budgetUtilization: user.monthlyBudget > 0 ? (totalExpenses / user.monthlyBudget) * 100 : 0
        },
        categoryBreakdown: categorySpending,
        monthlyTrend,
        pieChartData: categorySpending.slice(0, 6).map(item => ({
          name: item.name,
          value: item.spent,
          color: item.color,
          percentage: item.percentage
        }))
      },
      transactions: transactions.map(t => ({
        id: t._id,
        amount: t.amount,
        description: t.description,
        category: {
          name: t.category.name,
          color: t.category.color,
          type: t.category.type
        },
        type: t.type,
        date: t.date,
        notes: t.notes,
        isRecurring: t.isRecurring,
        createdAt: t.createdAt
      })),
      categories: categories.map(c => ({
        id: c._id,
        name: c.name,
        color: c.color,
        type: c.type,
        budget: c.budget,
        icon: c.icon,
        isDefault: c.isDefault,
        createdAt: c.createdAt
      })),
      bankAccounts: bankAccounts.map(a => ({
        id: a._id,
        name: a.name,
        type: a.type,
        balance: a.balance,
        currency: a.currency,
        isConnected: a.isConnected,
        bankName: a.bankName,
        createdAt: a.createdAt,
        lastSynced: a.lastSynced
      }))
    };

    if (format === 'csv') {
      // Convert to CSV format for transactions
      const csvHeaders = 'Date,Description,Category,Type,Amount,Notes\n';
      const csvData = transactions.map(t => 
        `${t.date.toISOString().split('T')[0]},${t.description},${t.category.name},${t.type},${t.amount},"${t.notes || ''}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="budge-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeaders + csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="budge-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Delete user account
router.delete('/account', auth, [
  body('confirmEmail').isEmail().withMessage('Please provide a valid email for confirmation'),
  body('password').exists().withMessage('Password is required for account deletion')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { confirmEmail, password } = req.body;
    const userId = req.user._id;

    // Verify email matches
    if (confirmEmail !== req.user.email) {
      return res.status(400).json({ error: 'Email confirmation does not match your account email' });
    }

    // Verify password
    const user = await User.findById(userId).select('+password');
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Delete all user data in the correct order (due to foreign key constraints)
    await Promise.all([
      Transaction.deleteMany({ user: userId }),
      BankAccount.deleteMany({ user: userId }),
      Category.deleteMany({ user: userId })
    ]);

    // Finally delete the user
    await User.findByIdAndDelete(userId);

    res.json({ 
      message: 'Account and all associated data have been permanently deleted',
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Get privacy settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      dataRetention: {
        transactionHistory: 'Indefinite',
        loginActivity: '90 days',
        analyticsData: '2 years'
      },
      dataSharing: {
        analytics: user.preferences?.analytics !== false,
        marketing: user.preferences?.marketing === true,
        thirdParty: false
      },
      accountInfo: {
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        dataSize: 'Calculating...' // Could be calculated if needed
      }
    });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({ error: 'Failed to get privacy settings' });
  }
});

// Update privacy settings
router.put('/settings', auth, [
  body('analytics').optional().isBoolean().withMessage('Analytics must be boolean'),
  body('marketing').optional().isBoolean().withMessage('Marketing must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { analytics, marketing } = req.body;
    const updateData = {};

    if (analytics !== undefined) updateData['preferences.analytics'] = analytics;
    if (marketing !== undefined) updateData['preferences.marketing'] = marketing;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Privacy settings updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

module.exports = router;