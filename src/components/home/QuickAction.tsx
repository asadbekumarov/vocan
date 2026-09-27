import { Palette, Shadows, UI, Typography } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface QuickActionProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor?: string;
  onPress: () => void;
  flex?: number;
  highlight?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function QuickAction({
  title,
  subtitle,
  icon,
  color,
  bgColor,
  onPress,
  flex = 1,
  highlight = false,
}: QuickActionProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const cardBg = highlight
    ? isDark
      ? "rgba(99, 102, 241, 0.16)"
      : Palette.indigo50
    : theme.card;

  const cardBorder = highlight
    ? isDark
      ? "rgba(99, 102, 241, 0.35)"
      : Palette.indigo200
    : theme.border;

  return (
    <AnimatedPressable
      style={[
        styles.container,
        {
          flex,
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
        isDark ? Shadows.dark.sm : Shadows.light.sm,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: bgColor || color + "15" },
        ]}
      >
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.textTertiary }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      <View style={styles.arrowBox}>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={isDark ? Palette.slate600 : Palette.slate300}
        />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: UI.borderRadius.large,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: UI.borderRadius.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    ...Typography.headingMedium,
    fontWeight: "700",
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.labelSmall,
    fontWeight: "500",
  },
  arrowBox: {
    opacity: 0.7,
  },
});
