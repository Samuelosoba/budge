import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useBudget, Transaction } from '@/contexts/BudgetContext';
import { useTheme } from '@/contexts/ThemeContext';
import CategoryModal from '@/components/CategoryModal';
import { Plus, Search, TrendingUp, TrendingDown, Edit, Trash2, Calendar, DollarSign, FileText, Settings } from 'lucide-react-native';

export default function TransactionsScreen() {
  const { 
    state, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction 
  } = useBudget();
  const { theme, isDark } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryModalType, setCategoryModalType] = useState<'income' | 'expense'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const filteredTransactions = state.transactions
    .filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          transaction.category.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || transaction.type === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const openModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        amount: transaction.amount.toString(),
        description: transaction.description,
        category: transaction.category._id,
        type: transaction.type,
        date: transaction.date.split('T')[0],
        notes: transaction.notes || '',
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        amount: '',
        description: '',
        category: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setModalVisible(true);
  };

  const openCategoryModal = (type: 'income' | 'expense') => {
    setCategoryModalType(type);
    setCategoryModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.amount || !formData.description || !formData.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const transactionData = {
        amount,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        date: formData.date,
        notes: formData.notes,
      };

      if (editingTransaction) {
        await updateTransaction({
          ...editingTransaction,
          ...transactionData,
          category: {
            _id: formData.category,
            name: state.categories.find(c => c.id === formData.category)?.name || '',
            color: state.categories.find(c => c.id === formData.category)?.color || '#000000',
            type: formData.type,
          },
        });
      } else {
        await addTransaction(transactionData);
      }

      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save transaction');
    }
  };

  const handleDelete = (transactionId: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transactionId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete transaction');
            }
          }
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCategories = (type: 'income' | 'expense') => {
    return state.categories.filter(cat => cat.type === type);
  };

  const styles = createStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => openCategoryModal('expense')}
          >
            <Settings size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Search size={20} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search transactions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.textTertiary}
            />
          </View>
          
          <View style={styles.filterButtons}>
            {[
              { key: 'all', label: 'All' },
              { key: 'income', label: 'Income' },
              { key: 'expense', label: 'Expense' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  { 
                    backgroundColor: selectedType === filter.key ? theme.primary : theme.surface,
                    borderColor: selectedType === filter.key ? theme.primary : theme.border,
                  }
                ]}
                onPress={() => setSelectedType(filter.key as any)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    { 
                      color: selectedType === filter.key ? (isDark ? '#1A1A1A' : 'white') : theme.textSecondary 
                    }
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsList}>
          {state.isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading transactions...</Text>
            </View>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <View key={transaction.id} style={[styles.transactionItem, { backgroundColor: theme.card }]}>
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: transaction.category.color }
                  ]} />
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionDescription, { color: theme.text }]}>{transaction.description}</Text>
                    <Text style={[styles.transactionCategory, { color: theme.textSecondary }]}>{transaction.category.name}</Text>
                    <Text style={[styles.transactionDate, { color: theme.textTertiary }]}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmount,
                    {
                      color: transaction.type === 'income' ? '#059669' : '#DC2626',
                    },
                  ]}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </Text>
                  <View style={styles.transactionActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.surface }]}
                      onPress={() => openModal(transaction)}
                    >
                      <Edit size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.surface }]}
                      onPress={() => handleDelete(transaction.id)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No transactions found</Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.textTertiary }]}>
                {searchQuery || selectedType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Add your first transaction to get started'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: theme.primary }]}
        onPress={() => openModal()}
      >
        <Plus size={24} color={isDark ? '#1A1A1A' : 'white'} />
      </TouchableOpacity>

      {/* Add/Edit Transaction Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalCancelButton, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.modalSaveButton, { color: theme.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Type Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { 
                      backgroundColor: formData.type === 'income' ? '#10B981' : theme.surface,
                      borderColor: formData.type === 'income' ? '#10B981' : theme.border,
                    }
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'income', category: '' })}
                >
                  <TrendingUp size={20} color={formData.type === 'income' ? 'white' : '#10B981'} />
                  <Text style={[
                    styles.typeButtonText,
                    { color: formData.type === 'income' ? 'white' : theme.textSecondary }
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { 
                      backgroundColor: formData.type === 'expense' ? '#EF4444' : theme.surface,
                      borderColor: formData.type === 'expense' ? '#EF4444' : theme.border,
                    }
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'expense', category: '' })}
                >
                  <TrendingDown size={20} color={formData.type === 'expense' ? 'white' : '#EF4444'} />
                  <Text style={[
                    styles.typeButtonText,
                    { color: formData.type === 'expense' ? 'white' : theme.textSecondary }
                  ]}>
                    Expense
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Amount</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <DollarSign size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="0.00"
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  keyboardType="numeric"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <FileText size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="What was this for?"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholderTextColor={theme.textTertiary}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <View style={styles.categoryHeader}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Category</Text>
                <TouchableOpacity
                  style={[styles.addCategoryButton, { backgroundColor: theme.primary }]}
                  onPress={() => openCategoryModal(formData.type)}
                >
                  <Plus size={16} color={isDark ? '#1A1A1A' : 'white'} />
                  <Text style={[styles.addCategoryButtonText, { color: isDark ? '#1A1A1A' : 'white' }]}>Add</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.categoriesGrid}>
                {getCategories(formData.type).map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      { 
                        backgroundColor: formData.category === category.id ? theme.primary : theme.surface,
                        borderColor: formData.category === category.id ? theme.primary : theme.border,
                      }
                    ]}
                    onPress={() => setFormData({ ...formData, category: category.id })}
                  >
                    <View 
                      style={[styles.categoryColor, { backgroundColor: category.color }]}
                    />
                    <Text style={[
                      styles.categoryButtonText,
                      { color: formData.category === category.id ? (isDark ? '#1A1A1A' : 'white') : theme.textSecondary }
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Date</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Calendar size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="YYYY-MM-DD"
                  value={formData.date}
                  onChangeText={(text) => setFormData({ ...formData, date: text })}
                  placeholderTextColor={theme.textTertiary}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Notes (Optional)</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <FileText size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholderTextColor={theme.textTertiary}
                  multiline
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Category Modal */}
      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        type={categoryModalType}
      />
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  transactionsList: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  transactionItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  transactionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 120, // Above the tab bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  modalCancelButton: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  modalSaveButton: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addCategoryButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  typeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});