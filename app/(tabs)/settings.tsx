import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useBudget } from '@/contexts/BudgetContext';
import { User, Crown, Bell, Lock, Palette, CreditCard, CircleHelp as HelpCircle, LogOut, Settings as SettingsIcon, Target, Smartphone, Shield, Mail, ChevronRight, DollarSign } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, signOut, upgradeToPro } = useAuth();
  const { state, setMonthlyBudget } = useBudget();
  const [notifications, setNotifications] = useState(true);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [newBudget, setNewBudget] = useState(state.monthlyBudget.toString());

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleUpgradeToPro = () => {
    Alert.alert(
      'Upgrade to Pro',
      'Unlock advanced analytics, unlimited budgets, and premium AI insights for $9.99/month.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: upgradeToPro },
      ]
    );
  };

  const handleUpdateBudget = () => {
    const budget = parseFloat(newBudget);
    if (isNaN(budget) || budget <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }
    setMonthlyBudget(budget);
    setBudgetModalVisible(false);
    Alert.alert('Success', 'Monthly budget updated successfully');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const SettingsItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement,
    disabled = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingsItem, disabled && styles.disabledItem]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.settingsItemLeft}>
        {icon}
        <View style={styles.settingsItemText}>
          <Text style={[styles.settingsItemTitle, disabled && styles.disabledText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingsItemSubtitle, disabled && styles.disabledText]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement || <ChevronRight size={20} color="#9CA3AF" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Settings</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <SettingsSection title="Profile">
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <User size={32} color="white" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
              {user?.isPro && (
                <View style={styles.proBadge}>
                  <Crown size={16} color="#8B5CF6" />
                  <Text style={styles.proBadgeText}>Pro</Text>
                </View>
              )}
            </View>
            
            {!user?.isPro && (
              <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradeToPro}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.upgradeGradient}
                >
                  <Crown size={20} color="white" />
                  <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </SettingsSection>

        {/* Budget Settings */}
        <SettingsSection title="Budget">
          <SettingsItem
            icon={<Target size={24} color="#10B981" />}
            title="Monthly Budget"
            subtitle={`Current: ${formatCurrency(state.monthlyBudget)}`}
            onPress={() => setBudgetModalVisible(true)}
          />
          
          <SettingsItem
            icon={<DollarSign size={24} color="#10B981" />}
            title="Categories"
            subtitle="Manage spending categories"
            onPress={() => Alert.alert('Coming Soon', 'Category management is coming soon!')}
          
          />
        </SettingsSection>

        {/* Account Settings */}
        <SettingsSection title="Account">
          <SettingsItem
            icon={<CreditCard size={24} color="#3B82F6" />}
            title="Connected Accounts"
            subtitle={user?.isPro ? "Manage bank connections" : "Pro feature"}
            onPress={() => {
              if (user?.isPro) {
                Alert.alert('Coming Soon', 'Bank account management is coming soon!');
              } else {
                handleUpgradeToPro();
              }
            }}
            disabled={!user?.isPro}
          />
          
          <SettingsItem
            icon={<Bell size={24} color="#F59E0B" />}
            title="Notifications"
            subtitle="Budget alerts and reminders"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                thumbColor={notifications ? 'white' : '#9CA3AF'}
              />
            }
          />
          
          <SettingsItem
            icon={<Lock size={24} color="#6B7280" />}
            title="Privacy & Security"
            subtitle="Manage your data and security"
            onPress={() => Alert.alert('Coming Soon', 'Privacy settings are coming soon!')}
          />
        </SettingsSection>

        {/* App Settings */}
        <SettingsSection title="App">
          <SettingsItem
            icon={<Palette size={24} color="#EC4899" />}
            title="Appearance"
            subtitle="Theme and display options"
            onPress={() => Alert.alert('Coming Soon', 'Theme customization is coming soon!')}
          />
          
          <SettingsItem
            icon={<Smartphone size={24} color="#8B5CF6" />}
            title="App Version"
            subtitle="1.0.0"
            rightElement={<></>}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="Support">
          <SettingsItem
            icon={<HelpCircle size={24} color="#059669" />}
            title="Help & FAQ"
            subtitle="Get help and find answers"
            onPress={() => Alert.alert('Help', 'Visit our help center at help.budge.app')}
          />
          
          <SettingsItem
            icon={<Mail size={24} color="#3B82F6" />}
            title="Contact Support"
            subtitle="Get in touch with our team"
            onPress={() => Alert.alert('Contact', 'Email us at support@budge.app')}
          />
          
          <SettingsItem
            icon={<Shield size={24} color="#6B7280" />}
            title="Privacy Policy"
            subtitle="Read our privacy policy"
            onPress={() => Alert.alert('Privacy', 'View our privacy policy at budge.app/privacy')}
          />
        </SettingsSection>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={24} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Budget Modal */}
      <Modal
        visible={budgetModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setBudgetModalVisible(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Monthly Budget</Text>
            <TouchableOpacity onPress={handleUpdateBudget}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Set your monthly budget to track your spending and get personalized insights.
            </Text>
            
            <View style={styles.inputContainer}>
              <DollarSign size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={newBudget}
                onChangeText={setNewBudget}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <Text style={styles.inputHint}>
              Your current budget is {formatCurrency(state.monthlyBudget)}
            </Text>
          </View>
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
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileCard: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  proBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#8B5CF6',
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    marginLeft: 16,
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
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
    padding: 24,
  },
  modalDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    paddingVertical: 16,
  },
  inputHint: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
});