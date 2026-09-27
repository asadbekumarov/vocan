import { Palette, UI, Shadows, Typography, ComponentTokens } from "@/constants/theme";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { deleteWord } from "@/storage/wordStorage";
import { Word } from "@/types/Word";
import { MotiView } from "@/utils/moti-wrapper";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Speech from 'expo-speech';
import { Alert, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

type Mode = 'uz-en' | 'en-uz' | 'uz-ru' | 'ru-uz' | 'en-ru' | 'ru-en';

const MODE_COLORS: Record<Mode, string> = {
  "uz-en": Palette.emerald500,
  "en-uz": '#3B82F6',
  "uz-ru": Palette.amber500,
  "ru-uz": '#8B5CF6',
  "en-ru": '#EC4899',
  "ru-en": '#14B8A6',
};

const MODE_LABELS: Record<Mode, string> = {
  "uz-en": "UZ→EN",
  "en-uz": "EN→UZ",
  "uz-ru": "UZ→RU",
  "ru-uz": "RU→UZ",
  "en-ru": "EN→RU",
  "ru-en": "RU→EN",
};

export default function WordCard({
  word,
  onRefresh,
  index = 0,
  isMultiSelectMode = false,
  isSelected = false,
  onSelect,
}: {
  word: Word;
  onRefresh?: () => void;
  index?: number;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const showUz = !!word.uz;
  const showEn = !!word.en;
  const showRu = !!word.ru;

  const modeColor = MODE_COLORS[word.mode as Mode] ?? theme.tint;
  const modeLabel = MODE_LABELS[word.mode as Mode] ?? word.mode;

  const handleDelete = () => {
    const performDelete = async () => {
      await deleteWord(word.id);
      Toast.show({
        type: "success",
        text1: t("deleted"),
        text2: t("wordRemoved"),
      });
      if (onRefresh) onRefresh();
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(t("areYouSure"));
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(t("deleteWord"), t("areYouSure"), [
        { text: t("no"), style: "cancel" },
        { text: t("yes"), style: "destructive", onPress: performDelete },
      ]);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: "/(tabs)/add-word",
      params: {
        id: word.id,
        uz: word.uz,
        en: word.en,
        ru: word.ru,
        mode: word.mode,
      },
    });
  };

  const speak = (text: string, lang: string) => {
    Speech.speak(text, {
      language: lang,
      pitch: 1.0,
      rate: 0.9,
    });
  };

  // Get primary text for the avatar letter
  const primaryText = word.uz || word.en || word.ru || '?';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 250, delay: Math.min(index * 40, 200) }}
    >
      <Pressable
        onPress={isMultiSelectMode ? onSelect : undefined}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isSelected
              ? (isDark ? 'rgba(99, 102, 241, 0.12)' : Palette.indigo50)
              : theme.card,
            borderColor: isSelected ? theme.tint : theme.border,
            borderWidth: isSelected ? 1.5 : 1,
            transform: [{ scale: pressed && isMultiSelectMode ? 0.98 : 1 }],
          },
          isDark ? Shadows.dark.sm : Shadows.light.sm,
        ]}
      >
        {/* Left side: Avatar + Content */}
        <View style={styles.mainRow}>
          {/* Multi-select checkbox */}
          {isMultiSelectMode && (
            <View style={styles.checkboxContainer}>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isSelected ? theme.tint : 'transparent',
                    borderColor: isSelected ? theme.tint : theme.muted,
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
            </View>
          )}

          {/* Word Avatar */}
          <View style={[styles.avatar, { backgroundColor: modeColor + '15' }]}>
            <Text style={[styles.avatarText, { color: modeColor }]}>
              {primaryText.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Word Content */}
          <View style={styles.contentArea}>
            {/* Mode Badge */}
            <View style={[styles.modeBadge, { backgroundColor: modeColor + '12' }]}>
              <View style={[styles.modeDot, { backgroundColor: modeColor }]} />
              <Text style={[styles.modeBadgeText, { color: modeColor }]}>{modeLabel}</Text>
            </View>

            {/* Translations */}
            <View style={styles.translationsContainer}>
              {showEn && (
                <View style={styles.langRow}>
                  <Text style={[styles.langLabel, { color: theme.tint }]}>EN</Text>
                  <Text style={[styles.wordText, { color: theme.text }]} numberOfLines={1}>
                    {word.en}
                  </Text>
                  {!isMultiSelectMode && (
                    <TouchableOpacity
                      onPress={() => word.en && speak(word.en, 'en-US')}
                      style={[styles.speakBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : Palette.indigo50 }]}
                      hitSlop={UI.hitSlop}
                    >
                      <Ionicons name="volume-medium" size={14} color={theme.tint} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {showUz && (
                <View style={styles.langRow}>
                  <Text style={[styles.langLabel, { color: Palette.emerald500 }]}>UZ</Text>
                  <Text style={[styles.wordText, { color: theme.text }]} numberOfLines={1}>
                    {word.uz}
                  </Text>
                  {!isMultiSelectMode && (
                    <TouchableOpacity
                      onPress={() => word.uz && speak(word.uz, 'uz-UZ')}
                      style={[styles.speakBtn, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : Palette.emerald50 }]}
                      hitSlop={UI.hitSlop}
                    >
                      <Ionicons name="volume-medium" size={14} color={Palette.emerald500} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {showRu && (
                <View style={styles.langRow}>
                  <Text style={[styles.langLabel, { color: Palette.amber500 }]}>RU</Text>
                  <Text style={[styles.wordText, { color: theme.text }]} numberOfLines={1}>
                    {word.ru}
                  </Text>
                  {!isMultiSelectMode && (
                    <TouchableOpacity
                      onPress={() => word.ru && speak(word.ru, 'ru-RU')}
                      style={[styles.speakBtn, { backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : Palette.amber50 }]}
                      hitSlop={UI.hitSlop}
                    >
                      <Ionicons name="volume-medium" size={14} color={Palette.amber500} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action buttons */}
        {!isMultiSelectMode && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleEdit}
              style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : Palette.indigo50 }]}
              hitSlop={UI.hitSlop}
            >
              <Ionicons name="pencil" size={16} color={theme.tint} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : Palette.rose50 }]}
              hitSlop={UI.hitSlop}
            >
              <Ionicons name="trash" size={16} color={Palette.rose500} />
            </TouchableOpacity>
          </View>
        )}
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: UI.borderRadius.xl,
    padding: UI.spacing.md,
    marginBottom: UI.spacing.sm + 2,
    borderWidth: 1,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatar: {
    width: ComponentTokens.avatar.medium,
    height: ComponentTokens.avatar.medium,
    borderRadius: UI.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  contentArea: {
    flex: 1,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: UI.borderRadius.xs,
    gap: 4,
    marginBottom: 8,
  },
  modeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  modeBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  translationsContainer: {
    gap: 6,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langLabel: {
    ...Typography.caption,
    fontWeight: '800',
    width: 22,
    textAlign: 'center',
  },
  wordText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    flex: 1,
  },
  speakBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxContainer: {
    justifyContent: 'center',
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
