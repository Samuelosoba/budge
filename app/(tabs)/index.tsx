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
import { Plus, MoveHorizontal as MoreHorizontal, Eye, EyeOff } from 'lucide-react-native';
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

  const styles = createStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Balance Overview</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setHideBalances(!hideBalances)}
          >
            {hideBalances ? (
              <EyeOff size={20} color={theme.text} />
            ) : (
              <Eye size={20} color={theme.text} />
            )}
          </TouchableOpacity>
        </View>

        {/* Account Summary Cards */}
        <View style={styles.accountCards}>
          <View style={[styles.accountCard, { backgroundColor: theme.card }]}>
            <View style={styles.accountRow}>
              <View style={[styles.accountIcon, { backgroundColor: '#3B82F6' }]} />
              <Text style={[styles.accountName, { color: theme.text }]}>Checking</Text>
              <Text style={[styles.accountAmount, { color: theme.text }]}>{formatCurrency(2840)}</Text>
            </View>
          </View>
          
          <View style={[styles.accountCard, { backgroundColor: theme.card }]}>
            <View style={styles.accountRow}>
              <View style={[styles.accountIcon, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.accountName, { color: theme.text }]}>Savings</Text>
              <Text style={[styles.accountAmount, { color: theme.text }]}>{formatCurrency(12500)}</Text>
            </View>
          </View>
          
          <View style={[styles.accountCard, { backgroundColor: theme.card }]}>
            <View style={styles.accountRow}>
              <View style={[styles.accountIcon, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.accountName, { color: theme.text }]}>Credit</Text>
              <Text style={[styles.accountAmount, { color: theme.text }]}>{formatCurrency(-850)}</Text>
            </View>
          </View>
        </View>

        {/* Main Balance Card */}
        <View style={[styles.mainBalanceCard, { backgroundColor: theme.balanceCard }]}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceTitle}>Balance Overview</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.pillButton, { backgroundColor: theme.pillButton }]}>
            <View style={styles.pillButtonContent}>
              <View style={[styles.pillButtonIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
              <Text style={[styles.pillButtonText, { color: theme.pillButtonText }]}>Debit</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillButton, { backgroundColor: theme.pillButton }]}>
            <Text style={[styles.pillButtonText, { color: theme.pillButtonText }]}>Credit</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction Overview Section */}
        <View style={styles.bottomSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Transaction Overview</Text>
            <TouchableOpacity style={styles.moreButton}>
              <MoreHorizontal size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.overviewCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.overviewText, { color: theme.textSecondary }]}>
              Track your income and expenses. Manage your transactions, your financial goals.
            </Text>
            
            <View style={styles.overviewStats}>
              <View style={styles.statItem}>
                <View style={[styles.chartPlaceholder, { backgroundColor: theme.primary }]} />
                <Text style={[styles.statAmount, { color: theme.text }]}>{formatCurrency(totalExpenses)}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Expenses</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.chartIcon, { backgroundColor: theme.textSecondary }]} />
                <Text style={[styles.statAmount, { color: theme.text }]}>{formatCurrency(totalIncome)}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Income</Text>
              </View>
            </View>
          </View>

          <View style={styles.finalActions}>
            <TouchableOpacity style={[styles.finalButton, { backgroundColor: theme.pillButton }]}>
              <Text style={[styles.finalButtonText, { color: theme.pillButtonText }]}>Collect</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.finalButton, { backgroundColor: theme.pillButton }]}>
              <Text style={[styles.finalButtonText, { color: theme.pillButtonText }]}>Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={styles.transactionsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
            {recentTransactions.slice(0, 3).map((transaction, index) => (
              <View key={transaction.id} style={[styles.transactionRow, { backgroundColor: theme.transactionRow }]}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, { backgroundColor: transaction.category.color }]} />
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionTitle, { color: theme.text }]}>
                      {transaction.description}
                    </Text>
                    <Text style={[styles.transactionSubtitle, { color: theme.textSecondary }]}>
                      {transaction.category.name}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.transactionAmount, { color: theme.text }]}>
                  {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))}
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
    paddingHorizontal: 20,
    paddingTop: 60, // Safe area padding
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.text,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountCards: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  accountCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  accountName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  accountAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  mainBalanceCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceHeader: {
    alignItems: 'center',
  },
  balanceTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.balanceText,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: theme.balanceText,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  pillButton: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pillButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillButtonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  pillButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  bottomSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  moreButton: {
    padding: 8,
  },
  overviewCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  overviewText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  chartPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  chartIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  finalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  finalButton: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  finalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 8,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});