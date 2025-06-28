import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Calendar, User, Globe, ChevronDown, Check } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { createUserProfile, cacheOnboardingStatus, OnboardingData } from '../lib/userProfile';
import { LANGUAGES } from '../lib/forex';

export default function OnboardingScreen() {
  const { colors, fontSizes } = useTheme();
  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    dob: '',
    language: 'en',
  });

  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedLanguage = LANGUAGES.find(lang => lang.code === formData.language);

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, dob: date }));
    setShowDatePicker(false);
  };

  const handleLanguageSelect = (languageCode: string) => {
    setFormData(prev => ({ ...prev, language: languageCode }));
    setShowLanguagePicker(false);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!formData.dob) {
      Alert.alert('Error', 'Please select your date of birth');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const success = await createUserProfile(formData);

      if (success) {
        await cacheOnboardingStatus(true);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Failed to save your profile. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: fontSizes.title + 8,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      lineHeight: 22,
    },
    form: {
      gap: 24,
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
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    inputContainerFocused: {
      borderColor: colors.primary,
    },
    icon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    picker: {
      flex: 1,
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    pickerPlaceholder: {
      color: colors.textSecondary,
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
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 32,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: fontSizes.medium,
      fontWeight: 'bold',
      color: colors.background,
      fontFamily: 'Inter-Bold',
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
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      textAlign: 'center',
    },
    dateInput: {
      width: '100%',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Gold & Silver Signals</Text>
          <Text style={styles.subtitle}>
            Let's set up your profile to get started with personalized trading signals
          </Text>
        </View>

        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color={colors.textSecondary} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={colors.textSecondary} style={styles.icon} />
              <Text style={[
                styles.picker,
                !formData.dob && styles.pickerPlaceholder
              ]}>
                {formData.dob ? formatDate(formData.dob) : 'Select your date of birth'}
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Language Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Language</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowLanguagePicker(true)}
            >
              <Globe size={20} color={colors.textSecondary} style={styles.icon} />
              <Text style={styles.picker}>
                {selectedLanguage?.flag} {selectedLanguage?.name}
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Setting up...' : 'Get Started'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
            </View>
            <View style={{ padding: 20 }}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                value={formData.dob}
                onChangeText={(text) => setFormData(prev => ({ ...prev, dob: text }))}
                onBlur={() => setShowDatePicker(false)}
                autoFocus
              />
            </View>
          </View>
        </View>
      )}

      {/* Language Picker Modal */}
      {showLanguagePicker && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
            </View>
            <ScrollView>
              {LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    formData.language === language.code && styles.languageSelected
                  ]}
                  onPress={() => handleLanguageSelect(language.code)}
                >
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <Text style={styles.languageName}>{language.name}</Text>
                  {formData.language === language.code && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}