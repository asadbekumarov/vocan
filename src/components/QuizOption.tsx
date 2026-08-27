import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/context/ThemeContext";
import { MotiView } from "@/utils/moti-wrapper";
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

  let borderColor = isDark ? "#2A2C2E" : "#eee";
  let bgColor = isDark ? "#111827" : "#fff";

  if (isSelected) borderColor = theme.tint;
  if (isCorrect) {
    borderColor = theme.tint;
    bgColor = isDark ? "#064e3b" : "#f0fdf4";
  }
  if (isWrong) {
    borderColor = "#ff4444";
    bgColor = isDark ? "#450a0a" : "#fff5f5";
  }

  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0, scale: isCorrect ? 1.02 : 1 }}
      transition={{ type: "timing", duration: 250, delay: index * 60 }}
    >
      <TouchableOpacity
        style={[
          styles.option,
          { borderColor, backgroundColor: bgColor, marginBottom: 12 },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text
          style={[
            styles.text,
            { color: theme.text },
            isSelected && { color: theme.tint, fontWeight: "700" },
          ]}
        >
          {text}
        </Text>
        {isCorrect && (
          <IconSymbol
            name="checkmark.circle.fill"
            size={20}
            color={theme.tint}
          />
        )}
        {isWrong && (
          <IconSymbol name="xmark.circle.fill" size={20} color="#ff4444" />
        )}
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  option: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  text: { fontSize: 18, fontWeight: "500" },
});
