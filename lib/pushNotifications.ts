import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface PushNotificationData {
  type: 'signal' | 'achievement' | 'announcement' | 'alert';
  title: string;
  message: string;
  data?: any;
}

export interface DeviceProfile {
  id?: string;
  user_id: string;
  expo_push_token?: string;
  device_type?: 'ios' | 'android' | 'web';
  app_version?: string;
  last_active: string;
  created_at?: string;
}

// Generate unique device ID
export async function generateDeviceId(): Promise<string> {
  try {
    const deviceInfo = Device.osInternalBuildId || 
                      Device.deviceName || 
                      Device.modelName || 
                      'unknown-device';
    
    const cleanId = deviceInfo.replace(/\s+/g, '-').toLowerCase();
    const timestamp = Date.now();
    const finalId = `device_${cleanId}_${timestamp}`;
    
    console.log('📱 Generated device ID:', finalId.substring(0, 20) + '...');
    return finalId;
  } catch (error) {
    console.error('❌ Error generating device ID:', error);
    const fallbackId = `device_fallback_${Date.now()}`;
    return fallbackId;
  }
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
      console.log('⚠️ Web notifications not supported in this implementation');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    console.log('📱 Notification permission status:', finalStatus);
    return finalStatus === 'granted';
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
}

// Get Expo push token
async function getExpoPushToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      console.log('🌐 Web platform - Expo push tokens not supported');
      return null;
    }

    if (!Device.isDevice) {
      console.log('⚠️ Must use physical device for push notifications');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn('⚠️ EAS project ID not configured');
      return null;
    }

    console.log('🔑 Getting Expo push token...');
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('✅ Expo push token obtained:', token.data.substring(0, 20) + '...');
    return token.data;
  } catch (error) {
    console.error('❌ Error getting Expo push token:', error);
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

    const deviceId = await generateDeviceId();
    const pushToken = await getExpoPushToken();
    
    // Register device profile in database
    const deviceData: Omit<DeviceProfile, 'id' | 'created_at'> = {
      user_id: deviceId,
      expo_push_token: pushToken || undefined,
      device_type: getDeviceType(),
      app_version: '1.0.0',
      last_active: new Date().toISOString(),
    };

    console.log('💾 Registering device profile:', {
      user_id: deviceId.substring(0, 20) + '...',
      device_type: deviceData.device_type,
      has_push_token: !!pushToken
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

// Get current device ID (for display purposes)
export async function getCurrentDeviceId(): Promise<string> {
  return await generateDeviceId();
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
      console.log('⚠️ Local notifications not supported on web');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.message,
        data: data.data,
      },
      trigger: null,
    });

    console.log('✅ Local notification sent');
  } catch (error) {
    console.error('❌ Error sending local notification:', error);
  }
}

// Send push notification via Expo Push API
export async function sendPushNotification(
  tokens: string[],
  data: PushNotificationData
): Promise<boolean> {
  try {
    console.log('📤 Sending push notification to', tokens.length, 'devices');

    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: data.title,
      body: data.message,
      data: data.data,
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      throw new Error(`Push notification failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Push notification sent:', result);
    return true;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return false;
  }
}

// Get all registered device tokens
export async function getAllDeviceTokens(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('expo_push_token')
      .not('expo_push_token', 'is', null);

    if (error) {
      console.error('❌ Error fetching device tokens:', error);
      return [];
    }

    return data.map(profile => profile.expo_push_token).filter(Boolean);
  } catch (error) {
    console.error('❌ Error fetching device tokens:', error);
    return [];
  }
}

// Send notification to all devices
export async function broadcastNotification(data: PushNotificationData): Promise<boolean> {
  try {
    const tokens = await getAllDeviceTokens();
    if (tokens.length === 0) {
      console.log('⚠️ No device tokens found for broadcast');
      return false;
    }

    return await sendPushNotification(tokens, data);
  } catch (error) {
    console.error('❌ Error broadcasting notification:', error);
    return false;
  }
}

// Predefined notification functions
export async function sendSignalNotification(signal: {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  entry_price: number;
  status: string;
}): Promise<void> {
  await broadcastNotification({
    type: 'signal',
    title: `${signal.status === 'active' ? 'New' : 'Updated'} Signal Alert`,
    message: `${signal.pair} ${signal.type} signal ${signal.status}! Entry: $${signal.entry_price.toFixed(2)}`,
    data: {
      signal_id: signal.id,
      pair: signal.pair,
      type: signal.type,
      entry_price: signal.entry_price,
      status: signal.status,
    },
  });
}

export async function sendAchievementNotification(achievement: {
  title: string;
  description: string;
  type: string;
}): Promise<void> {
  await broadcastNotification({
    type: 'achievement',
    title: `Achievement Unlocked: ${achievement.title}`,
    message: achievement.description,
    data: {
      achievement_type: achievement.type,
    },
  });
}

export async function sendTestNotification(): Promise<void> {
  await sendLocalNotification({
    type: 'signal',
    title: 'Test Signal Alert',
    message: 'XAU/USD BUY signal activated! Entry: $2,345.67',
    data: {
      signal_id: 'test-123',
      pair: 'XAU/USD',
      type: 'BUY',
      entry_price: 2345.67,
      test: true,
    },
  });
}