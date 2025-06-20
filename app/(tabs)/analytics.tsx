import React, { useState } from 'react';
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
import { ChartBar as BarChart3, ChartPie as PieChart, TrendingUp, Calendar, Crown, Lock, CircleArrowUp as ArrowUpCircle, CircleArrowDown as ArrowDownCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { state, getTotalIncome, getTotalExpenses } = useBudget();
  const { user, upgradeToPro } = useAuth();
  const { theme, isDark } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Category spending data
  const categoryData = state.categories
    .filter(cat => cat.type === 'expense')
    .map(cat => {
      const spent = state.transactions
        .filter(t => t.category._id === cat.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: cat.name,
        spent,
        color: cat.color,
        budget: cat.budget || 0,
      };
    })
    .filter(item => item.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  // Budget progress by category
  const budgetProgress = state.categories
    .filter(cat => cat.type === 'expense' && cat.budget)
    .map(cat => {
      const spent = state.transactions
        .filter(t => t.category._id === cat.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        category: cat.name,
        spent,
        budget: cat.budget!,
        percentage: (spent / cat.budget!) * 100,
        color: cat.color,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  const ProUpgradeCard = () => (
    <View style={styles.proCard}>
      <View style={[styles.proGradient, { backgroundColor: theme.primary }]}>
        <Crown size={32} color={isDark ? '#1A1A1A' : 'white'} />
        <Text style={[styles.proTitle, { color: isDark ? '#1A1A1A' : 'white' }]}>Unlock Pro Analytics</Text>
        <Text style={[styles.proSubtitle, { color: isDark ? 'rgba(26, 26, 26, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
          Get detailed insights, custom reports, and advanced visualizations
        </Text>
        <TouchableOpacity style={[styles.upgradeButton, { backgroundColor: isDark ? '#1A1A1A' : 'white' }]} onPress={upgradeToPro}>
          <Text style={[styles.upgradeButtonText, { color: theme.primary }]}>Upgrade to Pro</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const LockedFeature = ({ title, description }: { title: string; description: string }) => (
    <View style={[styles.lockedFeature, { backgroundColor: theme.card }]}>
      <Lock size={24} color={theme.textTertiary} />
      <View style={styles.lockedContent}>
        <Text style={[styles.lockedTitle, { color: theme.textSecondary }]}>{title}</Text>
        <Text style={[styles.lockedDescription, { color: theme.textTertiary }]}>{description}</Text>
      </View>
    </View>
  );

  const styles = createStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          {user?.isPro && (
            <View style={styles.proBadge}>
              <Crown size={16} color={theme.primary} />
              <Text style={[styles.proBadgeText, { color: theme.primary }]}>Pro</Text>
            </View>
          )}
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {[
            { key: 'week', label: 'Week' },
            { key: 'month', label: 'Month' },
            { key: 'year', label: 'Year' },
          ].map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                { 
                  backgroundColor: selectedPeriod === period.key ? theme.primary : theme.surface,
                  borderColor: selectedPeriod === period.key ? theme.primary : theme.border,
                }
              ]}
              onPress={() => setSelectedPeriod(period.key as any)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  { 
                    color: selectedPeriod === period.key ? (isDark ? '#1A1A1A' : 'white') : theme.textSecondary 
                  }
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <ArrowUpCircle size={20} color="#10B981" />
            <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(getTotalIncome())}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Income</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <ArrowDownCircle size={20} color="#EF4444" />
            <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(getTotalExpenses())}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Expenses</Text>
          </View>
        </View>

        {/* Spending by Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PieChart size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Spending by Category</Text>
          </View>
          
          {categoryData.length > 0 ? (
            <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
              {/* Simple Chart Representation */}
              <View style={styles.simpleChart}>
                <View style={styles.chartContainer}>
                  {categoryData.slice(0, 4).map((item, index) => (
                    <View key={index} style={styles.chartSegment}>
                      <View 
                        style={[
                          styles.chartBar, 
                          { 
                            backgroundColor: item.color,
                            height: Math.max(20, (item.spent / Math.max(...categoryData.map(c => c.spent))) * 120)
                          }
                        ]} 
                      />
                      <Text style={[styles.chartLabel, { color: theme.textSecondary }]}>{item.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.legendContainer}>
                {categoryData.slice(0, 5).map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={[styles.legendText, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.legendAmount, { color: theme.text }]}>{formatCurrency(item.spent)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={[styles.emptyChart, { backgroundColor: theme.card }]}>
              <Text style={[styles.emptyChartText, { color: theme.textSecondary }]}>No expense data available</Text>
            </View>
          )}
        </View>

        {/* Budget Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Progress</Text>
          </View>

          <View style={styles.budgetProgressList}>
            {budgetProgress.map((item, index) => (
              <View key={index} style={[styles.budgetProgressItem, { backgroundColor: theme.card }]}>
                <View style={styles.budgetProgressHeader}>
                  <View style={styles.budgetProgressLeft}>
                    <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
                    <Text style={[styles.budgetProgressCategory, { color: theme.text }]}>{item.category}</Text>
                  </View>
                  <Text style={[styles.budgetProgressAmount, { color: theme.textSecondary }]}>
                    {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                  </Text>
                </View>
                
                <View style={[styles.budgetProgressBar, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.budgetProgressFill,
                      {
                        width: `${Math.min(item.percentage, 100)}%`,
                        backgroundColor: item.percentage > 90 ? '#EF4444' : 
                                       item.percentage > 75 ? '#F59E0B' : '#10B981',
                      },
                    ]}
                  />
                </View>
                
                <Text style={[
                  styles.budgetProgressPercent,
                  {
                    color: item.percentage > 90 ? '#EF4444' : 
                           item.percentage > 75 ? '#F59E0B' : '#10B981'
                  }
                ]}>
                  {item.percentage.toFixed(0)}% used
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pro Features */}
        {!user?.isPro && <ProUpgradeCard />}

        {/* Monthly Trends - Pro Feature */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Monthly Trends</Text>
            {!user?.isPro && <Crown size={16} color="#8B5CF6" />}
          </View>

          {user?.isPro ? (
            <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
              <View style={styles.trendChart}>
                <Text style={[styles.comingSoon, { color: theme.textSecondary }]}>Advanced charts coming soon!</Text>
              </View>
            </View>
          ) : (
            <LockedFeature
              title="Monthly Spending Trends"
              description="Track your spending patterns over time with detailed charts"
            />
          )}
        </View>

        {/* Savings Goals - Pro Feature */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Savings Goals</Text>
            {!user?.isPro && <Crown size={16} color="#8B5CF6" />}
          </View>

          {user?.isPro ? (
            <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.comingSoon, { color: theme.textSecondary }]}>Savings goals coming soon!</Text>
            </View>
          ) : (
            <LockedFeature
              title="Smart Savings Goals"
              description="Set and track progress toward your financial goals"
            />
          )}
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
    paddingHorizontal: 20,
    paddingTop: 60, // Safe area padding
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: theme.text,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  proBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginLeft: 12,
    flex: 1,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyChart: {
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  simpleChart: {
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 20,
  },
  chartSegment: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 30,
    borderRadius: 4,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  trendChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  legendAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  budgetProgressList: {
    gap: 16,
  },
  budgetProgressItem: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  budgetProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetProgressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  budgetProgressCategory: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  budgetProgressAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  budgetProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetProgressPercent: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    textAlign: 'right',
  },
  proCard: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  proGradient: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
  },
  proTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginTop: 12,
    marginBottom: 8,
  },
  proSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  upgradeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  lockedFeature: {
    borderRadius: 12,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },
  lockedContent: {
    marginLeft: 16,
    flex: 1,
  },
  lockedTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  lockedDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  comingSoon: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    paddingVertical: 32,
  },
});