import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { X, Search, Check, DollarSign } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency, SUPPORTED_CURRENCIES, Currency } from '@/contexts/CurrencyContext';

const { width } = Dimensions.get('window');

interface CurrencySelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function CurrencySelector({ visible, onClose }: CurrencySelectorProps) {
  const { theme, isDark } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(curr =>
    curr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    curr.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCurrencySelect = async (selectedCurrency: Currency) => {
    await setCurrency(selectedCurrency);
    onClose();
  };

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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Currency</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Search size={20} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search currencies..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.textTertiary}
            />
          </View>
        </View>

        {/* Current Selection */}
        <View style={styles.currentSection}>
          <Text style={[styles.currentLabel, { color: theme.textSecondary }]}>Current Currency</Text>
          <View style={[styles.currentCurrency, { backgroundColor: theme.card }]}>
            <View style={styles.currencyInfo}>
              <Text style={[styles.currencySymbol, { color: theme.primary }]}>{currency.symbol}</Text>
              <View>
                <Text style={[styles.currencyCode, { color: theme.text }]}>{currency.code}</Text>
                <Text style={[styles.currencyName, { color: theme.textSecondary }]}>{currency.name}</Text>
              </View>
            </View>
            <Check size={20} color={theme.primary} />
          </View>
        </View>

        {/* Currency List */}
        <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
          <Text style={[styles.listTitle, { color: theme.text }]}>All Currencies</Text>
          {filteredCurrencies.map((curr) => (
            <TouchableOpacity
              key={curr.code}
              style={[
                styles.currencyItem,
                { backgroundColor: theme.card },
                currency.code === curr.code && { backgroundColor: theme.surface }
              ]}
              onPress={() => handleCurrencySelect(curr)}
            >
              <View style={styles.currencyInfo}>
                <Text style={[styles.currencySymbol, { color: theme.primary }]}>{curr.symbol}</Text>
                <View>
                  <Text style={[styles.currencyCode, { color: theme.text }]}>{curr.code}</Text>
                  <Text style={[styles.currencyName, { color: theme.textSecondary }]}>{curr.name}</Text>
                </View>
              </View>
              {currency.code === curr.code && (
                <Check size={20} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
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
  },
  searchSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Regular',
    paddingVertical: 16,
  },
  currentSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  currentLabel: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
  },
  currentCurrency: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currencyList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listTitle: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencySymbol: {
    fontSize: Math.min(width * 0.05, 20),
    fontFamily: 'Inter-Bold',
    marginRight: 16,
    minWidth: 32,
    textAlign: 'center',
  },
  currencyCode: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  currencyName: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
  },
});