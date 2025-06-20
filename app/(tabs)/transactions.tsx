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
import { LinearGradient } from 'expo-linear-gradient';
import { useBudget, Transaction } from '@/contexts/BudgetContext';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Edit, Trash2, Calendar, DollarSign, Tag, FileText } from 'lucide-react-native';

export default function TransactionsScreen() {
  const { 
    state, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction 
  } = useBudget();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [modalVisible, setModalVisible] = useState(false);
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openModal()}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
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
                selectedType === filter.key && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedType(filter.key as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedType === filter.key && styles.activeFilterButtonText,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        {state.isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: transaction.type === 'income' ? '#D1FAE5' : '#FEE2E2' }
                ]}>
                  {transaction.type === 'income' ? (
                    <TrendingUp size={20} color="#059669" />
                  ) : (
                    <TrendingDown size={20} color="#DC2626" />
                  )}
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionCategory}>{transaction.category.name}</Text>
                  <Text style={styles.transactionDate}>
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
                    style={styles.actionButton}
                    onPress={() => openModal(transaction)}
                  >
                    <Edit size={16} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
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
            <Text style={styles.emptyStateText}>No transactions found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || selectedType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Add your first transaction to get started'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Transaction Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Type Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'income' && styles.activeTypeButton,
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'income', category: '' })}
                >
                  <TrendingUp size={20} color={formData.type === 'income' ? 'white' : '#10B981'} />
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === 'income' && styles.activeTypeButtonText,
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'expense' && styles.activeTypeButton,
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'expense', category: '' })}
                >
                  <TrendingDown size={20} color={formData.type === 'expense' ? 'white' : '#EF4444'} />
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === 'expense' && styles.activeTypeButtonText,
                  ]}>
                    Expense
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Amount</Text>
              <View style={styles.inputContainer}>
                <DollarSign size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <View style={styles.inputContainer}>
                <FileText size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="What was this for?"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categoriesGrid}>
                {getCategories(formData.type).map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      formData.category === category.id && styles.activeCategoryButton,
                    ]}
                    onPress={() => setFormData({ ...formData, category: category.id })}
                  >
                    <View 
                      style={[styles.categoryColor, { backgroundColor: category.color }]}
                    />
                    <Text style={[
                      styles.categoryButtonText,
                      formData.category === category.id && styles.activeCategoryButtonText,
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date</Text>
              <View style={styles.inputContainer}>
                <Calendar size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={formData.date}
                  onChangeText={(text) => setFormData({ ...formData, date: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <View style={styles.inputContainer}>
                <FileText size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
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
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  transactionItem: {
    backgroundColor: 'white',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
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
    backgroundColor: '#F9FAFB',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancelButton: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  modalSaveButton: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
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
    color: '#1F2937',
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
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  activeTypeButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  typeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginLeft: 8,
  },
  activeTypeButtonText: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
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
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  activeCategoryButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
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
    color: '#6B7280',
  },
  activeCategoryButtonText: {
    color: 'white',
  },
});