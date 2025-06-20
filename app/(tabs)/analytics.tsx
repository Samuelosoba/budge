import React, { useState } from 'react';
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
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryArea } from 'victory';
import { ChartBar as BarChart3, ChartPie as PieChart, TrendingUp, Calendar, Crown, Lock, CircleArrowUp as ArrowUpCircle, CircleArrowDown as ArrowDownCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { state, getTotalIncome, getTotalExpenses } = useBudget();
  const { user, upgradeToPro } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Category spending data for pie chart
  const categoryData = state.categories
    .filter(cat => cat.type === 'expense')
    .map(cat => {
      const spent = state.transactions
        .filter(t => t.category === cat.name && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        x: cat.name,
        y: spent,
        fill: cat.color,
      };
    })
    .filter(item => item.y > 0)
    .sort((a, b) => b.y - a.y);

  // Monthly spending trend (mock data for demo)
  const monthlyData = [
    { month: 'Jan', spending: 2800, income: 3500 },
    { month: 'Feb', spending: 3200, income: 3500 },
    { month: 'Mar', spending: 2900, income: 3500 },
    { month: 'Apr', spending: 3100, income: 3500 },
    { month: 'May', spending: getTotalExpenses(), income: getTotalIncome() },
  ];

  // Budget progress by category
  const budgetProgress = state.categories
    .filter(cat => cat.type === 'expense' && cat.budget)
    .map(cat => {
      const spent = state.transactions
        .filter(t => t.category === cat.name && t.type === 'expense')
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
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.proGradient}
      >
        <Crown size={32} color="white" />
        <Text style={styles.proTitle}>Unlock Pro Analytics</Text>
        <Text style={styles.proSubtitle}>
          Get detailed insights, custom reports, and advanced visualizations
        </Text>
        <TouchableOpacity style={styles.upgradeButton} onPress={upgradeToPro}>
          <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const LockedFeature = ({ title, description }: { title: string; description: string }) => (
    <View style={styles.lockedFeature}>
      <Lock size={24} color="#9CA3AF" />
      <View style={styles.lockedContent}>
        <Text style={styles.lockedTitle}>{title}</Text>
        <Text style={styles.lockedDescription}>{description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Analytics</Text>
        {user?.isPro && (
          <View style={styles.proBadge}>
            <Crown size={16} color="#10B981" />
            <Text style={styles.proBadgeText}>Pro</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                selectedPeriod === period.key && styles.activePeriodButton,
              ]}
              onPress={() => setSelectedPeriod(period.key as any)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.activePeriodButtonText,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <ArrowUpCircle size={20} color="#10B981" />
            <Text style={styles.statValue}>{formatCurrency(getTotalIncome())}</Text>
            <Text style={styles.statLabel}>Total Income</Text>
          </View>
          <View style={styles.statCard}>
            <ArrowDownCircle size={20} color="#EF4444" />
            <Text style={styles.statValue}>{formatCurrency(getTotalExpenses())}</Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </View>
        </View>

        {/* Spending by Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PieChart size={24} color="#10B981" />
            <Text style={styles.sectionTitle}>Spending by Category</Text>
          </View>
          
          {categoryData.length > 0 ? (
            <View style={styles.chartCard}>
              <VictoryPie
                data={categoryData}
                width={width - 48}
                height={200}
                innerRadius={60}
                padAngle={2}
                labelComponent={<></>}
                colorScale={categoryData.map(item => item.fill)}
              />
              
              <View style={styles.legendContainer}>
                {categoryData.slice(0, 5).map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.fill }]} />
                    <Text style={styles.legendText}>{item.x}</Text>
                    <Text style={styles.legendAmount}>{formatCurrency(item.y)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No expense data available</Text>
            </View>
          )}
        </View>

        {/* Budget Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={24} color="#10B981" />
            <Text style={styles.sectionTitle}>Budget Progress</Text>
          </View>

          <View style={styles.budgetProgressList}>
            {budgetProgress.map((item, index) => (
              <View key={index} style={styles.budgetProgressItem}>
                <View style={styles.budgetProgressHeader}>
                  <View style={styles.budgetProgressLeft}>
                    <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
                    <Text style={styles.budgetProgressCategory}>{item.category}</Text>
                  </View>
                  <Text style={styles.budgetProgressAmount}>
                    {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                  </Text>
                </View>
                
                <View style={styles.budgetProgressBar}>
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
            <TrendingUp size={24} color="#10B981" />
            <Text style={styles.sectionTitle}>Monthly Trends</Text>
            {!user?.isPro && <Crown size={16} color="#8B5CF6" />}
          </View>

          {user?.isPro ? (
            <View style={styles.chartCard}>
              <VictoryChart
                width={width - 48}
                height={200}
                padding={{ left: 60, top: 20, right: 40, bottom: 40 }}
              >
                <VictoryAxis dependentAxis tickFormat={(t) => `$${t}`} />
                <VictoryAxis />
                <VictoryArea
                  data={monthlyData}
                  x="month"
                  y="spending"
                  style={{
                    data: { fill: "#10B981", fillOpacity: 0.6, stroke: "#10B981", strokeWidth: 2 }
                  }}
                />
              </VictoryChart>
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
            <Calendar size={24} color="#10B981" />
            <Text style={styles.sectionTitle}>Savings Goals</Text>
            {!user?.isPro && <Crown size={16} color="#8B5CF6" />}
          </View>

          {user?.isPro ? (
            <View style={styles.chartCard}>
              <Text style={styles.comingSoon}>Savings goals coming soon!</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  proBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginVertical: 16,
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
  },
  activePeriodButton: {
    backgroundColor: '#10B981',
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  activePeriodButtonText: {
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
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
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
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
    flex: 1,
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyChart: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  legendContainer: {
    width: '100%',
    marginTop: 16,
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
    color: '#1F2937',
  },
  legendAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  budgetProgressList: {
    gap: 16,
  },
  budgetProgressItem: {
    backgroundColor: 'white',
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
    color: '#1F2937',
  },
  budgetProgressAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  budgetProgressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
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
  },
  proTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  proSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#8B5CF6',
  },
  lockedFeature: {
    backgroundColor: 'white',
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
    color: '#6B7280',
    marginBottom: 4,
  },
  lockedDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  comingSoon: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 32,
  },
});