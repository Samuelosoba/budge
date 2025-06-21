import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { X, Download, Calendar, FileText, BarChart3, PieChart } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/contexts/ApiContext';

const { width } = Dimensions.get('window');

interface DataExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DataExportModal({ visible, onClose }: DataExportModalProps) {
  const { theme, isDark } = useTheme();
  const { token } = useAuth();
  const { get } = useApi();
  
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '1year' | '6months' | '3months'>('all');
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json');
  const [isExporting, setIsExporting] = useState(false);

  const getDateRange = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case '1year':
        return {
          startDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString(),
          endDate: now.toISOString()
        };
      case '6months':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString(),
          endDate: now.toISOString()
        };
      case '3months':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString(),
          endDate: now.toISOString()
        };
      default:
        return {};
    }
  };

  const handleExport = async () => {
    if (!token) {
      Alert.alert('Error', 'Please log in to export data');
      return;
    }

    setIsExporting(true);
    try {
      const dateRange = getDateRange();
      const params = new URLSearchParams({
        format: selectedFormat,
        ...dateRange
      });

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'}/privacy/export?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `budge-export-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Alert.alert(
        'Export Complete',
        `Your data has been exported successfully as a ${selectedFormat.toUpperCase()} file.${selectedFormat === 'json' ? ' The file includes visual analytics and charts.' : ''}`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Unable to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const periodOptions = [
    { key: 'all', label: 'All Time', description: 'Export all your data' },
    { key: '1year', label: 'Last Year', description: 'Past 12 months' },
    { key: '6months', label: 'Last 6 Months', description: 'Past 6 months' },
    { key: '3months', label: 'Last 3 Months', description: 'Past 3 months' },
  ];

  const formatOptions = [
    { 
      key: 'json', 
      label: 'JSON with Analytics', 
      description: 'Complete data with charts and insights',
      icon: <BarChart3 size={20} color={theme.primary} />
    },
    { 
      key: 'csv', 
      label: 'CSV Spreadsheet', 
      description: 'Transaction data for Excel/Sheets',
      icon: <FileText size={20} color={theme.primary} />
    },
  ];

  const styles = createStyles(theme, isDark);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isExporting}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Export Data</Text>
          <TouchableOpacity
            onPress={handleExport}
            disabled={isExporting}
            style={[
              styles.exportButton,
              { backgroundColor: theme.primary },
              isExporting && styles.exportButtonDisabled
            ]}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={isDark ? '#1A1A1A' : 'white'} />
            ) : (
              <Download size={20} color={isDark ? '#1A1A1A' : 'white'} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Export Info */}
          <View style={styles.infoSection}>
            <PieChart size={48} color={theme.primary} />
            <Text style={[styles.infoTitle, { color: theme.text }]}>Export Your Financial Data</Text>
            <Text style={[styles.infoDescription, { color: theme.textSecondary }]}>
              Download a complete copy of your financial data including transactions, categories, analytics, and visual charts.
            </Text>
          </View>

          {/* Time Period Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Time Period</Text>
            <View style={styles.optionsContainer}>
              {periodOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: selectedPeriod === option.key ? theme.primary : theme.surface,
                      borderColor: selectedPeriod === option.key ? theme.primary : theme.border,
                    }
                  ]}
                  onPress={() => setSelectedPeriod(option.key as any)}
                  disabled={isExporting}
                >
                  <Calendar 
                    size={20} 
                    color={selectedPeriod === option.key ? (isDark ? '#1A1A1A' : 'white') : theme.textSecondary} 
                  />
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionTitle,
                      { color: selectedPeriod === option.key ? (isDark ? '#1A1A1A' : 'white') : theme.text }
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      { color: selectedPeriod === option.key ? (isDark ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)') : theme.textSecondary }
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                  {selectedPeriod === option.key && (
                    <View style={[styles.selectedIndicator, { backgroundColor: isDark ? '#1A1A1A' : 'white' }]}>
                      <Text style={[styles.selectedIndicatorText, { color: theme.primary }]}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Format Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Export Format</Text>
            <View style={styles.optionsContainer}>
              {formatOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: selectedFormat === option.key ? theme.primary : theme.surface,
                      borderColor: selectedFormat === option.key ? theme.primary : theme.border,
                    }
                  ]}
                  onPress={() => setSelectedFormat(option.key as any)}
                  disabled={isExporting}
                >
                  {React.cloneElement(option.icon, {
                    color: selectedFormat === option.key ? (isDark ? '#1A1A1A' : 'white') : theme.primary
                  })}
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionTitle,
                      { color: selectedFormat === option.key ? (isDark ? '#1A1A1A' : 'white') : theme.text }
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      { color: selectedFormat === option.key ? (isDark ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)') : theme.textSecondary }
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                  {selectedFormat === option.key && (
                    <View style={[styles.selectedIndicator, { backgroundColor: isDark ? '#1A1A1A' : 'white' }]}>
                      <Text style={[styles.selectedIndicatorText, { color: theme.primary }]}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* What's Included */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>What's Included</Text>
            <View style={[styles.includedCard, { backgroundColor: theme.card }]}>
              <View style={styles.includedItem}>
                <Text style={[styles.includedText, { color: theme.text }]}>• All transactions and categories</Text>
              </View>
              <View style={styles.includedItem}>
                <Text style={[styles.includedText, { color: theme.text }]}>• Account settings and preferences</Text>
              </View>
              <View style={styles.includedItem}>
                <Text style={[styles.includedText, { color: theme.text }]}>• Financial analytics and insights</Text>
              </View>
              {selectedFormat === 'json' && (
                <>
                  <View style={styles.includedItem}>
                    <Text style={[styles.includedText, { color: theme.primary }]}>• Interactive pie charts and visualizations</Text>
                  </View>
                  <View style={styles.includedItem}>
                    <Text style={[styles.includedText, { color: theme.primary }]}>• Monthly spending trends</Text>
                  </View>
                  <View style={styles.includedItem}>
                    <Text style={[styles.includedText, { color: theme.primary }]}>• Category breakdown with colors</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Privacy Notice */}
          <View style={styles.section}>
            <View style={[styles.privacyNotice, { backgroundColor: theme.surface }]}>
              <Text style={[styles.privacyTitle, { color: theme.text }]}>Privacy Notice</Text>
              <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
                Your exported data is generated securely and downloaded directly to your device. We don't store copies of your exported data on our servers.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
  },
  headerTitle: {
    fontSize: Math.min(width * 0.045, 18),
    fontFamily: 'Inter-Bold',
    color: theme.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  infoTitle: {
    fontSize: Math.min(width * 0.05, 20),
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    fontSize: Math.min(width * 0.03, 12),
    fontFamily: 'Inter-Bold',
  },
  includedCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  includedItem: {
    paddingVertical: 4,
  },
  includedText: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  privacyNotice: {
    borderRadius: 12,
    padding: 16,
  },
  privacyTitle: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});