import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Onboarding from '@/components/Onboarding';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('has_seen_onboarding');
        if (value !== null) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Error reading from AsyncStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [router]);

  const handleOnboardingComplete = () => {
    setHasSeenOnboarding(true);
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (hasSeenOnboarding) {
    return null; 
  }

  return <Onboarding onComplete={handleOnboardingComplete} />;
}

