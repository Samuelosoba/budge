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
import { useCurrency } from '@/contexts/CurrencyContext';
import { ChartBar as BarChart3, ChartPie as PieChart, TrendingUp, Calendar, Crown, Lock, CircleArrowUp as ArrowUpCircle, CircleArrowDown as ArrowDownCircle, Activity, Target, ChartLine as LineChart, ChartBar as BarChart2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { state, getTotalIncome, getTotalExpenses } = useBudget();
  const { user, upgradeToPro } = useAuth();
  const { theme, isDark } = useTheme();
  const { formatCurrency } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'bar' | 'line'>('pie');

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

  // Monthly spending trend (last 6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthSpending = state.transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd && t.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      amount: monthSpending,
    };
  }).reverse();

  const maxMonthlySpending = Math.max(...monthlyTrend.map(m => m.amount));

  // Income vs Expense comparison
  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

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

  const renderChart = () => {
    if (categoryData.length === 0) {
      return (
        <View style={[styles.emptyChart, { backgroundColor: theme.card }]}>
          <Text style={[styles.emptyChartText, { color: theme.textSecondary }]}>No expense data available</Text>
        </View>
      );
    }

    switch (selectedChartType) {
      case 'pie':
        return (
          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            {/* Donut Chart Representation */}
            <View style={styles.donutChart}>
              <View style={styles.donutContainer}>
                {categoryData.slice(0, 5).map((item, index) => {
                  const percentage = (item.spent / totalExpenses) * 100;
                  return (
                    <View key={index} style={styles.donutSegment}>
                      <View 
                        style={[
                          styles.donutBar, 
                          { 
                            backgroundColor: item.color,
                            width: `${Math.max(10, percentage)}%`
                          }
                        ]} 
                      />
                      <Text style={[styles.donutLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.donutPercentage, { color: theme.text }]}>
                        {percentage.toFixed(0)}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
            
            <View style={styles.legendContainer}>
              {categoryData.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.legendAmount, { color: theme.text }]}>{formatCurrency(item.spent)}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'bar':
        return (
          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <View style={styles.barChart}>
              <View style={styles.chartContainer}>
                {categoryData.slice(0, 5).map((item, index) => (
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
                    <Text style={[styles.chartLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.chartAmount, { color: theme.textTertiary }]}>
                      {formatCurrency(item.spent, { compact: true })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );

      case 'line':
        return (
          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <View style={styles.lineChart}>
              <View style={styles.lineChartContainer}>
                {monthlyTrend.map((item, index) => (
                  <View key={index} style={styles.lineChartPoint}>
                    <View 
                      style={[
                        styles.linePoint, 
                        { 
                          backgroundColor: theme.primary,
                          bottom: Math.max(10, (item.amount / Math.max(maxMonthlySpending, 1)) * 100)
                        }
                      ]} 
                    />
                    <Text style={[styles.lineChartLabel, { color: theme.textSecondary }]}>{item.month}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.lineChartTitle, { color: theme.text }]}>Monthly Spending Trend</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

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

        {/* Savings Rate Card */}
        <View style={styles.section}>
          <View style={[styles.savingsCard, { backgroundColor: theme.card }]}>
            <View style={styles.savingsHeader}>
              <Target size={24} color={theme.primary} />
              <Text style={[styles.savingsTitle, { color: theme.text }]}>Savings Rate</Text>
            </View>
            <Text style={[styles.savingsRate, { color: savingsRate > 0 ? '#10B981' : '#EF4444' }]}>
              {savingsRate.toFixed(1)}%
            </Text>
            <Text style={[styles.savingsSubtitle, { color: theme.textSecondary }]}>
              {savingsRate > 20 ? 'Excellent savings!' : savingsRate > 10 ? 'Good progress' : 'Consider saving more'}
            </Text>
          </View>
        </View>

        {/* Chart Type Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PieChart size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Spending Analysis</Text>
          </View>

          <View style={styles.chartTypeSelector}>
            {[
              { key: 'pie', label: 'Pie Chart', icon: PieChart },
              { key: 'bar', label: 'Bar Chart', icon: BarChart3 },
              { key: 'line', label: 'Line Chart', icon: LineChart },
            ].map((chartType) => (
              <TouchableOpacity
                key={chartType.key}
                style={[
                  styles.chartTypeButton,
                  { 
                    backgroundColor: selectedChartType === chartType.key ? theme.primary : theme.surface,
                    borderColor: selectedChartType === chartType.key ? theme.primary : theme.border,
                  }
                ]}
                onPress={() => setSelectedChartType(chartType.key as any)}
              >
                <chartType.icon 
                  size={16} 
                  color={selectedChartType === chartType.key ? (isDark ? '#1A1A1A' : 'white') : theme.textSecondary} 
                />
                <Text
                  style={[
                    styles.chartTypeButtonText,
                    { 
                      color: selectedChartType === chartType.key ? (isDark ? '#1A1A1A' : 'white') : theme.textSecondary 
                    }
                  ]}
                >
                  {chartType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {renderChart()}
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
                    <Text style={[styles.budgetProgressCategory, { color: theme.text }]} numberOfLines={1}>{item.category}</Text>
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

        {/* Advanced Analytics - Pro Feature */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Advanced Analytics</Text>
            {!user?.isPro && <Crown size={16} color="#8B5CF6" />}
          </View>

          {user?.isPro ? (
            <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
              <View style={styles.advancedChart}>
                <Text style={[styles.comingSoon, { color: theme.textSecondary }]}>Advanced analytics coming soon!</Text>
              </View>
            </View>
          ) : (
            <LockedFeature
              title="Advanced Analytics Dashboard"
              description="Detailed spending patterns, forecasting, and custom reports"
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
    fontSize: Math.min(width * 0.07, 28),
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
    fontSize: Math.min(width * 0.03, 12),
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
    fontSize: Math.min(width * 0.035, 14),
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
    fontSize: Math.min(width * 0.05, 20),
    fontFamily: 'Inter-Bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: Math.min(width * 0.03, 12),
    fontFamily: 'Inter-Medium',
    marginTop: 4,
    textAlign: 'center',
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
    fontSize: Math.min(width * 0.05, 20),
    fontFamily: 'Inter-Bold',
    marginLeft: 12,
    flex: 1,
  },
  savingsCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  savingsTitle: {
    fontSize: Math.min(width * 0.045, 18),
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
  },
  savingsRate: {
    fontSize: Math.min(width * 0.08, 32),
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  savingsSubtitle: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  chartTypeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  chartTypeButtonText: {
    fontSize: Math.min(width * 0.03, 12),
    fontFamily: 'Inter-SemiBold',
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
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Medium',
  },
  barChart: {
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 10,
  },
  chartSegment: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: Math.max(20, width * 0.08),
    borderRadius: 4,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: Math.min(width * 0.03, 12),
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 2,
  },
  chartAmount: {
    fontSize: Math.min(width * 0.025, 10),
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  donutChart: {
    marginBottom: 20,
  },
  donutContainer: {
    gap: 12,
  },
  donutSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  donutBar: {
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    minWidth: 20,
  },
  donutLabel: {
    flex: 1,
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Medium',
  },
  donutPercentage: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Bold',
    minWidth: 40,
    textAlign: 'right',
  },
  lineChart: {
    marginBottom: 20,
  },
  lineChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 10,
    position: 'relative',
  },
  lineChartPoint: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    height: 120,
  },
  linePoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
  lineChartLabel: {
    fontSize: Math.min(width * 0.03, 12),
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    position: 'absolute',
    bottom: -20,
  },
  lineChartTitle: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginTop: 20,
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
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Medium',
  },
  legendAmount: {
    fontSize: Math.min(width * 0.035, 14),
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
    flex: 1,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  budgetProgressCategory: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  budgetProgressAmount: {
    fontSize: Math.min(width * 0.035, 14),
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
    fontSize: Math.min(width * 0.03, 12),
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
    fontSize: Math.min(width * 0.05, 20),
    fontFamily: 'Inter-Bold',
    marginTop: 12,
    marginBottom: 8,
  },
  proSubtitle: {
    fontSize: Math.min(width * 0.035, 14),
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
    fontSize: Math.min(width * 0.04, 16),
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
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  lockedDescription: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
  },
  advancedChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoon: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    paddingVertical: 32,
  },
});