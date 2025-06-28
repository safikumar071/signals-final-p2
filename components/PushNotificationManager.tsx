import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Bell, BellOff, Smartphone, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  registerForPushNotifications,
  setupNotificationListeners,
  requestNotificationPermissions,
  getCurrentDeviceId,
  getDeviceProfile,
  sendTestNotification,
  DeviceProfile,
} from '../lib/pushNotifications';

interface PushNotificationManagerProps {
  onRegistrationComplete?: (deviceId: string | null) => void;
}

export default function PushNotificationManager({ onRegistrationComplete }: PushNotificationManagerProps) {
  const { colors, fontSizes } = useTheme();
  const { t } = useLanguage();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);

  useEffect(() => {
    checkRegistrationStatus();
    
    const cleanup = setupNotificationListeners();
    
    return cleanup;
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      const [id, profile] = await Promise.all([
        getCurrentDeviceId(),
        getDeviceProfile()
      ]);
      
      setDeviceId(id);
      setDeviceProfile(profile);
      setIsRegistered(!!profile?.expo_push_token);
      
      console.log('📊 Push notification status:', {
        deviceId: id.substring(0, 20) + '...',
        hasProfile: !!profile,
        hasPushToken: !!profile?.expo_push_token
      });
    } catch (error) {
      console.error('❌ Error checking registration status:', error);
      setIsRegistered(false);
    }
  };

  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      
      const deviceId = await registerForPushNotifications();
      
      if (deviceId) {
        setIsRegistered(true);
        setDeviceId(deviceId);
        onRegistrationComplete?.(deviceId);
        
        // Refresh profile data
        const profile = await getDeviceProfile();
        setDeviceProfile(profile);
        
        Alert.alert(
          'Success',
          'Push notifications enabled successfully!',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to register for push notifications. Please check your device settings.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const granted = await requestNotificationPermissions();
      
      if (granted) {
        await handleRegister();
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive trading alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              console.log('Open device settings for notifications');
            }}
          ]
        );
      }
    } catch (error) {
      console.error('❌ Permission request error:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert('Test Sent', 'Check your notifications!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const getStatusInfo = () => {
    if (Platform.OS === 'web') {
      return {
        icon: Smartphone,
        color: colors.textSecondary,
        title: 'Web Platform',
        subtitle: 'Push notifications not supported on web',
        action: null,
      };
    }

    if (isRegistered === null) {
      return {
        icon: Smartphone,
        color: colors.textSecondary,
        title: 'Checking Status',
        subtitle: 'Please wait...',
        action: null,
      };
    }

    if (isRegistered) {
      return {
        icon: CheckCircle,
        color: colors.success,
        title: 'Notifications Enabled',
        subtitle: 'Device registered for push notifications',
        action: {
          text: 'Send Test',
          onPress: handleTestNotification,
        },
      };
    }

    return {
      icon: AlertCircle,
      color: colors.warning,
      title: 'Notifications Disabled',
      subtitle: 'Enable notifications to receive trading alerts',
      action: {
        text: 'Enable Notifications',
        onPress: handleRequestPermissions,
      },
    };
  };

  const statusInfo = getStatusInfo();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${statusInfo.color}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: statusInfo.color,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 2,
    },
    subtitle: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    actionButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginTop: 12,
      alignItems: 'center',
    },
    actionButtonDisabled: {
      opacity: 0.6,
    },
    actionButtonText: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.background,
      fontFamily: 'Inter-SemiBold',
    },
    deviceInfo: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    deviceText: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      marginBottom: 4,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <statusInfo.icon size={20} color={statusInfo.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{statusInfo.title}</Text>
          <Text style={styles.subtitle}>{statusInfo.subtitle}</Text>
        </View>
      </View>

      {statusInfo.action && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            isRegistering && styles.actionButtonDisabled
          ]}
          onPress={statusInfo.action.onPress}
          disabled={isRegistering}
        >
          <Text style={styles.actionButtonText}>
            {isRegistering ? 'Registering...' : statusInfo.action.text}
          </Text>
        </TouchableOpacity>
      )}

      {deviceProfile && Platform.OS !== 'web' && (
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceText}>
            Device ID: {deviceId?.substring(0, 20)}...
          </Text>
          <Text style={styles.deviceText}>
            Device Type: {deviceProfile.device_type}
          </Text>
          <Text style={styles.deviceText}>
            Push Token: {deviceProfile.expo_push_token ? 'Configured' : 'Not configured'}
          </Text>
        </View>
      )}
    </View>
  );
}