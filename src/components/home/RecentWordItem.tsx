import { Palette, Shadows, UI, Typography } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { Word } from "@/types/Word";
import { MotiView } from "@/utils/moti-wrapper";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Mode = "uz-en" | "en-uz" | "uz-ru" | "ru-uz" | "en-ru" | "ru-en";

const MODE_COLORS: Record<Mode, string> = {
  "uz-en": Palette.emerald500,
  "en-uz": "#3B82F6",
  "uz-ru": Palette.amber500,
  "ru-uz": "#8B5CF6",
  "en-ru": "#EC4899",
  "ru-en": "#14B8A6",
};

const MODE_LABELS: Record<Mode, string> = {
  "uz-en": "UZ→EN",
  "en-uz": "EN→UZ",
  "uz-ru": "UZ→RU",
  "ru-uz": "RU→UZ",
  "en-ru": "EN→RU",
  "ru-en": "RU→EN",
};

interface RecentWordItemProps {
  word: Word;
  index: number;
  onPress: () => void;
}

function getWordTexts(word: Word): { primary: string; secondary: string; speakText: string; speakLang: string } {
  const m = word.mode as Mode;
  switch (m) {
    case "uz-en":
      return { primary: word.uz || "–", secondary: word.en || "", speakText: word.en || "", speakLang: "en" };
    case "en-uz":
      return { primary: word.en || "–", secondary: word.uz || "", speakText: word.en || "", speakLang: "en" };
    case "uz-ru":
      return { primary: word.uz || "–", secondary: word.ru || "", speakText: word.ru || "", speakLang: "ru" };
    case "ru-uz":
      return { primary: word.ru || "–", secondary: word.uz || "", speakText: word.ru || "", speakLang: "ru" };
    case "en-ru":
      return { primary: word.en || "–", secondary: word.ru || "", speakText: word.en || "", speakLang: "en" };
    case "ru-en":
      return { primary: word.ru || "–", secondary: word.en || "", speakText: word.en || "", speakLang: "en" };
    default:
      return { primary: word.uz || word.en || word.ru || "–", secondary: "", speakText: word.en || "", speakLang: "en" };
  }
}

export const RecentWordItem = memo(function RecentWordItem({
  word,
  index,
  onPress,
}: RecentWordItemProps) {
  const { theme, isDark } = useTheme();
  const modeColor = MODE_COLORS[word.mode as Mode] ?? theme.tint;
  const modeLabel = MODE_LABELS[word.mode as Mode] ?? word.mode;
  const { primary, secondary, speakText, speakLang } = getWordTexts(word);

  const handleSpeak = (e: any) => {
    e.stopPropagation?.();
    if (speakText) {
      Speech.stop();
      Speech.speak(speakText, { language: speakLang });
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15, scale: 0.96 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{
        type: "spring",
        damping: 18,
        stiffness: 120,
        delay: Math.min(index * 60, 300),
      }}
    >
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
          isDark ? Shadows.dark.xs : Shadows.light.xs,
        ]}
        activeOpacity={0.75}
        onPress={onPress}
      >
        <View style={[styles.avatar, { backgroundColor: modeColor + "14" }]}>
          <Text style={[styles.avatarLetter, { color: modeColor }]}>
            {primary.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.primaryText, { color: theme.text }]} numberOfLines={1}>
            {primary}
          </Text>
          {secondary ? (
            <Text
              style={[styles.secondaryText, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {secondary}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightActions}>
          {speakText ? (
            <TouchableOpacity
              onPress={handleSpeak}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.speakButton,
                { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : Palette.slate100 },
              ]}
            >
              <Ionicons
                name="volume-medium"
                size={16}
                color={isDark ? Palette.slate300 : Palette.slate600}
              />
            </TouchableOpacity>
          ) : null}

          <View style={[styles.badge, { backgroundColor: modeColor + "15" }]}>
            <Text style={[styles.badgeText, { color: modeColor }]}>{modeLabel}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: UI.borderRadius.medium,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: UI.borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    ...Typography.headingSmall,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },
  primaryText: {
    ...Typography.bodyLarge,
    fontWeight: "600",
  },
  secondaryText: {
    ...Typography.bodySmall,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  speakButton: {
    width: 32,
    height: 32,
    borderRadius: UI.borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: UI.borderRadius.pill,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
