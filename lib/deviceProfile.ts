import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface UserProfile {
  id?: string;
  user_id: string;
  name: string;
  dob: string;
  language: string;
  onboarding_completed: boolean;
  last_active: string;
  created_at?: string;
}

// Generate unique device ID
export async function getDeviceId(): Promise<string> {
  try {
    // Try to get a unique device identifier
    const deviceId = Device.osInternalBuildId || 
                    Device.deviceName || 
                    Device.modelName || 
                    'unknown-device';
    
    // Clean and format the ID
    const cleanId = deviceId.replace(/\s+/g, '-').toLowerCase();
    return `device_${cleanId}_${Date.now()}`;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to timestamp-based ID
    return `device_fallback_${Date.now()}`;
  }
}

// Check if profile exists locally
export async function checkLocalProfileExists(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem('user_profile_created');
    return value === 'true';
  } catch (error) {
    console.error('Error checking local profile:', error);
    return false;
  }
}

// Mark profile as created locally
export async function markProfileAsCreated(): Promise<void> {
  try {
    await AsyncStorage.setItem('user_profile_created', 'true');
  } catch (error) {
    console.error('Error marking profile as created:', error);
  }
}

// Save user profile to Supabase
export async function saveUserProfile(
  name: string, 
  dob: string, 
  language: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const deviceId = await getDeviceId();

    const profileData = {
      user_id: deviceId,
      name: name.trim(),
      dob,
      language,
      onboarding_completed: true,
      last_active: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_profiles')
      .upsert(profileData);

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message };
    }

    // Mark as created locally
    await markProfileAsCreated();
    
    // Store device ID for future use
    await AsyncStorage.setItem('device_id', deviceId);

    return { success: true };
  } catch (error) {
    console.error('Error saving user profile:', error);
    return { success: false, error: 'Failed to save profile' };
  }
}

// Load user profile from Supabase
export async function loadUserProfile(): Promise<UserProfile | null> {
  try {
    // First check if we have a stored device ID
    let deviceId = await AsyncStorage.getItem('device_id');
    
    if (!deviceId) {
      deviceId = await getDeviceId();
      await AsyncStorage.setItem('device_id', deviceId);
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', deviceId)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
}

// Update user profile
export async function updateUserProfile(
  updates: Partial<Pick<UserProfile, 'name' | 'dob' | 'language'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const deviceId = await AsyncStorage.getItem('device_id');
    
    if (!deviceId) {
      return { success: false, error: 'Device ID not found' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        last_active: new Date().toISOString(),
      })
      .eq('user_id', deviceId);

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

// Check if onboarding is completed
export async function checkOnboardingStatus(): Promise<boolean> {
  try {
    // First check locally for faster response
    const localStatus = await checkLocalProfileExists();
    if (!localStatus) return false;

    // Then verify with Supabase
    const profile = await loadUserProfile();
    return profile?.onboarding_completed || false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

// Language options
export const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];