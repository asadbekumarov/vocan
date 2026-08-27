
import { UI } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { MotiView } from '@/utils/moti-wrapper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURES = [
  {
    icon: "add-circle" as const,
    titleKey: "newWords" as const,
    descKey: "easyAdd" as const,
  },
  {
    icon: "library" as const,
    titleKey: "myWords" as const,
    descKey: "repeatCollection" as const,
  },
  {
    icon: "extension-puzzle" as const,
    titleKey: "quiz" as const,
    descKey: "testKnowledge" as const,
  },
];

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
      onComplete();
    } catch (error) {
      console.error('Error saving to AsyncStorage:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={handleSkip}
          style={[
            styles.skipButton,
            {
              backgroundColor: isDark ? "#111827" : "#fff",
              borderColor: isDark ? "#2A2C2E" : "#e5e7eb",
            },
          ]}
        >
          <Text style={[styles.skipText, { color: theme.tint }]}>
            {t("skip")}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={theme.tint} />
        </TouchableOpacity>
      </MotiView>

      <View style={styles.content}>
        <MotiView
          from={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 300, delay: 100 }}
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDark ? "#111827" : "#fff",
              borderColor: isDark ? "#2A2C2E" : "#dcfce7",
              shadowColor: theme.tint,
            },
          ]}
        >
          <Ionicons name="school" size={80} color={theme.tint} />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 300 }}
        >
          <Text style={[styles.title, { color: theme.tint }]}>
            {t("onboardingTitle")}
          </Text>
        </MotiView>

        <View style={styles.features}>
          {FEATURES.map((feature, index) => (
            <MotiView
              key={feature.titleKey}
              from={{ opacity: 0, translateX: 40 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{
                type: "timing",
                duration: 250,
                delay: 500 + index * 120,
              }}
              style={[
                styles.featureItem,
                {
                  backgroundColor: isDark ? "#111827" : "#fff",
                  borderColor: isDark ? "#2A2C2E" : "#f0f0f0",
                },
              ]}
            >
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: isDark ? "#2A2C2E" : "#f0fdf4" },
                ]}
              >
                <Ionicons name={feature.icon} size={32} color={theme.tint} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>
                  {t(feature.titleKey)}
                </Text>
                <Text
                  style={[
                    styles.featureDesc,
                    { color: isDark ? "#9BA1A6" : "#666" },
                  ]}
                >
                  {t(feature.descKey)}
                </Text>
              </View>
            </MotiView>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: UI.padding,
    alignItems: "flex-end",
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: UI.borderRadius.large,
    borderWidth: 1,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 4,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: UI.padding,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: UI.spacing.lg,
    alignSelf: "center",
    padding: UI.padding,
    borderRadius: 60,
    borderWidth: 2,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: UI.spacing.xl,
    lineHeight: 40,
  },
  features: {
    gap: UI.spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: UI.spacing.md,
    borderRadius: UI.borderRadius.large,
    borderWidth: 1,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: UI.spacing.md,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
  },
});

export default Onboarding;
