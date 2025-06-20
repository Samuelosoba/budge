import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { X, Plus, Tag, DollarSign, Edit, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useBudget, Category } from '@/contexts/BudgetContext';

const { width } = Dimensions.get('window');

interface CategoryManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

const predefinedColors = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#F97316', '#84CC16', '#06B6D4', '#6366F1',
  '#DC2626', '#D97706', '#059669', '#2563EB', '#7C3AED',
  '#BE185D', '#EA580C', '#65A30D', '#0891B2', '#4F46E5',
];

export default function CategoryManagementModal({ visible, onClose }: CategoryManagementModalProps) {
  const { theme, isDark } = useTheme();
  const { state, addCategory, updateCategory, deleteCategory } = useBudget();
  
  const [selectedTab, setSelectedTab] = useState<'income' | 'expense'>('expense');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    color: predefinedColors[0],
    budget: '',
    icon: 'folder',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        color: editingCategory.color,
        budget: editingCategory.budget?.toString() || '',
        icon: editingCategory.icon || 'folder',
      });
      setShowAddForm(true);
    } else {
      setFormData({
        name: '',
        color: predefinedColors[0],
        budget: '',
        icon: 'folder',
      });
    }
  }, [editingCategory]);
  
  const resetForm = () => {
    setFormData({
      name: '',
      color: predefinedColors[0],
      budget: '',
      icon: 'folder',
    });
    setEditingCategory(null);
    setShowAddForm(false);
  };
  
  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    
    setIsLoading(true);
    try {
      const categoryData = {
        name: formData.name.trim(),
        color: formData.color,
        type: selectedTab,
        icon: formData.icon,
        ...(selectedTab === 'expense' && formData.budget && {
          budget: parseFloat(formData.budget)
        }),
      };
      
      if (editingCategory) {
        await updateCategory({
          ...editingCategory,
          ...categoryData,
        });
      } else {
        await addCategory(categoryData);
      }
      
      resetForm();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete category');
            }
          },
        },
      ]
    );
  };
  
  const categories = state.categories.filter(cat => cat.type === selectedTab);
  
  const styles = createStyles(theme, isDark);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <Text style={styles.time}>9:41</Text>
          <View style={styles.statusIcons}>
            <View style={styles.signalIcon} />
            <View style={styles.wifiIcon} />
            <View style={styles.batteryIcon} />
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Categories</Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Plus size={20} color={isDark ? '#1A1A1A' : 'white'} />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              { 
                backgroundColor: selectedTab === 'expense' ? theme.primary : theme.surface,
                borderColor: selectedTab === 'expense' ? theme.primary : theme.border,
              }
            ]}
            onPress={() => {
              setSelectedTab('expense');
              resetForm();
            }}
          >
            <Text style={[
              styles.tabText,
              { color: selectedTab === 'expense' ? (isDark ? '#1A1A1A' : 'white') : theme.textSecondary }
            ]}>
              Expense Categories
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              { 
                backgroundColor: selectedTab === 'income' ? theme.primary : theme.surface,
                borderColor: selectedTab === 'income' ? theme.primary : theme.border,
              }
            ]}
            onPress={() => {
              setSelectedTab('income');
              resetForm();
            }}
          >
            <Text style={[
              styles.tabText,
              { color: selectedTab === 'income' ? (isDark ? '#1A1A1A' : 'white') : theme.textSecondary }
            ]}>
              Income Categories
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Add/Edit Form */}
          {showAddForm && (
            <View style={[styles.formContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </Text>
              
              {/* Category Name */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Category Name</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Tag size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter category name"
                    placeholderTextColor={theme.textTertiary}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    maxLength={50}
                  />
                </View>
              </View>
              
              {/* Color Selection */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Color</Text>
                <View style={styles.colorGrid}>
                  {predefinedColors.slice(0, 10).map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        formData.color === color && styles.selectedColor,
                      ]}
                      onPress={() => setFormData({ ...formData, color })}
                    >
                      {formData.color === color && (
                        <View style={styles.colorCheckmark}>
                          <Text style={styles.colorCheckmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Budget (for expense categories) */}
              {selectedTab === 'expense' && (
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Monthly Budget (Optional)</Text>
                  <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <DollarSign size={20} color={theme.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textTertiary}
                      value={formData.budget}
                      onChangeText={(text) => setFormData({ ...formData, budget: text })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}
              
              {/* Action Buttons */}
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={resetForm}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.primary }, isLoading && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  <Text style={[styles.saveButtonText, { color: isDark ? '#1A1A1A' : 'white' }]}>
                    {isLoading ? 'Saving...' : (editingCategory ? 'Update' : 'Add')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Categories List */}
          <View style={styles.categoriesList}>
            <Text style={[styles.listTitle, { color: theme.text }]}>
              {selectedTab === 'expense' ? 'Expense' : 'Income'} Categories ({categories.length})
            </Text>
            
            {categories.length > 0 ? (
              categories.map((category) => (
                <View key={category.id} style={[styles.categoryItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      <Tag size={16} color="white" />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { color: theme.text }]}>{category.name}</Text>
                      {category.budget && (
                        <Text style={[styles.categoryBudget, { color: theme.textSecondary }]}>
                          Budget: ${category.budget.toFixed(0)}/month
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.categoryActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.surface }]}
                      onPress={() => setEditingCategory(category)}
                    >
                      <Edit size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.surface }]}
                      onPress={() => handleDelete(category)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  No {selectedTab} categories yet
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.textTertiary }]}>
                  Tap the + button to add your first category
                </Text>
              </View>
            )}
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
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  time: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    color: theme.text,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signalIcon: {
    width: 18,
    height: 12,
    backgroundColor: theme.text,
    borderRadius: 2,
  },
  wifiIcon: {
    width: 15,
    height: 12,
    backgroundColor: theme.text,
    borderRadius: 2,
  },
  batteryIcon: {
    width: 24,
    height: 12,
    backgroundColor: theme.text,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: theme.text,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedColor: {
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  colorCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCheckmarkText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  categoriesList: {
    marginBottom: 24,
  },
  listTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  categoryBudget: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  categoryActions: {
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
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});