import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.tint,
          tabBarInactiveTintColor: theme.tabIconDefault,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopColor: isDark ? '#2A2C2E' : '#E5E7EB',
          },
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarHideOnKeyboard: true,
        }}>

      <Tabs.Screen
        name="quiz"
        options={{
          title: t('quiz'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="quiz.bubble" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-word"
        options={{
          title: t('addWord'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="add.box" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('myWords'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="about-app"
        options={{
          title: t('about'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="info.circle" color={color} />,
        }}
      />
      </Tabs>
    </>
  );
}
