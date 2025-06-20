const express = require('express');
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to get user financial data
const getUserFinancialData = async (userId) => {
  const [transactions, categories, user] = await Promise.all([
    Transaction.find({ user: userId })
      .populate('category', 'name type')
      .sort({ date: -1 })
      .limit(100),
    Category.find({ user: userId }),
    User.findById(userId)
  ]);

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Category spending
  const categorySpending = categories
    .filter(cat => cat.type === 'expense')
    .map(cat => ({
      name: cat.name,
      spent: transactions
        .filter(t => t.category._id.toString() === cat._id.toString() && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
      budget: cat.budget || 0
    }))
    .sort((a, b) => b.spent - a.spent);

  return {
    totalIncome,
    totalExpenses,
    balance,
    monthlyBudget: user.monthlyBudget,
    budgetUsed: (totalExpenses / user.monthlyBudget) * 100,
    categorySpending,
    recentTransactions: transactions.slice(0, 10),
    isPro: user.isPro
  };
};

// Generate AI response
const generateAIResponse = async (userMessage, financialData) => {
  const systemPrompt = `You are a helpful AI financial assistant for a budgeting app called Budge. 
  
  User's Financial Summary:
  - Total Income: $${financialData.totalIncome.toFixed(2)}
  - Total Expenses: $${financialData.totalExpenses.toFixed(2)}
  - Balance: $${financialData.balance.toFixed(2)}
  - Monthly Budget: $${financialData.monthlyBudget.toFixed(2)}
  - Budget Used: ${financialData.budgetUsed.toFixed(1)}%
  - Pro Status: ${financialData.isPro ? 'Yes' : 'No'}
  
  Top Spending Categories:
  ${financialData.categorySpending.slice(0, 5).map(cat => 
    `- ${cat.name}: $${cat.spent.toFixed(2)}${cat.budget ? ` (Budget: $${cat.budget.toFixed(2)})` : ''}`
  ).join('\n')}
  
  Recent Transactions:
  ${financialData.recentTransactions.slice(0, 5).map(t => 
    `- ${t.description}: ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)} (${t.category.name})`
  ).join('\n')}
  
  Guidelines:
  - Provide personalized financial advice based on the user's data
  - Be encouraging and supportive
  - Suggest specific actions when appropriate
  - Keep responses concise but helpful
  - Use currency formatting ($X.XX)
  - If user asks about Pro features and they're not Pro, mention the benefits of upgrading
  - Focus on practical, actionable advice`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback responses based on common queries
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('doing')) {
      return `Based on your finances: You've spent $${financialData.totalExpenses.toFixed(2)} of your $${financialData.monthlyBudget.toFixed(2)} monthly budget (${financialData.budgetUsed.toFixed(0)}%). ${financialData.balance > 0 ? "You're maintaining a positive balance - great job!" : "Consider reviewing your expenses to improve your balance."}`;
    }
    
    if (lowerMessage.includes('category') || lowerMessage.includes('spend')) {
      const topCategory = financialData.categorySpending[0];
      return topCategory ? `Your highest spending category is ${topCategory.name} with $${topCategory.spent.toFixed(2)} spent.` : "You don't have any expense data yet.";
    }
    
    if (lowerMessage.includes('savings') || lowerMessage.includes('tips')) {
      return "Here are some savings tips: 1) Track every expense, 2) Follow the 50/30/20 rule, 3) Automate your savings, 4) Review subscriptions regularly, 5) Use the 24-hour rule for non-essential purchases.";
    }
    
    return "I'm here to help with your finances! You can ask me about your budget, spending patterns, savings tips, or any financial questions.";
  }
};

// Chat with AI assistant
router.post('/chat', auth, [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;

    // Get user's financial data
    const financialData = await getUserFinancialData(req.user._id);

    // Generate AI response
    const aiResponse = await generateAIResponse(message, financialData);

    res.json({
      message: aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ 
      error: 'Unable to process your request at the moment. Please try again later.' 
    });
  }
});

// Get financial insights
router.get('/insights', auth, async (req, res) => {
  try {
    const financialData = await getUserFinancialData(req.user._id);
    
    const insights = [];
    
    // Budget insights
    if (financialData.budgetUsed > 90) {
      insights.push({
        type: 'warning',
        title: 'Budget Alert',
        message: `You've used ${financialData.budgetUsed.toFixed(0)}% of your monthly budget. Consider reviewing your expenses.`
      });
    } else if (financialData.budgetUsed < 50) {
      insights.push({
        type: 'success',
        title: 'Great Budgeting',
        message: `You're doing well! You've only used ${financialData.budgetUsed.toFixed(0)}% of your monthly budget.`
      });
    }
    
    // Category insights
    const topSpendingCategory = financialData.categorySpending[0];
    if (topSpendingCategory && topSpendingCategory.spent > 0) {
      insights.push({
        type: 'info',
        title: 'Top Spending Category',
        message: `Your highest spending is in ${topSpendingCategory.name} with $${topSpendingCategory.spent.toFixed(2)}.`
      });
    }
    
    // Balance insights
    if (financialData.balance < 0) {
      insights.push({
        type: 'warning',
        title: 'Negative Balance',
        message: 'Your expenses exceed your income. Consider reducing spending or increasing income.'
      });
    } else if (financialData.balance > financialData.totalIncome * 0.2) {
      insights.push({
        type: 'success',
        title: 'Healthy Savings',
        message: `You're saving ${((financialData.balance / financialData.totalIncome) * 100).toFixed(0)}% of your income. Keep it up!`
      });
    }

    res.json({ insights });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;