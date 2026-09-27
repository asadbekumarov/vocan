/**
 * StreakCard — Hero motivational card.
 * Shows current streak with animated fire icon, daily goal progress bar,
 * and today's word count. This is the most prominent element on the dashboard.
 */
import { Palette, Shadows, UI, Typography } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { GamificationData } from "@/storage/gamificationStorage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

interface StreakCardProps {
  gamification: GamificationData | null;
  todayCount: number;
  labels: {
    dailyGoal: string;
    streak: string;
    words: string;
    maxStreak: string;
  };
}

export default function StreakCard({ gamification, todayCount, labels }: StreakCardProps) {
  const { theme, isDark } = useTheme();

  // ── Animated fire pulse ──
  const flamePulse = useSharedValue(0);
  useEffect(() => {
    flamePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [flamePulse]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(flamePulse.value, [0, 1], [1, 1.15]) },
      { translateY: interpolate(flamePulse.value, [0, 1], [0, -3]) },
    ],
    opacity: interpolate(flamePulse.value, [0, 1], [0.85, 1]),
  }));

  // ── Progress bar animation ──
  const progressAnim = useSharedValue(0);
  const progressPercent = gamification
    ? Math.min((todayCount / gamification.dailyGoal) * 100, 100)
    : 0;

  useEffect(() => {
    progressAnim.value = withTiming(progressPercent, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progressPercent, progressAnim]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }));

  const streak = gamification?.currentStreak ?? 0;
  const maxStreak = gamification?.maxStreak ?? 0;
  const dailyGoal = gamification?.dailyGoal ?? 10;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.tint },
        isDark ? Shadows.dark.lg : Shadows.light.lg,
      ]}
    >
      {/* Background decorative circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Top row: Streak number + Fire */}
      <View style={styles.topRow}>
        <View style={styles.streakLeft}>
          <Animated.View style={[styles.fireBox, flameStyle]}>
            <Ionicons name="flame" size={36} color="#FCD34D" />
          </Animated.View>
          <View>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>{labels.streak}</Text>
          </View>
        </View>

        {/* Max streak badge */}
        <View style={styles.maxStreakBadge}>
          <Ionicons name="trophy" size={14} color="#FCD34D" />
          <Text style={styles.maxStreakText}>{maxStreak}</Text>
          <Text style={styles.maxStreakLabel}>{labels.maxStreak}</Text>
        </View>
      </View>

      {/* Daily goal progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{labels.dailyGoal}</Text>
          <Text style={styles.progressCount}>
            {todayCount} / {dailyGoal} {labels.words}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressBarStyle]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: UI.borderRadius.xl + 4,
    padding: 24,
    paddingBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  bgCircle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#ffffff0D",
    top: -60,
    right: -30,
  },
  bgCircle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ffffff08",
    bottom: -20,
    left: 30,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  streakLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  fireBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#ffffff18",
    alignItems: "center",
    justifyContent: "center",
  },
  streakNumber: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 44,
    letterSpacing: -1.5,
  },
  streakLabel: {
    ...Typography.labelSmall,
    color: "#ffffffA0",
    marginTop: 2,
  },
  maxStreakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ffffff18",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: UI.borderRadius.pill,
  },
  maxStreakText: {
    ...Typography.labelSmall,
    color: "#fff",
    fontWeight: "800",
  },
  maxStreakLabel: {
    ...Typography.caption,
    color: "#ffffffA0",
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    ...Typography.overline,
    color: "#ffffff70",
    letterSpacing: 1,
  },
  progressCount: {
    ...Typography.caption,
    color: "#ffffffB0",
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#ffffff25",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
});
