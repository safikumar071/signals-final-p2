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
  fcm_token?: string;
  device_type?: 'ios' | 'android' | 'web';
  app_version?: string;
  last_active: string;
  created_at?: string;
}

export interface OnboardingData {
  name: string;
  dob: string;
  language: string;
}

// Language options matching the database constraint
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

// Generate unique device ID
export async function getDeviceId(): Promise<string> {
  try {
    // Check if we already have a stored device ID
    const existingId = await AsyncStorage.getItem('device_id');
    if (existingId) {
      return existingId;
    }

    // Generate new device ID
    const deviceId = Device.osInternalBuildId || 
                    Device.deviceName || 
                    Device.modelName || 
                    `device_${Date.now()}`;
    
    // Clean and format the ID
    const cleanId = deviceId.replace(/\s+/g, '-').toLowerCase();
    const finalId = `device_${cleanId}_${Date.now()}`;
    
    // Store for future use
    await AsyncStorage.setItem('device_id', finalId);
    
    return finalId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to timestamp-based ID
    const fallbackId = `device_fallback_${Date.now()}`;
    try {
      await AsyncStorage.setItem('device_id', fallbackId);
    } catch (storageError) {
      console.error('Error storing fallback device ID:', storageError);
    }
    return fallbackId;
  }
}

// Get current device type
function getDeviceType(): 'ios' | 'android' | 'web' {
  if (Device.osName === 'iOS') return 'ios';
  if (Device.osName === 'Android') return 'android';
  return 'web';
}

// Check if profile exists locally
export async function checkLocalProfileExists(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem('onboarding_completed');
    return value === 'true';
  } catch (error) {
    console.error('Error checking local profile:', error);
    return false;
  }
}

// Mark profile as created locally
export async function markProfileAsCreated(): Promise<void> {
  try {
    await AsyncStorage.setItem('onboarding_completed', 'true');
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
      device_type: getDeviceType(),
      app_version: '1.0.0',
      last_active: new Date().toISOString(),
    };

    console.log('Saving profile data:', profileData);

    const { error } = await supabase
      .from('user_profiles')
      .upsert(profileData, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message };
    }

    // Mark as created locally
    await markProfileAsCreated();
    
    // Store profile data locally for offline access
    await AsyncStorage.setItem('user_profile', JSON.stringify({
      name,
      dob,
      language,
      device_id: deviceId,
    }));

    console.log('Profile saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Error saving user profile:', error);
    return { success: false, error: 'Failed to save profile' };
  }
}

// Load user profile from Supabase
export async function loadUserProfile(): Promise<UserProfile | null> {
  try {
    const deviceId = await getDeviceId();
    
    console.log('Loading profile for device ID:', deviceId);

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', deviceId)
      .single();

    if (error) {
      console.error('Error loading profile from Supabase:', error);
      
      // Try to load from local storage as fallback
      try {
        const localProfile = await AsyncStorage.getItem('user_profile');
        if (localProfile) {
          const parsed = JSON.parse(localProfile);
          console.log('Using local profile as fallback');
          return {
            user_id: deviceId,
            name: parsed.name,
            dob: parsed.dob,
            language: parsed.language,
            onboarding_completed: true,
            last_active: new Date().toISOString(),
          };
        }
      } catch (localError) {
        console.error('Error loading local profile:', localError);
      }
      
      return null;
    }

    console.log('Profile loaded from Supabase:', data);
    
    // Update local storage with latest data
    await AsyncStorage.setItem('user_profile', JSON.stringify({
      name: data.name,
      dob: data.dob,
      language: data.language,
      device_id: deviceId,
    }));

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
    const deviceId = await getDeviceId();
    
    console.log('Updating profile for device ID:', deviceId, 'with updates:', updates);

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

    // Update local storage
    try {
      const localProfile = await AsyncStorage.getItem('user_profile');
      if (localProfile) {
        const parsed = JSON.parse(localProfile);
        const updated = { ...parsed, ...updates };
        await AsyncStorage.setItem('user_profile', JSON.stringify(updated));
      }
    } catch (localError) {
      console.error('Error updating local profile:', localError);
    }

    console.log('Profile updated successfully');
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
    if (!localStatus) {
      console.log('Local onboarding status: not completed');
      return false;
    }

    // Then verify with Supabase
    const profile = await loadUserProfile();
    const completed = profile?.onboarding_completed || false;
    
    console.log('Onboarding status check:', {
      local: localStatus,
      remote: completed,
      final: completed
    });
    
    return completed;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    // Fallback to local check
    return await checkLocalProfileExists();
  }
}

// Clear all profile data (for testing/reset)
export async function clearProfileData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      'device_id',
      'onboarding_completed', 
      'user_profile'
    ]);
    console.log('Profile data cleared');
  } catch (error) {
    console.error('Error clearing profile data:', error);
  }
}