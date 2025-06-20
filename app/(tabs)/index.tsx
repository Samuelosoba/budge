import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useBudget } from '@/contexts/BudgetContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Plus, Eye, EyeOff, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown, Calendar, Settings, CreditCard, ChartBar as BarChart3, RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { state, getTotalIncome, getTotalExpenses, getBalance, refreshData } = useBudget();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [hideBalances, setHideBalances] = useState(false);
  const [selectedOverview, setSelectedOverview] = useState<'income' | 'expense'>('expense');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const balance = getBalance();
  const budgetUsed = state.monthlyBudget > 0 ? (totalExpenses / state.monthlyBudget) * 100 : 0;

  const formatCurrency = (amount: number) => {
    if (hideBalances) return '••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Recent transactions (last 5)
  const recentTransactions = state.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Top transactions by amount
  const topTransactions = state.transactions
    .filter(t => t.type === selectedOverview)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Financial overview data
  const overviewData = selectedOverview === 'income' 
    ? state.transactions.filter(t => t.type === 'income')
    : state.transactions.filter(t => t.type === 'expense');

  const overviewTotal = overviewData.reduce((sum, t) => sum + t.amount, 0);
  const overviewCount = overviewData.length;

  // Top spending categories
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
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Header with Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>Hi, {user?.name}!</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setHideBalances(!hideBalances)}
            >
              {hideBalances ? (
                <EyeOff size={20} color={theme.textSecondary} />
              ) : (
                <Eye size={20} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Settings size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Balance Card */}
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

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/(tabs)/transactions')}
          >
            <Plus size={20} color={isDark ? '#1A1A1A' : 'white'} />
            <Text style={[styles.actionButtonText, { color: isDark ? '#1A1A1A' : 'white' }]}>
              Add Transaction
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
            onPress={() => router.push('/(tabs)/analytics')}
          >
            <BarChart3 size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>
              View Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Financial Overview with Toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Financial Overview</Text>
            <View style={styles.overviewToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  { 
                    backgroundColor: selectedOverview === 'income' ? '#10B981' : theme.surface,
                    borderColor: selectedOverview === 'income' ? '#10B981' : theme.border,
                  }
                ]}
                onPress={() => setSelectedOverview('income')}
              >
                <TrendingUp size={16} color={selectedOverview === 'income' ? 'white' : '#10B981'} />
                <Text style={[
                  styles.toggleButtonText,
                  { color: selectedOverview === 'income' ? 'white' : theme.textSecondary }
                ]}>
                  Income
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  { 
                    backgroundColor: selectedOverview === 'expense' ? '#EF4444' : theme.surface,
                    borderColor: selectedOverview === 'expense' ? '#EF4444' : theme.border,
                  }
                ]}
                onPress={() => setSelectedOverview('expense')}
              >
                <TrendingDown size={16} color={selectedOverview === 'expense' ? 'white' : '#EF4444'} />
                <Text style={[
                  styles.toggleButtonText,
                  { color: selectedOverview === 'expense' ? 'white' : theme.textSecondary }
                ]}>
                  Expenses
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={[styles.overviewCard, { backgroundColor: theme.card }]}>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={[styles.overviewStatValue, { color: theme.text }]}>
                  {formatCurrency(overviewTotal)}
                </Text>
                <Text style={[styles.overviewStatLabel, { color: theme.textSecondary }]}>
                  Total {selectedOverview}
                </Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={[styles.overviewStatValue, { color: theme.text }]}>
                  {overviewCount}
                </Text>
                <Text style={[styles.overviewStatLabel, { color: theme.textSecondary }]}>
                  Transactions
                </Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={[styles.overviewStatValue, { color: theme.text }]}>
                  {overviewCount > 0 ? formatCurrency(overviewTotal / overviewCount) : '$0'}
                </Text>
                <Text style={[styles.overviewStatLabel, { color: theme.textSecondary }]}>
                  Average
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Top {selectedOverview === 'income' ? 'Income' : 'Expenses'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={[styles.seeAllText, { color: theme.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {topTransactions.length > 0 ? (
            <View style={[styles.transactionsCard, { backgroundColor: theme.card }]}>
              {topTransactions.map((transaction, index) => (
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
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                  {index < topTransactions.length - 1 && (
                    <View style={[styles.transactionDivider, { backgroundColor: theme.border }]} />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No {selectedOverview} transactions yet
              </Text>
            </View>
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={[styles.seeAllText, { color: theme.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.length > 0 ? (
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
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No transactions yet</Text>
              <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
                Start tracking your finances by adding your first transaction
              </Text>
              <TouchableOpacity 
                style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/(tabs)/transactions')}
              >
                <Plus size={20} color={isDark ? '#1A1A1A' : 'white'} />
                <Text style={[styles.emptyStateButtonText, { color: isDark ? '#1A1A1A' : 'white' }]}>
                  Add Transaction
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Manage Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Manage Account</Text>
          </View>
          
          <View style={styles.manageGrid}>
            <TouchableOpacity 
              style={[styles.manageCard, { backgroundColor: theme.card }]}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Settings size={24} color={theme.primary} />
              <Text style={[styles.manageCardTitle, { color: theme.text }]}>Settings</Text>
              <Text style={[styles.manageCardSubtitle, { color: theme.textSecondary }]}>
                Preferences & budget
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.manageCard, { backgroundColor: theme.card }]}
              onPress={() => router.push('/(tabs)/analytics')}
            >
              <BarChart3 size={24} color={theme.primary} />
              <Text style={[styles.manageCardTitle, { color: theme.text }]}>Analytics</Text>
              <Text style={[styles.manageCardSubtitle, { color: theme.textSecondary }]}>
                Insights & reports
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
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
  overviewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  toggleButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  overviewCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewStat: {
    alignItems: 'center',
    flex: 1,
  },
  overviewStatValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  overviewStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
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
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
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
  manageGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  manageCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  manageCardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginTop: 12,
    marginBottom: 4,
  },
  manageCardSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});