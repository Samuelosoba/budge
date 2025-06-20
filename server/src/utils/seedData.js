const User = require('../models/User');
const Category = require('../models/Category');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');

const defaultCategories = [
  // Income categories
  { name: 'Salary', color: '#10B981', type: 'income', icon: 'briefcase' },
  { name: 'Freelance', color: '#059669', type: 'income', icon: 'laptop' },
  { name: 'Investment', color: '#34D399', type: 'income', icon: 'trending-up' },
  { name: 'Other Income', color: '#6EE7B7', type: 'income', icon: 'plus-circle' },
  
  // Expense categories
  { name: 'Housing', color: '#EF4444', type: 'expense', budget: 1200, icon: 'home' },
  { name: 'Food', color: '#F59E0B', type: 'expense', budget: 400, icon: 'utensils' },
  { name: 'Transportation', color: '#3B82F6', type: 'expense', budget: 200, icon: 'car' },
  { name: 'Entertainment', color: '#8B5CF6', type: 'expense', budget: 150, icon: 'film' },
  { name: 'Healthcare', color: '#EC4899', type: 'expense', budget: 100, icon: 'heart' },
  { name: 'Shopping', color: '#F97316', type: 'expense', budget: 200, icon: 'shopping-bag' },
  { name: 'Utilities', color: '#06B6D4', type: 'expense', budget: 150, icon: 'zap' },
  { name: 'Education', color: '#84CC16', type: 'expense', budget: 100, icon: 'book' },
];

const createDefaultCategories = async (userId) => {
  const categories = defaultCategories.map(cat => ({
    ...cat,
    user: userId,
    isDefault: true
  }));
  
  return await Category.insertMany(categories);
};

const createDefaultBankAccounts = async (userId) => {
  const accounts = [
    {
      user: userId,
      name: 'Main Checking',
      type: 'checking',
      balance: 2840,
      bankName: 'Chase Bank',
      isConnected: true
    },
    {
      user: userId,
      name: 'Savings Account',
      type: 'savings',
      balance: 12500,
      bankName: 'Chase Bank',
      isConnected: true
    },
    {
      user: userId,
      name: 'Credit Card',
      type: 'credit',
      balance: -850,
      bankName: 'Chase Bank',
      isConnected: false
    }
  ];
  
  return await BankAccount.insertMany(accounts);
};

const createSampleTransactions = async (userId, categories) => {
  const salaryCategory = categories.find(c => c.name === 'Salary');
  const housingCategory = categories.find(c => c.name === 'Housing');
  const foodCategory = categories.find(c => c.name === 'Food');
  const transportationCategory = categories.find(c => c.name === 'Transportation');
  const entertainmentCategory = categories.find(c => c.name === 'Entertainment');

  const transactions = [
    {
      user: userId,
      amount: 3500,
      description: 'Monthly Salary',
      category: salaryCategory._id,
      type: 'income',
      date: new Date('2025-01-15'),
      isRecurring: true
    },
    {
      user: userId,
      amount: 1200,
      description: 'Rent Payment',
      category: housingCategory._id,
      type: 'expense',
      date: new Date('2025-01-01'),
      isRecurring: true
    },
    {
      user: userId,
      amount: 85,
      description: 'Grocery Shopping',
      category: foodCategory._id,
      type: 'expense',
      date: new Date('2025-01-12')
    },
    {
      user: userId,
      amount: 45,
      description: 'Gas Station',
      category: transportationCategory._id,
      type: 'expense',
      date: new Date('2025-01-10')
    },
    {
      user: userId,
      amount: 25,
      description: 'Coffee Shop',
      category: foodCategory._id,
      type: 'expense',
      date: new Date('2025-01-09')
    },
    {
      user: userId,
      amount: 60,
      description: 'Movie Night',
      category: entertainmentCategory._id,
      type: 'expense',
      date: new Date('2025-01-08')
    }
  ];
  
  return await Transaction.insertMany(transactions);
};

const seedUserData = async (userId) => {
  try {
    // Create default categories
    const categories = await createDefaultCategories(userId);
    
    // Create default bank accounts
    await createDefaultBankAccounts(userId);
    
    // Create sample transactions
    await createSampleTransactions(userId, categories);
    
    console.log(`Seeded data for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error seeding user data:', error);
    return false;
  }
};

module.exports = {
  seedUserData,
  createDefaultCategories,
  createDefaultBankAccounts,
  createSampleTransactions
};