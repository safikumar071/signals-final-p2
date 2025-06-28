import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Pressable,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Shield, CircleHelp as HelpCircle, Settings, LogOut, ChevronRight, Award, Target, TrendingUp, Share2, Moon, Sun, Type, Globe, Calendar, CreditCard as Edit3, Check, X } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import NotificationTestPanel from '../../components/NotificationTestPanel';
import BackendMonitor from '../../components/BackendMonitor';
import { getUserProfile, updateUserProfile, UserProfile } from '../../lib/userProfile';
import { LANGUAGES } from '../../lib/forex';

export default function ProfileScreen() {
  const { colors, fontSizes, theme, setTheme, fontSize, setFontSize } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showNotificationTests, setShowNotificationTests] = useState(false);
  const [showBackendMonitor, setShowBackendMonitor] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editData, setEditData] = useState({ name: '', dob: '', language: '' });

  const userStats = {
    memberSince: 'January 2024',
    totalSignals: 127,
    successRate: 68.4,
    totalProfit: 2543.67,
    rank: 'Advanced Trader',
    level: 4,
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
      if (profile) {
        setEditData({
          name: profile.name || '',
          dob: profile.dob || '',
          language: profile.language || 'en',
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      const success = await updateUserProfile({
        name: editData.name,
        dob: editData.dob,
        language: editData.language,
      });

      if (success) {
        await loadUserProfile();
        setShowEditProfile(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const handleLanguageUpdate = async (languageCode: string) => {
    try {
      const success = await updateUserProfile({ language: languageCode });
      if (success) {
        await loadUserProfile();
        setShowLanguagePicker(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update language');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out this amazing Gold & Silver trading signals app! Get real-time trading opportunities and boost your portfolio.',
        url: 'https://your-app-url.com',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const menuItems = [
    {
      id: 'notifications',
      title: 'Notification Settings',
      icon: Bell,
      color: colors.warning,
      onPress: () => Alert.alert('Notifications', 'Notification settings coming soon!'),
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Shield,
      color: colors.success,
      onPress: () => Alert.alert('Security', 'Security settings coming soon!'),
    },
    {
      id: 'share',
      title: 'Share App',
      icon: Share2,
      color: colors.secondary,
      onPress: handleShare,
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: HelpCircle,
      color: colors.primary,
      onPress: () => Alert.alert('Help', 'Contact support at help@tradingsignals.com'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => console.log('Logout') },
      ]
    );
  };

  const renderMenuItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}20` }]}>
          <item.icon size={20} color={item.color} />
        </View>
        <Text style={styles.menuItemText}>{item.title}</Text>
      </View>
      <ChevronRight size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderStat = (icon: any, value: string, label: string, color: string) => (
    <View style={styles.statCard}>
      {React.createElement(icon, { size: 20, color })}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const selectedLanguage = LANGUAGES.find(lang => lang.code === userProfile?.language);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    profileHeader: {
      alignItems: 'center',
      paddingVertical: 24,
      marginBottom: 24,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.primary,
    },
    levelBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.background,
    },
    levelText: {
      color: colors.background,
      fontSize: fontSizes.small,
      fontFamily: 'Inter-Bold',
    },
    profileInfo: {
      alignItems: 'center',
    },
    userName: {
      fontSize: fontSizes.title,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 4,
    },
    userRank: {
      fontSize: fontSizes.medium,
      color: colors.primary,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 4,
    },
    memberSince: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginTop: 12,
      gap: 6,
    },
    editButtonText: {
      fontSize: fontSizes.small,
      color: colors.primary,
      fontFamily: 'Inter-Medium',
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 32,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginTop: 8,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    settingText: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    settingValue: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    themeButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    themeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    themeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    themeButtonText: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Medium',
    },
    themeButtonTextActive: {
      color: colors.background,
    },
    fontSizeButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    fontSizeButton: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fontSizeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    fontSizeButtonText: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Medium',
    },
    fontSizeButtonTextActive: {
      color: colors.background,
    },
    menuContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    menuIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuItemText: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: `${colors.error}20`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: `${colors.error}40`,
    },
    logoutText: {
      fontSize: fontSizes.medium,
      color: colors.error,
      fontFamily: 'Inter-SemiBold',
    },
    versionText: {
      textAlign: 'center',
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      paddingBottom: 20,
    },
    testToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: `${colors.secondary}15`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: `${colors.secondary}30`,
    },
    testToggleText: {
      fontSize: fontSizes.medium,
      color: colors.secondary,
      fontFamily: 'Inter-SemiBold',
    },
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      width: '90%',
      maxHeight: '70%',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    languageFlag: {
      fontSize: 20,
      marginRight: 12,
    },
    languageName: {
      flex: 1,
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    languageSelected: {
      backgroundColor: `${colors.primary}10`,
    },
    editForm: {
      padding: 20,
      gap: 16,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    primaryButtonText: {
      color: colors.background,
    },
    secondaryButtonText: {
      color: colors.text,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color={colors.text} />
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{userStats.level}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {userProfile?.name || 'Gold & Silver Trader'}
            </Text>
            <Text style={styles.userRank}>{userStats.rank}</Text>
            <Text style={styles.memberSince}>Member since {userStats.memberSince}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditProfile(true)}
            >
              <Edit3 size={14} color={colors.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          {renderStat(
            Award,
            userStats.totalSignals.toString(),
            'Total Signals',
            colors.warning
          )}
          {renderStat(
            Target,
            `${userStats.successRate}%`,
            'Success Rate',
            colors.success
          )}
          {renderStat(
            TrendingUp,
            `$${userStats.totalProfit.toLocaleString()}`,
            'Total Profit',
            colors.secondary
          )}
        </View>

        {/* Backend Monitor Toggle */}
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={styles.testToggle}
            onPress={() => setShowBackendMonitor(!showBackendMonitor)}
          >
            <Text style={styles.testToggleText}>
              {showBackendMonitor ? 'Hide' : 'Show'} Backend Monitor
            </Text>
          </TouchableOpacity>
        )}

        {/* Backend Monitor */}
        {showBackendMonitor && Platform.OS === 'web' && <BackendMonitor />}

        {/* Notification Test Panel Toggle */}
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={styles.testToggle}
            onPress={() => setShowNotificationTests(!showNotificationTests)}
          >
            <Text style={styles.testToggleText}>
              {showNotificationTests ? 'Hide' : 'Show'} Notification Tests
            </Text>
          </TouchableOpacity>
        )}

        {/* Notification Test Panel */}
        {showNotificationTests && Platform.OS === 'web' && <NotificationTestPanel />}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowLanguagePicker(true)}
          >
            <View style={styles.settingLeft}>
              <Globe size={20} color={colors.secondary} />
              <Text style={styles.settingText}>Language</Text>
            </View>
            <Text style={styles.settingValue}>
              {selectedLanguage?.flag} {selectedLanguage?.name}
            </Text>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Moon size={20} color={colors.secondary} />
              <Text style={styles.settingText}>Theme</Text>
            </View>
            <View style={styles.themeButtons}>
              <Pressable
                style={[
                  styles.themeButton,
                  theme === 'light' && styles.themeButtonActive
                ]}
                onPress={() => setTheme('light')}
              >
                <Sun size={14} color={theme === 'light' ? colors.background : colors.textSecondary} />
                <Text style={[
                  styles.themeButtonText,
                  theme === 'light' && styles.themeButtonTextActive
                ]}>
                  Light
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.themeButton,
                  theme === 'dark' && styles.themeButtonActive
                ]}
                onPress={() => setTheme('dark')}
              >
                <Moon size={14} color={theme === 'dark' ? colors.background : colors.textSecondary} />
                <Text style={[
                  styles.themeButtonText,
                  theme === 'dark' && styles.themeButtonTextActive
                ]}>
                  Dark
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.themeButton,
                  theme === 'system' && styles.themeButtonActive
                ]}
                onPress={() => setTheme('system')}
              >
                <Settings size={14} color={theme === 'system' ? colors.background : colors.textSecondary} />
                <Text style={[
                  styles.themeButtonText,
                  theme === 'system' && styles.themeButtonTextActive
                ]}>
                  Auto
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Type size={20} color={colors.primary} />
              <Text style={styles.settingText}>Font Size</Text>
            </View>
            <View style={styles.fontSizeButtons}>
              <TouchableOpacity
                style={[
                  styles.fontSizeButton,
                  fontSize === 'small' && styles.fontSizeButtonActive
                ]}
                onPress={() => setFontSize('small')}
              >
                <Text style={[
                  styles.fontSizeButtonText,
                  fontSize === 'small' && styles.fontSizeButtonTextActive
                ]}>
                  S
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.fontSizeButton,
                  fontSize === 'medium' && styles.fontSizeButtonActive
                ]}
                onPress={() => setFontSize('medium')}
              >
                <Text style={[
                  styles.fontSizeButtonText,
                  fontSize === 'medium' && styles.fontSizeButtonTextActive
                ]}>
                  M
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.fontSizeButton,
                  fontSize === 'large' && styles.fontSizeButtonActive
                ]}
                onPress={() => setFontSize('large')}
              >
                <Text style={[
                  styles.fontSizeButtonText,
                  fontSize === 'large' && styles.fontSizeButtonTextActive
                ]}>
                  L
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuContainer}>
            {menuItems.map(renderMenuItem)}
          </View>
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowLanguagePicker(false)}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    userProfile?.language === language.code && styles.languageSelected
                  ]}
                  onPress={() => handleLanguageUpdate(language.code)}
                >
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <Text style={styles.languageName}>{language.name}</Text>
                  {userProfile?.language === language.code && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEditProfile(false)}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textSecondary}
                  value={editData.name}
                  onChangeText={(text) => setEditData(prev => ({ ...prev, name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={editData.dob}
                  onChangeText={(text) => setEditData(prev => ({ ...prev, dob: text }))}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setShowEditProfile(false)}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleUpdateProfile}
                >
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}