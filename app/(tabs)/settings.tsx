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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useBudget } from '@/contexts/BudgetContext';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useApi } from '@/contexts/ApiContext';
import CategoryManagementModal from '@/components/CategoryManagementModal';
import DataExportModal from '@/components/DataExportModal';
import CurrencySelector from '@/components/CurrencySelector';
import { User, Crown, Bell, Lock, Palette, CircleHelp as HelpCircle, LogOut, Target, Smartphone, Shield, Mail, ChevronRight, DollarSign, Plus, Sun, Moon, Monitor, Eye, EyeOff, Key, FileText, UserCheck, Download, Trash2, Globe } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const { user, signOut, upgradeToPro, token } = useAuth();
  const { state, setMonthlyBudget } = useBudget();
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const { currency, formatCurrency } = useCurrency();
  const { post, delete: deleteApi } = useApi();
  const [notifications, setNotifications] = useState(true);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [dataExportModalVisible, setDataExportModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [currencySelectorVisible, setCurrencySelectorVisible] = useState(false);
  const [newBudget, setNewBudget] = useState(state.monthlyBudget.toString());
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);
  const [deleteAccountData, setDeleteAccountData] = useState({
    email: '',
    password: '',
  });
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  const handleUpdateBudget = async () => {
    const parsed = parseFloat(newBudget);

    if (!newBudget || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid number greater than zero.');
      return;
    }

    setIsUpdatingBudget(true);

    try {
      await setMonthlyBudget(parsed);
      setBudgetModalVisible(false);
      Alert.alert('Success', 'Monthly budget updated successfully');
    } catch (error) {
      console.error('Budget update error:', error);
      Alert.alert('Error', 'Failed to update monthly budget. Please try again.');
    } finally {
      setIsUpdatingBudget(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountData.email || !deleteAccountData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (deleteAccountData.email !== user?.email) {
      Alert.alert('Error', 'Email does not match your account email');
      return;
    }

    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              await deleteApi('/privacy/account', token, {
                confirmEmail: deleteAccountData.email,
                password: deleteAccountData.password,
              });
              
              Alert.alert(
                'Account Deleted',
                'Your account and all data have been permanently deleted.',
                [{ text: 'OK', onPress: signOut }]
              );
            } catch (error) {
              console.error('Delete account error:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setIsDeletingAccount(false);
              setDeleteAccountModalVisible(false);
              setDeleteAccountData({ email: '', password: '' });
            }
          },
        },
      ]
    );
  };

  // Fixed: Close all modals properly to prevent iOS modal conflicts
  const closeAllModals = () => {
    setPrivacyModalVisible(false);
    setDataExportModalVisible(false);
    setSecurityModalVisible(false);
    setThemeModalVisible(false);
    setBudgetModalVisible(false);
    setCategoryModalVisible(false);
    setDeleteAccountModalVisible(false);
    setCurrencySelectorVisible(false);
  };

  // Fixed: Handle export data with proper modal management for iOS
  const handleExportData = () => {
    // Close privacy modal first, then open export modal after a delay
    setPrivacyModalVisible(false);
    setTimeout(() => {
      setDataExportModalVisible(true);
    }, 300); // Give time for privacy modal to close
  };

  const getThemeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return <Sun size={20} color={theme.text} />;
      case 'dark':
        return <Moon size={20} color={theme.text} />;
      case 'auto':
        return <Monitor size={20} color={theme.text} />;
    }
  };

  const getThemeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'auto':
        return 'System Default';
    }
  };

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
          <Text style={[styles.settingsItemTitle, { color: theme.text }, disabled && styles.disabledText]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingsItemSubtitle, { color: theme.textSecondary }, disabled && styles.disabledText]} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement || <ChevronRight size={20} color={theme.textTertiary} />}
    </TouchableOpacity>
  );

  const styles = createStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Profile Section */}
        <SettingsSection title="Profile">
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={[styles.profileAvatar, { backgroundColor: theme.primary }]}>
                <User size={32} color={isDark ? '#1A1A1A' : 'white'} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>{user?.name}</Text>
                <Text style={[styles.profileEmail, { color: theme.textSecondary }]} numberOfLines={1}>{user?.email}</Text>
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
            icon={<Target size={24} color={theme.primary} />}
            title="Monthly Budget"
            subtitle={`Current: ${formatCurrency(state.monthlyBudget)}`}
            onPress={() => setBudgetModalVisible(true)}
          />
          
          <SettingsItem
            icon={<Plus size={24} color={theme.primary} />}
            title="Manage Categories"
            subtitle="Add, edit and delete spending categories"
            onPress={() => setCategoryModalVisible(true)}
          />
        </SettingsSection>

        {/* Appearance Settings */}
        <SettingsSection title="Appearance">
          <SettingsItem
            icon={<Globe size={24} color="#059669" />}
            title="Currency"
            subtitle={`${currency.name} (${currency.symbol})`}
            onPress={() => setCurrencySelectorVisible(true)}
            rightElement={
              <View style={styles.currencyPreview}>
                <Text style={[styles.currencySymbol, { color: theme.primary }]}>{currency.symbol}</Text>
              </View>
            }
          />

          <SettingsItem
            icon={<Palette size={24} color="#EC4899" />}
            title="Theme"
            subtitle={getThemeLabel(themeMode)}
            onPress={() => setThemeModalVisible(true)}
            rightElement={
              <View style={styles.themePreview}>
                {getThemeIcon(themeMode)}
              </View>
            }
          />
        </SettingsSection>

        {/* Account Settings */}
        <SettingsSection title="Account">
          <SettingsItem
            icon={<Bell size={24} color="#F59E0B" />}
            title="Notifications"
            subtitle="Budget alerts and reminders"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={notifications ? 'white' : theme.textTertiary}
              />
            }
          />
          
          <SettingsItem
            icon={<Lock size={24} color="#6B7280" />}
            title="Security"
            subtitle="Password and authentication settings"
            onPress={() => setSecurityModalVisible(true)}
          />

          <SettingsItem
            icon={<Shield size={24} color="#059669" />}
            title="Privacy"
            subtitle="Data usage and privacy controls"
            onPress={() => setPrivacyModalVisible(true)}
          />
        </SettingsSection>

        {/* App Settings */}
        <SettingsSection title="App">
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
            icon={<FileText size={24} color="#6B7280" />}
            title="Privacy Policy"
            subtitle="Read our privacy policy"
            onPress={() => Alert.alert('Privacy', 'View our privacy policy at budge.app/privacy')}
          />
        </SettingsSection>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.signOutButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={handleSignOut}>
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
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setBudgetModalVisible(false)} disabled={isUpdatingBudget}>
              <Text style={[styles.modalCancelButton, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Monthly Budget</Text>
            <TouchableOpacity onPress={handleUpdateBudget} disabled={isUpdatingBudget}>
              <Text style={[styles.modalSaveButton, { color: isUpdatingBudget ? theme.textTertiary : theme.primary }]}>
                {isUpdatingBudget ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Set your monthly budget to track your spending and get personalized insights.
            </Text>
            
            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.currencySymbolInput, { color: theme.textSecondary }]}>{currency.symbol}</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="0.00"
                value={newBudget}
                onChangeText={setNewBudget}
                keyboardType="numeric"
                placeholderTextColor={theme.textTertiary}
                editable={!isUpdatingBudget}
              />
            </View>
            
            <Text style={[styles.inputHint, { color: theme.textTertiary }]}>
              Your current budget is {formatCurrency(state.monthlyBudget)}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal
        visible={themeModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
              <Text style={[styles.modalCancelButton, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Choose Theme</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Select your preferred theme. Auto will follow your system settings.
            </Text>
            
            <View style={styles.themeOptions}>
              {(['light', 'dark', 'auto'] as ThemeMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeOption,
                    { 
                      backgroundColor: theme.surface,
                      borderColor: themeMode === mode ? theme.primary : theme.border,
                      borderWidth: themeMode === mode ? 2 : 1,
                    }
                  ]}
                  onPress={() => {
                    setThemeMode(mode);
                    setThemeModalVisible(false);
                  }}
                >
                  <View style={styles.themeOptionIcon}>
                    {getThemeIcon(mode)}
                  </View>
                  <Text style={[styles.themeOptionTitle, { color: theme.text }]}>
                    {getThemeLabel(mode)}
                  </Text>
                  <Text style={[styles.themeOptionDescription, { color: theme.textSecondary }]}>
                    {mode === 'light' && 'Always use light theme'}
                    {mode === 'dark' && 'Always use dark theme'}
                    {mode === 'auto' && 'Follow system settings'}
                  </Text>
                  {themeMode === mode && (
                    <View style={[styles.themeOptionCheck, { backgroundColor: theme.primary }]}>
                      <Text style={[styles.themeOptionCheckText, { color: isDark ? '#1A1A1A' : 'white' }]}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Security Modal */}
      <Modal
        visible={securityModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSecurityModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
              <Text style={[styles.modalCancelButton, { color: theme.textSecondary }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Security Settings</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.securitySection}>
              <View style={styles.securityItem}>
                <Key size={24} color={theme.primary} />
                <View style={styles.securityItemContent}>
                  <Text style={[styles.securityItemTitle, { color: theme.text }]}>Change Password</Text>
                  <Text style={[styles.securityItemDescription, { color: theme.textSecondary }]}>
                    Update your account password for better security
                  </Text>
                  <TouchableOpacity 
                    style={[styles.securityButton, { backgroundColor: theme.primary }]}
                    onPress={() => Alert.alert('Change Password', 'Password change functionality coming soon!')}
                  >
                    <Text style={[styles.securityButtonText, { color: isDark ? '#1A1A1A' : 'white' }]}>
                      Change Password
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.securityItem}>
                <UserCheck size={24} color={theme.primary} />
                <View style={styles.securityItemContent}>
                  <Text style={[styles.securityItemTitle, { color: theme.text }]}>Two-Factor Authentication</Text>
                  <Text style={[styles.securityItemDescription, { color: theme.textSecondary }]}>
                    Add an extra layer of security to your account
                  </Text>
                  <TouchableOpacity 
                    style={[styles.securityButton, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
                    onPress={() => Alert.alert('2FA', 'Two-factor authentication coming soon!')}
                  >
                    <Text style={[styles.securityButtonText, { color: theme.textSecondary }]}>
                      Enable 2FA
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.securityItem}>
                <Eye size={24} color={theme.primary} />
                <View style={styles.securityItemContent}>
                  <Text style={[styles.securityItemTitle, { color: theme.text }]}>Login Activity</Text>
                  <Text style={[styles.securityItemDescription, { color: theme.textSecondary }]}>
                    View recent login attempts and active sessions
                  </Text>
                  <TouchableOpacity 
                    style={[styles.securityButton, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
                    onPress={() => Alert.alert('Login Activity', 'Login activity monitoring coming soon!')}
                  >
                    <Text style={[styles.securityButtonText, { color: theme.textSecondary }]}>
                      View Activity
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Privacy Modal */}
      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
              <Text style={[styles.modalCancelButton, { color: theme.textSecondary }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Privacy Settings</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.privacySection}>
              <View style={styles.privacyItem}>
                <Text style={[styles.privacyItemTitle, { color: theme.text }]}>Data Collection</Text>
                <Text style={[styles.privacyItemDescription, { color: theme.textSecondary }]}>
                  We collect minimal data necessary to provide our services. Your financial data is encrypted and never shared with third parties.
                </Text>
                <View style={styles.privacyToggle}>
                  <Text style={[styles.privacyToggleLabel, { color: theme.text }]}>Analytics Data</Text>
                  <Switch
                    value={true}
                    onValueChange={() => Alert.alert('Analytics', 'Analytics settings coming soon!')}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor="white"
                  />
                </View>
              </View>

              <View style={styles.privacyItem}>
                <Text style={[styles.privacyItemTitle, { color: theme.text }]}>Data Export</Text>
                <Text style={[styles.privacyItemDescription, { color: theme.textSecondary }]}>
                  Download all your data in a portable format. This includes transactions, categories, and account settings with visual analytics.
                </Text>
                <TouchableOpacity 
                  style={[styles.privacyButton, { backgroundColor: theme.primary }]}
                  onPress={handleExportData}
                >
                  <Download size={16} color={isDark ? '#1A1A1A' : 'white'} />
                  <Text style={[styles.privacyButtonText, { color: isDark ? '#1A1A1A' : 'white' }]}>
                    Export My Data
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.privacyItem}>
                <Text style={[styles.privacyItemTitle, { color: theme.text }]}>Account Deletion</Text>
                <Text style={[styles.privacyItemDescription, { color: theme.textSecondary }]}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </Text>
                <TouchableOpacity 
                  style={[styles.privacyButton, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    setPrivacyModalVisible(false);
                    setTimeout(() => {
                      setDeleteAccountModalVisible(true);
                    }, 300);
                  }}
                >
                  <Trash2 size={16} color="white" />
                  <Text style={[styles.privacyButtonText, { color: 'white' }]}>
                    Delete Account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteAccountModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDeleteAccountModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setDeleteAccountModalVisible(false)} disabled={isDeletingAccount}>
              <Text style={[styles.modalCancelButton, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Delete Account</Text>
            <TouchableOpacity onPress={handleDeleteAccount} disabled={isDeletingAccount}>
              <Text style={[styles.modalSaveButton, { color: isDeletingAccount ? theme.textTertiary : '#EF4444' }]}>
                {isDeletingAccount ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              This action cannot be undone. All your data including transactions, categories, and settings will be permanently deleted.
            </Text>
            
            <View style={styles.deleteAccountForm}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Confirm your email</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Mail size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder={user?.email}
                  value={deleteAccountData.email}
                  onChangeText={(text) => setDeleteAccountData(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  placeholderTextColor={theme.textTertiary}
                  editable={!isDeletingAccount}
                />
              </View>

              <Text style={[styles.formLabel, { color: theme.text }]}>Confirm your password</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Lock size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your password"
                  value={deleteAccountData.password}
                  onChangeText={(text) => setDeleteAccountData(prev => ({ ...prev, password: text }))}
                  secureTextEntry
                  placeholderTextColor={theme.textTertiary}
                  editable={!isDeletingAccount}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Currency Selector Modal - Fixed: Separate from other modals */}
      {currencySelectorVisible && (
        <CurrencySelector
          visible={currencySelectorVisible}
          onClose={() => setCurrencySelectorVisible(false)}
        />
      )}

      {/* Data Export Modal - Fixed: Separate from other modals */}
      {dataExportModalVisible && (
        <DataExportModal
          visible={dataExportModalVisible}
          onClose={() => setDataExportModalVisible(false)}
        />
      )}

      {/* Category Management Modal */}
      {categoryModalVisible && (
        <CategoryManagementModal
          visible={categoryModalVisible}
          onClose={() => setCategoryModalVisible(false)}
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 60, // Safe area padding
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: Math.min(width * 0.07, 28),
    fontFamily: 'Inter-Bold',
    color: theme.text,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: Math.min(width * 0.045, 18),
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Math.min(width * 0.05, 20),
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
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
    fontSize: Math.min(width * 0.03, 12),
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
    fontSize: Math.min(width * 0.04, 16),
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
    borderBottomColor: 'transparent',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingsItemText: {
    marginLeft: 16,
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  currencyPreview: {
    padding: 8,
  },
  currencySymbol: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Bold',
  },
  themePreview: {
    padding: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
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
    padding: 24,
  },
  modalDescription: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: Math.min(width * 0.045, 18),
    fontFamily: 'Inter-SemiBold',
    paddingVertical: 16,
  },
  currencySymbolInput: {
    fontSize: Math.min(width * 0.045, 18),
    fontFamily: 'Inter-Bold',
    marginRight: 12,
  },
  inputHint: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
  },
  themeOptions: {
    gap: 16,
  },
  themeOption: {
    padding: 20,
    borderRadius: 16,
    position: 'relative',
  },
  themeOptionIcon: {
    marginBottom: 12,
  },
  themeOptionTitle: {
    fontSize: Math.min(width * 0.045, 18),
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  themeOptionDescription: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
  },
  themeOptionCheck: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeOptionCheckText: {
    fontSize: Math.min(width * 0.03, 12),
    fontFamily: 'Inter-Bold',
  },
  securitySection: {
    gap: 24,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  securityItemContent: {
    flex: 1,
  },
  securityItemTitle: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  securityItemDescription: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  securityButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  securityButtonText: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-SemiBold',
  },
  privacySection: {
    gap: 32,
  },
  privacyItem: {
    gap: 12,
  },
  privacyItemTitle: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-Bold',
  },
  privacyItemDescription: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  privacyToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  privacyToggleLabel: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Medium',
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 8,
  },
  privacyButtonText: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-SemiBold',
  },
  deleteAccountForm: {
    gap: 16,
  },
  formLabel: {
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
});