import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { X, Plus, Tag } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useBudget, Category } from '@/contexts/BudgetContext';

const { width } = Dimensions.get('window');

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
  selectedCategory?: string;
  onCategorySelect: (categoryId: string) => void;
  onAddCategory: (type: 'income' | 'expense') => void;
}

export default function CategoryModal({ 
  visible, 
  onClose, 
  type, 
  selectedCategory,
  onCategorySelect,
  onAddCategory
}: CategoryModalProps) {
  const { theme, isDark } = useTheme();
  const { state } = useBudget();
  
  const categories = state.categories.filter(cat => cat.type === type);

  const handleCategorySelect = (categoryId: string) => {
    onCategorySelect(categoryId);
    onClose();
  };

  const handleAddCategory = () => {
    onAddCategory(type);
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
          <Text style={styles.headerTitle}>
            Select {type === 'income' ? 'Income' : 'Expense'} Category
          </Text>
          <TouchableOpacity
            onPress={handleAddCategory}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Plus size={20} color={isDark ? '#1A1A1A' : 'white'} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {categories.length > 0 ? (
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    { 
                      backgroundColor: selectedCategory === category.id ? theme.primary : theme.surface,
                      borderColor: selectedCategory === category.id ? theme.primary : theme.border,
                    }
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <View 
                    style={[styles.categoryColor, { backgroundColor: category.color }]}
                  />
                  <Text style={[
                    styles.categoryButtonText,
                    { color: selectedCategory === category.id ? (isDark ? '#1A1A1A' : 'white') : theme.text }
                  ]} numberOfLines={1}>
                    {category.name}
                  </Text>
                  {category.budget && (
                    <Text style={[
                      styles.categoryBudget,
                      { color: selectedCategory === category.id ? (isDark ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)') : theme.textSecondary }
                    ]} numberOfLines={1}>
                      ${category.budget}/mo
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Tag size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                No {type} categories yet
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
                Create your first {type} category to get started
              </Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.primary }]}
                onPress={handleAddCategory}
              >
                <Plus size={20} color={isDark ? '#1A1A1A' : 'white'} />
                <Text style={[styles.createButtonText, { color: isDark ? '#1A1A1A' : 'white' }]}>
                  Create Category
                </Text>
              </TouchableOpacity>
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
    fontSize: Math.min(width * 0.045, 18),
    fontFamily: 'Inter-Bold',
    color: theme.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  categoriesGrid: {
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryButtonText: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  categoryBudget: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Medium',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: Math.min(width * 0.05, 20),
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  createButtonText: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Bold',
  },
});