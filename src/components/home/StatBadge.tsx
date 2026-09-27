/**
 * StatBadge — Compact stat indicator.
 * Shows a single metric (number + label) with an icon.
 * Designed for horizontal row layout — uniform height, variable width.
 * Entrance animation: staggered fade + slide up.
 */
import { Palette, Shadows, UI, Typography } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "@/utils/moti-wrapper";
import { StyleSheet, Text, View } from "react-native";

interface StatBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  label: string;
  color: string;
  index?: number;
}

export default function StatBadge({ icon, value, label, color, index = 0 }: StatBadgeProps) {
  const { theme, isDark } = useTheme();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14, scale: 0.92 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: "spring", damping: 16, stiffness: 140, delay: 200 + index * 80 }}
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        isDark ? Shadows.dark.xs : Shadows.light.xs,
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: color + "12" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textTertiary }]} numberOfLines={1}>
        {label}
      </Text>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: UI.borderRadius.large,
    borderWidth: 1,
    gap: 4,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
