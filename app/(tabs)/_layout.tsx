import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

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
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            height: Platform.OS === 'web' ? 64 : 60,
            paddingBottom: Platform.OS === 'web' ? 0 : 8,
            paddingTop: 0,
            ...Platform.select({
              web: {
                maxWidth: 480,
                alignSelf: 'center',
                width: '85%',
                marginBottom: 20,
                borderRadius: 32,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
                position: 'absolute',
                left: '50%',
                transform: [{ translateX: '-50%' }],
                bottom: 12,
                backdropFilter: 'saturate(180%) blur(25px)',
                WebkitBackdropFilter: 'saturate(180%) blur(25px)',
                boxShadow: isDark
                  ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
                  : '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
                paddingHorizontal: 8,
              } as any,
              default: {
                // borderTopWidth and elevation already handled above, 
                // but just in case we need anything specific here later.
              },
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
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
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
        name="my-words"
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
