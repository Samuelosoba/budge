import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBudget } from '@/contexts/BudgetContext';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, TrendingDown, Eye, EyeOff, CreditCard, Target, Calendar, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useState } from 'react';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { state, getTotalIncome, getTotalExpenses, getBalance } = useBudget();
  const { user } = useAuth();
  const [hideBalances, setHideBalances] = useState(false);

  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const balance = getBalance();
  const budgetRemaining = state.monthlyBudget - totalExpenses;
  const budgetUsedPercent = (totalExpenses / state.monthlyBudget) * 100;

  const formatCurrency = (amount: number) => {
    if (hideBalances) return '****';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const recentTransactions = state.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const topCategories = state.categories
    .filter(cat => cat.type === 'expense')
    .map(cat => ({
      ...cat,
      spent: state.transactions
        .filter(t => t.category === cat.name && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setHideBalances(!hideBalances)}
            style={styles.eyeButton}
          >
            {hideBalances ? (
              <EyeOff size={24} color="white" />
            ) : (
              <Eye size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Balance Cards */}
      <View style={styles.balanceSection}>
        <View style={styles.balanceGrid}>
          <View style={[styles.balanceCard, styles.primaryCard]}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          </View>
          
          <View style={styles.balanceCard}>
            <View style={styles.incomeRow}>
              <TrendingUp size={20} color="#10B981" />
              <Text style={styles.incomeLabel}>Income</Text>
            </View>
            <Text style={styles.incomeAmount}>{formatCurrency(totalIncome)}</Text>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.expenseRow}>
              <TrendingDown size={20} color="#EF4444" />
              <Text style={styles.expenseLabel}>Expenses</Text>
            </View>
            <Text style={styles.expenseAmount}>{formatCurrency(totalExpenses)}</Text>
          </View>
        </View>
      </View>

      {/* Budget Progress */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={24} color="#10B981" />
          <Text style={styles.sectionTitle}>Monthly Budget</Text>
        </View>
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetAmount}>{formatCurrency(budgetRemaining)}</Text>
            <Text style={styles.budgetLabel}>remaining</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(budgetUsedPercent, 100)}%`,
                  backgroundColor: budgetUsedPercent > 90 ? '#EF4444' : '#10B981',
                },
              ]}
            />
          </View>
          <View style={styles.budgetFooter}>
            <Text style={styles.budgetText}>
              {formatCurrency(totalExpenses)} of {formatCurrency(state.monthlyBudget)} used
            </Text>
            <Text style={[styles.budgetPercent, {
              color: budgetUsedPercent > 90 ? '#EF4444' : '#10B981'
            }]}>
              {budgetUsedPercent.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Bank Accounts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <CreditCard size={24} color="#10B981" />
          <Text style={styles.sectionTitle}>Accounts</Text>
        </View>
        <View style={styles.accountsGrid}>
          {state.bankAccounts.map((account) => (
            <View key={account.id} style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <Text style={styles.accountName}>{account.name}</Text>
                <View style={[
                  styles.accountStatus,
                  { backgroundColor: account.isConnected ? '#D1FAE5' : '#FEE2E2' }
                ]}>
                  <Text style={[
                    styles.accountStatusText,
                    { color: account.isConnected ? '#059669' : '#DC2626' }
                  ]}>
                    {account.isConnected ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              </View>
              <Text style={styles.accountBalance}>{formatCurrency(account.balance)}</Text>
              <Text style={styles.accountType}>{account.type.charAt(0).toUpperCase() + account.type.slice(1)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar size={24} color="#10B981" />
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>
        <View style={styles.transactionsList}>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: transaction.type === 'income' ? '#D1FAE5' : '#FEE2E2' }
                ]}>
                  {transaction.type === 'income' ? (
                    <TrendingUp size={16} color="#059669" />
                  ) : (
                    <TrendingDown size={16} color="#DC2626" />
                  )}
                </View>
                <View>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                </View>
              </View>
              <Text style={[
                styles.transactionAmount,
                {
                  color: transaction.type === 'income' ? '#059669' : '#DC2626',
                },
              ]}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Top Spending Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AlertCircle size={24} color="#10B981" />
          <Text style={styles.sectionTitle}>Top Spending</Text>
        </View>
        <View style={styles.categoriesList}>
          {topCategories.map((category) => (
            <View key={category.id} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View 
                  style={[styles.categoryColor, { backgroundColor: category.color }]}
                />
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>
              <Text style={styles.categoryAmount}>{formatCurrency(category.spent)}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  eyeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceSection: {
    paddingHorizontal: 24,
    marginTop: -20,
  },
  balanceGrid: {
    gap: 16,
  },
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCard: {
    backgroundColor: '#1F2937',
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  incomeLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    marginLeft: 8,
  },
  incomeAmount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
    marginLeft: 8,
  },
  expenseAmount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  budgetCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  budgetHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetAmount: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  budgetLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
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
    color: '#6B7280',
  },
  budgetPercent: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  accountsGrid: {
    gap: 12,
  },
  accountCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  accountStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accountStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  accountBalance: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  transactionCategory: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  categoriesList: {
    gap: 12,
  },
  categoryItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  categoryAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
});