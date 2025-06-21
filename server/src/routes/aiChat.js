const express = require('express');
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Helper function to get user financial data
const getUserFinancialData = async (userId) => {
  const [transactions, categories, user] = await Promise.all([
    Transaction.find({ user: userId })
      .populate('category', 'name type color')
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

  // Category spending analysis
  const categorySpending = categories
    .filter(cat => cat.type === 'expense')
    .map(cat => {
      const spent = transactions
        .filter(t => t.category._id.toString() === cat._id.toString() && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: cat.name,
        spent,
        budget: cat.budget || 0,
        percentage: totalExpenses > 0 ? (spent / totalExpenses) * 100 : 0,
        color: cat.color
      };
    })
    .filter(item => item.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  // Monthly trend analysis (last 6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
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
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      income: monthIncome,
      expenses: monthExpenses,
      balance: monthIncome - monthExpenses
    };
  }).reverse();

  // Budget analysis
  const budgetAnalysis = {
    totalBudget: user.monthlyBudget,
    totalSpent: totalExpenses,
    budgetUsed: user.monthlyBudget > 0 ? (totalExpenses / user.monthlyBudget) * 100 : 0,
    remainingBudget: Math.max(0, user.monthlyBudget - totalExpenses),
    overBudget: totalExpenses > user.monthlyBudget,
    categoryBudgets: categories
      .filter(cat => cat.budget && cat.type === 'expense')
      .map(cat => {
        const spent = transactions
          .filter(t => t.category._id.toString() === cat._id.toString() && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          category: cat.name,
          budget: cat.budget,
          spent,
          percentage: (spent / cat.budget) * 100,
          overBudget: spent > cat.budget
        };
      })
  };

  return {
    totalIncome,
    totalExpenses,
    balance,
    monthlyBudget: user.monthlyBudget,
    budgetUsed: (totalExpenses / user.monthlyBudget) * 100,
    categorySpending,
    recentTransactions: transactions.slice(0, 10),
    monthlyTrend,
    budgetAnalysis,
    isPro: user.isPro,
    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
  };
};

// Generate comprehensive AI response with OpenAI
const generateAIResponse = async (userMessage, financialData) => {
  if (!openai) {
    return generateFallbackResponse(userMessage, financialData);
  }

  const systemPrompt = `You are Budge AI, a sophisticated financial assistant for a budgeting app. You provide personalized, actionable financial advice based on real user data.

USER'S FINANCIAL PROFILE:
💰 Financial Summary:
- Total Income: $${financialData.totalIncome.toFixed(2)}
- Total Expenses: $${financialData.totalExpenses.toFixed(2)}
- Current Balance: $${financialData.balance.toFixed(2)}
- Monthly Budget: $${financialData.monthlyBudget.toFixed(2)}
- Budget Utilization: ${financialData.budgetUsed.toFixed(1)}%
- Savings Rate: ${financialData.savingsRate.toFixed(1)}%

📊 Spending Breakdown (Top Categories):
${financialData.categorySpending.slice(0, 5).map(cat => 
  `- ${cat.name}: $${cat.spent.toFixed(2)} (${cat.percentage.toFixed(1)}%)${cat.budget ? ` | Budget: $${cat.budget.toFixed(2)}` : ''}`
).join('\n')}

📈 Monthly Trend (Last 6 Months):
${financialData.monthlyTrend.map(month => 
  `- ${month.month}: Income $${month.income.toFixed(2)}, Expenses $${month.expenses.toFixed(2)}, Net $${month.balance.toFixed(2)}`
).join('\n')}

🎯 Budget Analysis:
- Total Budget: $${financialData.budgetAnalysis.totalBudget.toFixed(2)}
- Amount Spent: $${financialData.budgetAnalysis.totalSpent.toFixed(2)}
- Remaining: $${financialData.budgetAnalysis.remainingBudget.toFixed(2)}
- Over Budget: ${financialData.budgetAnalysis.overBudget ? 'Yes' : 'No'}

💎 Account Status: ${financialData.isPro ? 'Pro User' : 'Free User'}

RESPONSE GUIDELINES:
1. Be conversational, encouraging, and personalized
2. Provide specific, actionable advice based on their actual data
3. Use emojis sparingly but effectively
4. Reference specific numbers from their financial data
5. Suggest concrete next steps
6. If they're over budget or have concerning patterns, be supportive but direct
7. Celebrate positive financial behaviors
8. Keep responses concise but comprehensive (200-400 words)
9. If asked about Pro features and they're not Pro, mention benefits naturally
10. Focus on practical financial wisdom and behavioral insights

RESPONSE STYLE:
- Start with a personalized observation about their finances
- Provide 2-3 specific insights or recommendations
- End with an encouraging note or next step
- Use clear, jargon-free language
- Be empathetic and supportive, not judgmental`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 600,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackResponse(userMessage, financialData);
  }
};

// Enhanced fallback responses when OpenAI is not available
const generateFallbackResponse = (userMessage, financialData) => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Budget analysis response
  if (lowerMessage.includes('budget') || lowerMessage.includes('doing') || lowerMessage.includes('how am i')) {
    const budgetStatus = financialData.budgetUsed > 100 ? 'over budget' : 
                        financialData.budgetUsed > 90 ? 'very close to your budget limit' :
                        financialData.budgetUsed > 75 ? 'on track but approaching your budget limit' :
                        'well within your budget';
    
    return `Looking at your finances, you've spent $${financialData.totalExpenses.toFixed(2)} of your $${financialData.monthlyBudget.toFixed(2)} monthly budget (${financialData.budgetUsed.toFixed(0)}%). You're currently ${budgetStatus}. ${financialData.balance > 0 ? "You're maintaining a positive balance - great job! 💪" : "Consider reviewing your expenses to improve your balance. 📊"} ${financialData.savingsRate > 20 ? "Your savings rate of " + financialData.savingsRate.toFixed(1) + "% is excellent!" : "Try to increase your savings rate for better financial health."}`;
  }
  
  // Category spending analysis
  if (lowerMessage.includes('category') || lowerMessage.includes('spend') || lowerMessage.includes('most')) {
    const topCategory = financialData.categorySpending[0];
    if (topCategory) {
      return `Your highest spending category is ${topCategory.name} with $${topCategory.spent.toFixed(2)} spent (${topCategory.percentage.toFixed(1)}% of total expenses). ${topCategory.budget ? `You've ${topCategory.spent > topCategory.budget ? 'exceeded' : 'used'} ${((topCategory.spent / topCategory.budget) * 100).toFixed(0)}% of your $${topCategory.budget} budget for this category.` : 'Consider setting a budget for this category to better track your spending.'} 📈`;
    }
    return "You don't have any expense data yet. Start by adding some transactions to see your spending patterns! 📊";
  }
  
  // Savings tips
  if (lowerMessage.includes('savings') || lowerMessage.includes('tips') || lowerMessage.includes('save')) {
    return `Here are personalized savings tips based on your spending: 1) Your current savings rate is ${financialData.savingsRate.toFixed(1)}% - aim for 20%+ 💰 2) Review your top spending category (${financialData.categorySpending[0]?.name || 'expenses'}) for potential cuts 3) Set up automatic transfers to savings 4) Use the 24-hour rule for non-essential purchases 5) Track every expense to identify spending leaks. ${financialData.isPro ? 'As a Pro user, you have access to advanced analytics to optimize your savings!' : 'Upgrade to Pro for detailed spending insights and custom savings goals! 🚀'}`;
  }
  
  // Trend analysis
  if (lowerMessage.includes('trend') || lowerMessage.includes('month') || lowerMessage.includes('pattern')) {
    const latestMonth = financialData.monthlyTrend[financialData.monthlyTrend.length - 1];
    const previousMonth = financialData.monthlyTrend[financialData.monthlyTrend.length - 2];
    
    if (latestMonth && previousMonth) {
      const expenseChange = latestMonth.expenses - previousMonth.expenses;
      const changeDirection = expenseChange > 0 ? 'increased' : 'decreased';
      return `Your spending has ${changeDirection} by $${Math.abs(expenseChange).toFixed(2)} compared to last month. This month you spent $${latestMonth.expenses.toFixed(2)} vs $${previousMonth.expenses.toFixed(2)} last month. ${expenseChange > 0 ? 'Consider reviewing what drove the increase and see if you can optimize next month. 📈' : 'Great job reducing your expenses! Keep up the good work! 🎉'}`;
    }
    return "I need more transaction data to analyze your spending trends. Add more transactions to see patterns! 📊";
  }
  
  // Income analysis
  if (lowerMessage.includes('income') || lowerMessage.includes('earn')) {
    return `Your total income is $${financialData.totalIncome.toFixed(2)}. ${financialData.totalIncome > financialData.totalExpenses ? `You're earning more than you spend - excellent! Your surplus is $${(financialData.totalIncome - financialData.totalExpenses).toFixed(2)}.` : 'Your expenses exceed your income. Consider ways to increase income or reduce expenses.'} 💼 ${financialData.isPro ? 'Use your Pro analytics to identify income optimization opportunities!' : 'Upgrade to Pro for detailed income tracking and forecasting! 🚀'}`;
  }
  
  // Default helpful response
  return `I'm here to help with your finances! 💡 You currently have a balance of $${financialData.balance.toFixed(2)} and have used ${financialData.budgetUsed.toFixed(0)}% of your monthly budget. You can ask me about your spending patterns, budget analysis, savings tips, or any financial questions. ${financialData.isPro ? 'As a Pro user, you have access to advanced insights!' : 'Consider upgrading to Pro for detailed analytics and personalized recommendations! 🚀'}`;
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
      timestamp: new Date().toISOString(),
      hasOpenAI: !!openai
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ 
      error: 'Unable to process your request at the moment. Please try again later.' 
    });
  }
});

// Get financial insights with chart data
router.get('/insights', auth, async (req, res) => {
  try {
    const financialData = await getUserFinancialData(req.user._id);
    
    const insights = [];
    
    // Budget insights
    if (financialData.budgetUsed > 100) {
      insights.push({
        type: 'warning',
        title: 'Budget Exceeded',
        message: `You've exceeded your monthly budget by $${(financialData.totalExpenses - financialData.monthlyBudget).toFixed(2)}. Consider reviewing your expenses.`,
        priority: 'high'
      });
    } else if (financialData.budgetUsed > 90) {
      insights.push({
        type: 'warning',
        title: 'Budget Alert',
        message: `You've used ${financialData.budgetUsed.toFixed(0)}% of your monthly budget. Only $${(financialData.monthlyBudget - financialData.totalExpenses).toFixed(2)} remaining.`,
        priority: 'medium'
      });
    } else if (financialData.budgetUsed < 50) {
      insights.push({
        type: 'success',
        title: 'Great Budgeting',
        message: `You're doing well! You've only used ${financialData.budgetUsed.toFixed(0)}% of your monthly budget.`,
        priority: 'low'
      });
    }
    
    // Savings rate insights
    if (financialData.savingsRate > 20) {
      insights.push({
        type: 'success',
        title: 'Excellent Savings Rate',
        message: `Your savings rate of ${financialData.savingsRate.toFixed(1)}% is excellent! You're building wealth effectively.`,
        priority: 'low'
      });
    } else if (financialData.savingsRate < 0) {
      insights.push({
        type: 'error',
        title: 'Negative Savings',
        message: 'Your expenses exceed your income. Focus on reducing expenses or increasing income.',
        priority: 'high'
      });
    }
    
    // Category insights
    const topSpendingCategory = financialData.categorySpending[0];
    if (topSpendingCategory && topSpendingCategory.spent > 0) {
      insights.push({
        type: 'info',
        title: 'Top Spending Category',
        message: `Your highest spending is in ${topSpendingCategory.name} with $${topSpendingCategory.spent.toFixed(2)} (${topSpendingCategory.percentage.toFixed(1)}% of expenses).`,
        priority: 'medium'
      });
    }

    // Chart data for visualization
    const chartData = {
      pieChart: financialData.categorySpending.slice(0, 6).map(item => ({
        name: item.name,
        value: item.spent,
        color: item.color,
        percentage: item.percentage
      })),
      monthlyTrend: financialData.monthlyTrend,
      budgetProgress: financialData.budgetAnalysis.categoryBudgets
    };

    res.json({ 
      insights: insights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      chartData,
      summary: {
        totalIncome: financialData.totalIncome,
        totalExpenses: financialData.totalExpenses,
        balance: financialData.balance,
        savingsRate: financialData.savingsRate,
        budgetUsed: financialData.budgetUsed
      }
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;