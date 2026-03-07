import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { MotiView } from "@/utils/moti-wrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const COUNTDOWN = 5;

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

export default function OnboardingScreen() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN);
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();

  const canSkip = timeLeft === 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSkip = () => {
    if (canSkip) {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={handleSkip}
          disabled={!canSkip}
          style={[
            styles.skipButton,
            {
              backgroundColor: canSkip
                ? isDark
                  ? "#1C1E1F"
                  : "#fff"
                : isDark
                  ? "#111"
                  : "#f3f4f6",
              borderColor: canSkip
                ? isDark
                  ? "#2A2C2E"
                  : "#e5e7eb"
                : isDark
                  ? "#1a1a1a"
                  : "#e5e7eb",
              opacity: canSkip ? 1 : 0.7,
            },
          ]}
        >
          <Text
            style={[
              styles.skipText,
              { color: canSkip ? theme.tint : theme.icon },
            ]}
          >
            {canSkip ? t("skip") : `${t("skip")} (${timeLeft})`}
          </Text>
          <Ionicons
            name={canSkip ? "chevron-forward" : "time-outline"}
            size={20}
            color={canSkip ? theme.tint : theme.icon}
          />
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
              backgroundColor: isDark ? "#1C1E1F" : "#fff",
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
                  backgroundColor: isDark ? "#1C1E1F" : "#fff",
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

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 300, delay: 800 }}
        style={styles.footer}
      >
        <View
          style={[
            styles.progressBar,
            { backgroundColor: isDark ? "#2A2C2E" : "#e5e7eb" },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${((COUNTDOWN - timeLeft) / COUNTDOWN) * 100}%`,
                backgroundColor: theme.tint,
              },
            ]}
          />
        </View>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: "flex-end",
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginRight: 4,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: "#fff",
    alignSelf: "center",
    padding: 30,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#dcfce7",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#16a34a",
    textAlign: "center",
    marginBottom: 50,
    lineHeight: 40,
  },
  features: {
    // spacing between feature items handled by marginBottom on featureItem
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 25,
  },
  featureIcon: {
    width: 50,
    height: 50,
    backgroundColor: "#f0fdf4",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: "#666",
  },
  footer: {
    padding: 30,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#16a34a",
  },
});
