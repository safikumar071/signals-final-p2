import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: any = null;

if (Platform.OS === 'web') {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.log('Firebase messaging not available:', error);
  }
}

export { messaging };

// Get FCM token for web
export async function getFCMToken(): Promise<string | null> {
  if (Platform.OS !== 'web' || !messaging) {
    return null;
  }

  try {
    const vapidKey = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('VAPID key not configured for web push notifications');
      return null;
    }

    const serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration });
    console.log("FCM Token:", token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Listen for foreground messages (web only)
export function onForegroundMessage(callback: (payload: any) => void) {
  if (Platform.OS !== 'web' || !messaging) {
    return () => { };
  }

  return onMessage(messaging, callback);
}
