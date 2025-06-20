import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useBudget } from '@/contexts/BudgetContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Plus, Eye, EyeOff, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Calendar } from 'lucide-react-native';
import { useState } from 'react';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { state, getTotalIncome, getTotalExpenses, getBalance } = useBudget();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [hideBalances, setHideBalances] = useState(false);

  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const balance = getBalance();
  const budgetUsed = (totalExpenses / state.monthlyBudget) * 100;

  const formatCurrency = (amount: number) => {
    if (hideBalances) return '••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const recentTransactions = state.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  const topCategories = state.categories
    .filter(cat => cat.type === 'expense')
    .map(cat => ({
      ...cat,
      spent: state.transactions
        .filter(t => t.category._id === cat.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3);

  const styles = createStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setHideBalances(!hideBalances)}
          >
            {hideBalances ? (
              <EyeOff size={20} color={theme.textSecondary} />
            ) : (
              <Eye size={20} color={theme.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Main Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.balanceCard }]}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Wallet size={24} color={theme.balanceText} />
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          
          <View style={styles.balanceStats}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <ArrowUpRight size={16} color="#10B981" />
              </View>
              <View>
                <Text style={styles.statAmount}>{formatCurrency(totalIncome)}</Text>
                <Text style={styles.statLabel}>Income</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <ArrowDownRight size={16} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.statAmount}>{formatCurrency(totalExpenses)}</Text>
                <Text style={styles.statLabel}>Expenses</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Budget Progress */}
        <View style={[styles.budgetCard, { backgroundColor: theme.card }]}>
          <View style={styles.budgetHeader}>
            <Text style={[styles.budgetTitle, { color: theme.text }]}>Monthly Budget</Text>
            <Text style={[styles.budgetPercentage, { color: budgetUsed > 90 ? '#EF4444' : theme.primary }]}>
              {budgetUsed.toFixed(0)}%
            </Text>
          </View>
          
          <View style={[styles.budgetProgressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.budgetProgressFill,
                {
                  width: `${Math.min(budgetUsed, 100)}%`,
                  backgroundColor: budgetUsed > 90 ? '#EF4444' : budgetUsed > 75 ? '#F59E0B' : '#10B981',
                },
              ]}
            />
          </View>
          
          <View style={styles.budgetFooter}>
            <Text style={[styles.budgetText, { color: theme.textSecondary }]}>
              {formatCurrency(totalExpenses)} of {formatCurrency(state.monthlyBudget)}
            </Text>
            <Text style={[styles.budgetRemaining, { color: theme.text }]}>
              {formatCurrency(state.monthlyBudget - totalExpenses)} left
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primary }]}>
            <Plus size={20} color={isDark ? '#1A1A1A' : 'white'} />
            <Text style={[styles.actionButtonText, { color: isDark ? '#1A1A1A' : 'white' }]}>
              Add Transaction
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
            <TrendingUp size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>
              View Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Spending</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: theme.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.categoriesGrid}>
              {topCategories.map((category, index) => (
                <View key={category.id} style={[styles.categoryCard, { backgroundColor: theme.card }]}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]} />
                  <Text style={[styles.categoryName, { color: theme.text }]}>{category.name}</Text>
                  <Text style={[styles.categoryAmount, { color: theme.textSecondary }]}>
                    {formatCurrency(category.spent)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: theme.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.transactionsCard, { backgroundColor: theme.card }]}>
              {recentTransactions.map((transaction, index) => (
                <View key={transaction.id}>
                  <View style={styles.transactionRow}>
                    <View style={styles.transactionLeft}>
                      <View style={[styles.transactionIcon, { backgroundColor: transaction.category.color }]} />
                      <View style={styles.transactionInfo}>
                        <Text style={[styles.transactionTitle, { color: theme.text }]}>
                          {transaction.description}
                        </Text>
                        <Text style={[styles.transactionCategory, { color: theme.textSecondary }]}>
                          {transaction.category.name} • {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'income' ? '#10B981' : theme.text }
                    ]}>
                      {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                  {index < recentTransactions.length - 1 && (
                    <View style={[styles.transactionDivider, { backgroundColor: theme.border }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {recentTransactions.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No transactions yet</Text>
            <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
              Start tracking your finances by adding your first transaction
            </Text>
            <TouchableOpacity style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}>
              <Plus size={20} color={isDark ? '#1A1A1A' : 'white'} />
              <Text style={[styles.emptyStateButtonText, { color: isDark ? '#1A1A1A' : 'white' }]}>
                Add Transaction
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingBottom: 120, // Extra padding for mobile navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60, // Safe area padding
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.text,
  },
  eyeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.balanceText,
    opacity: 0.8,
  },
  balanceAmount: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: theme.balanceText,
    marginBottom: 24,
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: theme.balanceText,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.balanceText,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  budgetCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  budgetPercentage: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  budgetProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  budgetRemaining: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  categoriesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryAmount: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  transactionsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  transactionDivider: {
    height: 1,
    marginVertical: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});