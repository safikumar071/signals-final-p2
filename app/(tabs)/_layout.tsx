import { Tabs } from 'expo-router';
import { TrendingUp, Wallet, ChartBar as BarChart3, User, HomeIcon, CalculatorIcon, View, Settings2, Bell } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-svg';
import { useState } from 'react';
import NotificationSheet from '@/components/NotificationSheet';
import SetupGuide from '@/components/SetupGuide';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors, isDark, fontSizes } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <HomeIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="signals"
        options={{
          title: 'Signals',
          tabBarIcon: ({ size, color }) => (
            <TrendingUp size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: 'Calculator',
          tabBarIcon: ({ size, color }) => (
            <CalculatorIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings2 size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}