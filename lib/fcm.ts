import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface DeviceProfile {
  id?: string;
  user_id: string;
  fcm_token?: string;
  device_type?: 'ios' | 'android' | 'web';
  app_version?: string;
  last_active: string;
  created_at?: string;
}

export interface PushNotificationData {
  type: 'signal' | 'achievement' | 'announcement' | 'alert';
  title: string;
  message: string;
  data?: any;
}

// Generate unique device ID
export async function generateDeviceId(): Promise<string> {
  try {
    const existingId = await AsyncStorage.getItem('device_id');
    if (existingId) {
      return existingId;
    }

    const deviceInfo = Device.osInternalBuildId || 
                      Device.deviceName || 
                      Device.modelName || 
                      'unknown-device';
    
    const cleanId = deviceInfo.replace(/\s+/g, '-').toLowerCase();
    const timestamp = Date.now();
    const finalId = `device_${cleanId}_${timestamp}`;
    
    await AsyncStorage.setItem('device_id', finalId);
    console.log('📱 Generated new device ID:', finalId.substring(0, 20) + '...');
    
    return finalId;
  } catch (error) {
    console.error('❌ Error generating device ID:', error);
    const fallbackId = `device_fallback_${Date.now()}`;
    try {
      await AsyncStorage.setItem('device_id', fallbackId);
    } catch (storageError) {
      console.error('❌ Error storing fallback device ID:', storageError);
    }
    return fallbackId;
  }
}

// Get current device ID
export async function getCurrentDeviceId(): Promise<string> {
  return await generateDeviceId();
}

// Get device type
function getDeviceType(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    console.log('📱 Requesting notification permissions...');
    
    if (Platform.OS === 'web') {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('🌐 Web notification permission:', permission);
        return permission === 'granted';
      }
      console.log('⚠️ Web notifications not supported');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    console.log('📱 Mobile notification permission:', finalStatus);
    return finalStatus === 'granted';
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
}

// Get push notification token
async function getPushToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // For web, we'll use a mock token since FCM web setup requires service worker
      console.log('🌐 Web platform - using mock FCM token for demo');
      return `web_token_${Date.now()}`;
    }

    if (!Device.isDevice) {
      console.log('⚠️ Must use physical device for push notifications');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    if (!projectId) {
      console.warn('⚠️ EAS project ID not configured');
      return null;
    }

    console.log('🔑 Getting Expo push token...');
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('✅ Expo push token obtained');
    return token.data;
  } catch (error) {
    console.error('❌ Error getting push token:', error);
    return null;
  }
}

// Register device for push notifications
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    console.log('🚀 Starting push notification registration...');

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('❌ Notification permissions not granted');
      return null;
    }

    const deviceId = await getCurrentDeviceId();
    const pushToken = await getPushToken();
    
    // Register device profile in database
    const deviceData: Omit<DeviceProfile, 'id' | 'created_at'> = {
      user_id: deviceId,
      fcm_token: pushToken || undefined,
      device_type: getDeviceType(),
      app_version: '1.0.0',
      last_active: new Date().toISOString(),
    };

    console.log('💾 Registering device profile:', {
      user_id: deviceId.substring(0, 20) + '...',
      device_type: deviceData.device_type,
      has_fcm_token: !!pushToken
    });

    const { error } = await supabase
      .from('user_profiles')
      .upsert(deviceData, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('❌ Error registering device:', error);
      return null;
    }

    console.log('✅ Device registered successfully');
    return deviceId;
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    return null;
  }
}

// Get device profile
export async function getDeviceProfile(): Promise<DeviceProfile | null> {
  try {
    const deviceId = await getCurrentDeviceId();
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', deviceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null;
      }
      console.error('❌ Error loading device profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error loading device profile:', error);
    return null;
  }
}

// Setup notification listeners
export function setupNotificationListeners() {
  const listeners: (() => void)[] = [];

  console.log('🔔 Setting up notification listeners...');

  if (Platform.OS !== 'web') {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notification received:', notification.request.content.title);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response.notification.request.content.title);
      
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.type === 'signal' && data?.signal_id) {
        console.log('Navigate to signal:', data.signal_id);
        // Add navigation logic here if needed
      }
    });

    listeners.push(() => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    });
  }

  console.log('✅ Notification listeners set up');

  return () => {
    console.log('🧹 Cleaning up notification listeners');
    listeners.forEach(cleanup => cleanup());
  };
}

// Send local notification for testing
export async function sendLocalNotification(data: PushNotificationData): Promise<void> {
  try {
    console.log('📤 Sending local notification:', data.title);

    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/assets/images/icon.png',
          data: data.data,
        });
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.message,
          data: data.data,
        },
        trigger: null,
      });
    }

    console.log('✅ Local notification sent');
  } catch (error) {
    console.error('❌ Error sending local notification:', error);
  }
}

// Clear device data (for testing/reset)
export async function clearDeviceData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(['device_id']);
    console.log('🗑️ Device data cleared');
  } catch (error) {
    console.error('❌ Error clearing device data:', error);
  }
}