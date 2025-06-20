import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Tag, DollarSign } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useBudget } from '@/contexts/BudgetContext';

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
  onCategoryAdded?: (categoryId: string) => void;
}

const predefinedColors = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#F97316', '#84CC16', '#06B6D4', '#6366F1',
  '#DC2626', '#D97706', '#059669', '#2563EB', '#7C3AED',
  '#BE185D', '#EA580C', '#65A30D', '#0891B2', '#4F46E5',
];

const quickCategories = {
  expense: [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
  ],
  income: [
    'Salary',
    'Freelance',
    'Investment',
    'Business',
    'Rental',
    'Gift',
    'Bonus',
    'Other Income',
  ],
};

export default function AddCategoryModal({ 
  visible, 
  onClose, 
  type, 
  onCategoryAdded 
}: AddCategoryModalProps) {
  const { theme, isDark } = useTheme();
  const { addCategory } = useBudget();
  
  const [formData, setFormData] = useState({
    name: '',
    color: predefinedColors[0],
    budget: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  const resetForm = () => {
    setFormData({
      name: '',
      color: predefinedColors[0],
      budget: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
        type,
        icon: 'folder',
        ...(type === 'expense' && formData.budget && {
          budget: parseFloat(formData.budget)
        }),
      };
      
      const response = await addCategory(categoryData);
      
      // Call the callback with the new category ID if provided
      if (onCategoryAdded && response) {
        onCategoryAdded(response.id);
      }
      
      handleClose();
      Alert.alert('Success', 'Category added successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (categoryName: string) => {
    setFormData(prev => ({ ...prev, name: categoryName }));
  };
  
  const styles = createStyles(theme, isDark);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Add {type === 'income' ? 'Income' : 'Expense'} Category
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !formData.name.trim()}
            style={[
              styles.saveButton, 
              { backgroundColor: theme.primary },
              (isLoading || !formData.name.trim()) && styles.saveButtonDisabled
            ]}
          >
            <Text style={[
              styles.saveButtonText, 
              { color: isDark ? '#1A1A1A' : 'white' },
              (isLoading || !formData.name.trim()) && styles.saveButtonTextDisabled
            ]}>
              {isLoading ? 'Adding...' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Preview */}
          <View style={styles.previewSection}>
            <View style={[styles.previewCard, { backgroundColor: theme.card }]}>
              <View style={[styles.previewIcon, { backgroundColor: formData.color }]}>
                <Tag size={24} color="white" />
              </View>
              <View style={styles.previewInfo}>
                <Text style={[styles.previewName, { color: theme.text }]}>
                  {formData.name || 'Category Name'}
                </Text>
                <Text style={[styles.previewType, { color: theme.textSecondary }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} Category
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Select */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Select</Text>
            <View style={styles.quickSelectContainer}>
              {quickCategories[type].map((categoryName, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quickSelectChip, 
                    { 
                      backgroundColor: formData.name === categoryName ? theme.primary : theme.surface,
                      borderColor: formData.name === categoryName ? theme.primary : theme.border,
                    }
                  ]}
                  onPress={() => handleQuickSelect(categoryName)}
                >
                  <Text style={[
                    styles.quickSelectText, 
                    { 
                      color: formData.name === categoryName 
                        ? (isDark ? '#1A1A1A' : 'white') 
                        : theme.textSecondary 
                    }
                  ]}>
                    {categoryName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Category Name */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Tag size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter category name"
                placeholderTextColor={theme.textTertiary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                maxLength={50}
                editable={!isLoading}
              />
            </View>
          </View>
          
          {/* Color Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Color</Text>
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
                  disabled={isLoading}
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
          {type === 'expense' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Monthly Budget (Optional)</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <DollarSign size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.textTertiary}
                  value={formData.budget}
                  onChangeText={(text) => setFormData({ ...formData, budget: text })}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>
              <Text style={[styles.inputHint, { color: theme.textTertiary }]}>
                Set a monthly spending limit for this category
              </Text>
            </View>
          )}
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
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: theme.text,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  saveButtonTextDisabled: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  previewSection: {
    paddingVertical: 24,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  previewType: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  quickSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSelectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  quickSelectText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
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
  inputHint: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCheckmarkText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
});