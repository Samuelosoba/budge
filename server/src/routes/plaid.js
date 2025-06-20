const express = require('express');
const { body, validationResult } = require('express-validator');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

const router = express.Router();

// Initialize Plaid client
const configuration = new Configuration({
  basePath:
    process.env.PLAID_ENV === 'production'
      ? PlaidEnvironments.production
      : PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

// Create link token for Plaid Link
router.post('/create-link-token', auth, async (req, res) => {
  try {
    const request = {
      user: {
        client_user_id: req.user._id.toString(),
      },
      client_name: 'Budge',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    };

    const response = await client.linkTokenCreate(request);
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('Create link token error:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// Exchange public token for access token
router.post(
  '/exchange-token',
  auth,
  [
    body('publicToken').notEmpty().withMessage('Public token is required'),
    body('metadata').isObject().withMessage('Metadata is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { publicToken, metadata } = req.body;

      // Exchange public token for access token
      const exchangeResponse = await client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const accessToken = exchangeResponse.data.access_token;
      const itemId = exchangeResponse.data.item_id;

      // Get account information
      const accountsResponse = await client.accountsGet({
        access_token: accessToken,
      });

      const accounts = accountsResponse.data.accounts;

      // Save accounts to database
      const savedAccounts = [];
      for (const account of accounts) {
        const bankAccount = new BankAccount({
          user: req.user._id,
          name: account.name,
          type: mapPlaidAccountType(account.type),
          balance: account.balances.current || 0,
          currency: account.balances.iso_currency_code || 'USD',
          isConnected: true,
          bankName: metadata.institution?.name || 'Unknown Bank',
          plaidAccountId: account.account_id,
          plaidAccessToken: accessToken,
          plaidItemId: itemId,
          lastSynced: new Date(),
        });

        await bankAccount.save();
        savedAccounts.push(bankAccount);
      }

      // Sync recent transactions
      await syncTransactions(req.user._id, accessToken, accounts);

      res.json({
        message: 'Bank accounts connected successfully',
        accounts: savedAccounts,
      });
    } catch (error) {
      console.error('Exchange token error:', error);
      res.status(500).json({ error: 'Failed to connect bank account' });
    }
  }
);

// Sync transactions from Plaid
router.post('/sync-transactions', auth, async (req, res) => {
  try {
    const bankAccounts = await BankAccount.find({
      user: req.user._id,
      isConnected: true,
      plaidAccessToken: { $exists: true },
    });

    let totalSynced = 0;

    for (const account of bankAccounts) {
      const synced = await syncTransactions(
        req.user._id,
        account.plaidAccessToken,
        [{ account_id: account.plaidAccountId }]
      );
      totalSynced += synced;

      // Update last synced time
      account.lastSynced = new Date();
      await account.save();
    }

    res.json({
      message: 'Transactions synced successfully',
      transactionsSynced: totalSynced,
    });
  } catch (error) {
    console.error('Sync transactions error:', error);
    res.status(500).json({ error: 'Failed to sync transactions' });
  }
});

// Helper function to map Plaid account types to our types
function mapPlaidAccountType(plaidType) {
  const typeMap = {
    depository: 'checking',
    credit: 'credit',
    loan: 'loan',
    investment: 'investment',
  };
  return typeMap[plaidType] || 'checking';
}

// Helper function to sync transactions
async function syncTransactions(userId, accessToken, accounts) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    const endDate = new Date();

    const request = {
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      account_ids: accounts.map((acc) => acc.account_id || acc.plaidAccountId),
    };

    const response = await client.transactionsGet(request);
    const transactions = response.data.transactions;

    let syncedCount = 0;

    for (const plaidTransaction of transactions) {
      // Check if transaction already exists
      const existingTransaction = await Transaction.findOne({
        user: userId,
        plaidTransactionId: plaidTransaction.transaction_id,
      });

      if (existingTransaction) continue;

      // Find or create category
      const categoryName = plaidTransaction.category?.[0] || 'Other';
      let category = await Category.findOne({
        user: userId,
        name: categoryName,
        type: 'expense',
      });

      if (!category) {
        category = new Category({
          user: userId,
          name: categoryName,
          color: '#6B7280',
          type: 'expense',
          isDefault: false,
        });
        await category.save();
      }

      // Find bank account
      const bankAccount = await BankAccount.findOne({
        user: userId,
        plaidAccountId: plaidTransaction.account_id,
      });

      // Create transaction
      const transaction = new Transaction({
        user: userId,
        amount: Math.abs(plaidTransaction.amount),
        description: plaidTransaction.name,
        category: category._id,
        type: plaidTransaction.amount > 0 ? 'expense' : 'income',
        date: new Date(plaidTransaction.date),
        bankAccount: bankAccount?._id,
        plaidTransactionId: plaidTransaction.transaction_id,
        notes: `Imported from ${bankAccount?.bankName || 'bank'}`,
      });

      await transaction.save();
      syncedCount++;
    }

    return syncedCount;
  } catch (error) {
    console.error('Sync transactions helper error:', error);
    return 0;
  }
}

module.exports = router;
