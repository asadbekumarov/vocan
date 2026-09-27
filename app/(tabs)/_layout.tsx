import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ComponentTokens } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
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
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: theme.tabBarBackground,
            borderTopColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            height: ComponentTokens.tabBar.height,
            paddingBottom: Platform.OS === 'web' ? 0 : 8,
            paddingTop: 0,
            ...Platform.select({
              web: {
                maxWidth: 420,
                alignSelf: 'center',
                width: '90%',
                marginBottom: 24,
                borderRadius: ComponentTokens.tabBar.borderRadius,
                borderWidth: 1,
                borderColor: isDark
                  ? 'rgba(99, 102, 241, 0.15)'
                  : 'rgba(255, 255, 255, 0.6)',
                position: 'absolute',
                left: '50%',
                transform: [{ translateX: '-50%' }],
                bottom: 12,
                backdropFilter: `saturate(180%) blur(${ComponentTokens.tabBar.blurIntensity}px)`,
                WebkitBackdropFilter: `saturate(180%) blur(${ComponentTokens.tabBar.blurIntensity}px)`,
                boxShadow: isDark
                  ? '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(99,102,241,0.1)'
                  : '0 8px 32px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px rgba(99,102,241,0.06)',
                paddingHorizontal: 8,
              } as any,
              default: {},
            }),
          },
          tabBarItemStyle: Platform.OS === 'web' ? {
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          } : {},
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarHideOnKeyboard: true,
        }}>

        <Tabs.Screen
          name="index"
          options={{
            title: t('home') ?? 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="quiz"
          options={{
            title: t('quiz'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'game-controller' : 'game-controller-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="add-word"
          options={{
            title: t('addWord'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'add-circle' : 'add-circle-outline'}
                size={26}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="my-words"
          options={{
            title: t('myWords'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'book' : 'book-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="about-app"
          options={{
            title: t('about'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
