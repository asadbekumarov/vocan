import { Palette, Shadows, UI, Typography } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { MotiView } from "@/utils/moti-wrapper";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface QuizOptionProps {
  text: string;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  disabled: boolean;
  onPress: () => void;
  index?: number;
}

export default function QuizOption({
  text,
  isSelected,
  isCorrect,
  isWrong,
  disabled,
  onPress,
  index = 0,
}: QuizOptionProps) {
  const { theme, isDark } = useTheme();

  let borderColor = theme.border;
  let bgColor = theme.card;

  if (isSelected && !isCorrect && !isWrong) {
    borderColor = theme.tint;
    bgColor = isDark ? 'rgba(99, 102, 241, 0.08)' : Palette.indigo50;
  }
  if (isCorrect) {
    borderColor = Palette.emerald500;
    bgColor = isDark ? 'rgba(16, 185, 129, 0.12)' : Palette.emerald50;
  }
  if (isWrong) {
    borderColor = Palette.rose500;
    bgColor = isDark ? 'rgba(244, 63, 94, 0.12)' : Palette.rose50;
  }

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0, scale: isCorrect ? 1.02 : 1 }}
      transition={{ type: "timing", duration: 250, delay: index * 60 }}
    >
      <TouchableOpacity
        style={[
          styles.option,
          { 
            borderColor, 
            backgroundColor: bgColor,
          },
          isDark ? Shadows.dark.xs : Shadows.light.xs,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        {/* Letter badge */}
        <Text
          style={[
            styles.letterBadge,
            { 
              color: isSelected ? theme.tint : theme.textTertiary,
            },
          ]}
        >
          {optionLetters[index] || ''}
        </Text>

        <Text
          style={[
            styles.text,
            { color: theme.text },
            isSelected && !isCorrect && !isWrong && { color: theme.tint, fontWeight: "700" },
            isCorrect && { color: Palette.emerald600, fontWeight: '700' },
            isWrong && { color: Palette.rose500, fontWeight: '700' },
          ]}
        >
          {text}
        </Text>
        {isCorrect && (
          <Ionicons name="checkmark-circle" size={22} color={Palette.emerald500} />
        )}
        {isWrong && (
          <Ionicons name="close-circle" size={22} color={Palette.rose500} />
        )}
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  option: {
    padding: 16,
    paddingHorizontal: 18,
    borderRadius: UI.borderRadius.large,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  letterBadge: {
    ...Typography.labelSmall,
    fontWeight: '800',
    width: 20,
    textAlign: 'center',
  },
  text: { 
    ...Typography.bodyLarge, 
    fontWeight: "500",
    flex: 1,
  },
});
