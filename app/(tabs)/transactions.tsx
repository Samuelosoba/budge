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
  Dimensions,
} from 'react-native';
import { useBudget, Transaction } from '@/contexts/BudgetContext';
import { useTheme } from '@/contexts/ThemeContext';
import AddCategoryModal from '@/components/AddCategoryModal';
import CategoryModal from '@/components/CategoryModal';
import { Plus, Search, TrendingUp, TrendingDown, CreditCard as Edit3, Trash2, Calendar, DollarSign, FileText, Tag } from 'lucide-react-native';

const { width } = Dimensions.get('window');

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
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [addCategoryType, setAddCategoryType] = useState<'income' | 'expense'>('expense');
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

  const openCategoryModal = () => {
    setCategoryModalVisible(true);
  };

  const handleCategorySelect = (categoryId: string) => {
    setFormData(prev => ({ ...prev, category: categoryId }));
    setCategoryModalVisible(false);
  };

  const handleAddCategoryFromModal = (type: 'income' | 'expense') => {
    console.log('Opening add category modal for type:', type);
    setAddCategoryType(type);
    setCategoryModalVisible(false); // Close category modal first
    setTimeout(() => {
      setAddCategoryModalVisible(true); // Then open add category modal
    }, 300); // Small delay for smooth transition
  };

  const handleCategoryAdded = (categoryId: string) => {
    console.log('Category added with ID:', categoryId);
    // Auto-select the newly created category
    setFormData(prev => ({ ...prev, category: categoryId }));
    setAddCategoryModalVisible(false);
    // Don't reopen category modal - user can see the selected category in the form
  };

  const handleSave = async () => {
    // Validation
    if (!formData.amount || !formData.description || !formData.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Validate date
    const selectedDate = new Date(formData.date);
    const today = new Date();
    if (selectedDate > today) {
      Alert.alert('Error', 'Transaction date cannot be in the future');
      return;
    }

    try {
      const transactionData = {
        amount,
        description: formData.description.trim(),
        category: formData.category,
        type: formData.type,
        date: formData.date,
        notes: formData.notes.trim(),
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
        Alert.alert('Success', 'Transaction updated successfully');
      } else {
        await addTransaction(transactionData);
        Alert.alert('Success', 'Transaction added successfully');
      }

      setModalVisible(false);
      // Reset form
      setFormData({
        amount: '',
        description: '',
        category: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setEditingTransaction(null);
    } catch (error) {
      console.error('Transaction save error:', error);
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
              Alert.alert('Success', 'Transaction deleted successfully');
            } catch (error) {
              console.error('Delete transaction error:', error);
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

  const getSelectedCategoryName = () => {
    if (!formData.category) return 'Select category';
    const category = state.categories.find(cat => cat.id === formData.category);
    return category ? category.name : 'Select category';
  };

  const styles = createStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transactions</Text>
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
                    <Text style={[styles.transactionDescription, { color: theme.text }]} numberOfLines={1}>
                      {transaction.description}
                    </Text>
                    <Text style={[styles.transactionCategory, { color: theme.textSecondary }]} numberOfLines={1}>
                      {transaction.category.name} • {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmount,
                    {
                      color: transaction.type === 'income' ? '#4ADE80' : '#F87171',
                    },
                  ]} numberOfLines={1}>
                    {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                  </Text>
                  <View style={styles.transactionActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.surface }]}
                      onPress={() => openModal(transaction)}
                    >
                      <Edit3 size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.surface }]}
                      onPress={() => handleDelete(transaction.id)}
                    >
                      <Trash2 size={16} color="#F87171" />
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
            <TouchableOpacity onPress={() => {
              setModalVisible(false);
              setEditingTransaction(null);
              setFormData({
                amount: '',
                description: '',
                category: '',
                type: 'expense',
                date: new Date().toISOString().split('T')[0],
                notes: '',
              });
            }}>
              <Text style={[styles.modalCancelButton, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.modalSaveButton, { color: theme.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Type Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { 
                      backgroundColor: formData.type === 'income' ? '#4ADE80' : theme.surface,
                      borderColor: formData.type === 'income' ? '#4ADE80' : theme.border,
                    }
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'income', category: '' })}
                >
                  <TrendingUp size={20} color={formData.type === 'income' ? 'white' : '#4ADE80'} />
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
                      backgroundColor: formData.type === 'expense' ? '#F87171' : theme.surface,
                      borderColor: formData.type === 'expense' ? '#F87171' : theme.border,
                    }
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'expense', category: '' })}
                >
                  <TrendingDown size={20} color={formData.type === 'expense' ? 'white' : '#F87171'} />
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
              <Text style={[styles.formLabel, { color: theme.text }]}>Amount *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <DollarSign size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="0.00"
                  value={formData.amount}
                  onChangeText={(text) => {
                    // Only allow numbers and decimal point
                    const cleanText = text.replace(/[^0-9.]/g, '');
                    // Prevent multiple decimal points
                    const parts = cleanText.split('.');
                    if (parts.length > 2) {
                      return;
                    }
                    setFormData({ ...formData, amount: cleanText });
                  }}
                  keyboardType="decimal-pad"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Description *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <FileText size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="What was this for?"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholderTextColor={theme.textTertiary}
                  maxLength={200}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Category *</Text>
              <TouchableOpacity
                style={[styles.categorySelector, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={openCategoryModal}
              >
                <Tag size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <Text style={[
                  styles.categorySelectorText, 
                  { color: formData.category ? theme.text : theme.textTertiary }
                ]} numberOfLines={1}>
                  {getSelectedCategoryName()}
                </Text>
                <Plus size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Date *</Text>
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
                  maxLength={500}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        type={formData.type}
        selectedCategory={formData.category}
        onCategorySelect={handleCategorySelect}
        onAddCategory={handleAddCategoryFromModal}
      />

      {/* Add Category Modal */}
      <AddCategoryModal
        visible={addCategoryModalVisible}
        onClose={() => setAddCategoryModalVisible(false)}
        type={addCategoryType}
        onCategoryAdded={handleCategoryAdded}
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
    fontSize: Math.min(width * 0.06, 24),
    fontFamily: 'Inter-Bold',
    color: theme.text,
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
    fontSize: Math.min(width * 0.04, 16),
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
    fontSize: Math.min(width * 0.035, 14),
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
    fontSize: Math.min(width * 0.04, 16),
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
    marginRight: 12,
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
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
  },
  transactionRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  transactionAmount: {
    fontSize: Math.min(width * 0.04, 16),
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
    fontSize: Math.min(width * 0.045, 18),
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: Math.min(width * 0.035, 14),
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
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Regular',
  },
  modalTitle: {
    fontSize: Math.min(width * 0.045, 18),
    fontFamily: 'Inter-Bold',
  },
  modalSaveButton: {
    fontSize: Math.min(width * 0.04, 16),
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
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
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
    fontSize: Math.min(width * 0.04, 16),
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
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Regular',
    paddingVertical: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
  },
  categorySelectorText: {
    flex: 1,
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Regular',
    marginRight: 12,
  },
});