import { UI } from "@/constants/theme";
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
  const { theme } = useTheme();
  const showUz = !!word.uz;
  const showEn = !!word.en;
  const showRu = !!word.ru;

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

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 200, delay: index * 50 }}
    >
      <Pressable
        onPress={isMultiSelectMode ? onSelect : undefined}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isSelected ? theme.secondary : theme.card,
            borderColor: isSelected ? theme.tint : theme.border,
            borderWidth: isSelected ? 2 : 1,
            opacity: pressed && isMultiSelectMode ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.content}>
          {isMultiSelectMode && (
            <View style={styles.checkboxContainer}>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isSelected ? theme.tint : "transparent",
                    borderColor: theme.tint,
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </View>
          )}
          <View style={styles.translationsRow}>
            <Text style={[styles.numberBadge, { color: theme.tint }]}>
              {index + 1}.
            </Text>
            {showEn && (
              <View style={styles.item}>
                <Text style={[styles.label, { color: theme.tint }]}>EN: </Text>
                <Text style={[styles.text, { color: theme.text }]}>
                  {word.en}
                </Text>
                {!isMultiSelectMode && (
                  <TouchableOpacity 
                    onPress={() => word.en && speak(word.en, 'en-US')}
                    style={styles.speakButton}
                  >
                    <Ionicons name="volume-medium-outline" size={18} color={theme.tint} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {showUz && (
              <View style={styles.item}>
                <Text style={[styles.label, { color: theme.tint }]}> UZ: </Text>
                <Text style={[styles.text, { color: theme.text }]}>
                  {word.uz}
                </Text>
                {!isMultiSelectMode && (
                  <TouchableOpacity 
                    onPress={() => word.uz && speak(word.uz, 'uz-UZ')} 
                    style={styles.speakButton}
                  >
                    <Ionicons name="volume-medium-outline" size={18} color={theme.tint} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {showRu && (
              <View style={styles.item}>
                <Text style={[styles.label, { color: theme.tint }]}> RU: </Text>
                <Text style={[styles.text, { color: theme.text }]}>
                  {word.ru}
                </Text>
                {!isMultiSelectMode && (
                  <TouchableOpacity 
                    onPress={() => word.ru && speak(word.ru, 'ru-RU')} 
                    style={styles.speakButton}
                  >
                    <Ionicons name="volume-medium-outline" size={18} color={theme.tint} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {!isMultiSelectMode && (
            <View style={styles.actions}>
              <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
                <Ionicons name="pencil-outline" size={20} color={theme.tint} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.actionButton, { marginRight: 0 }]}
              >
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: UI.spacing.md,
    borderRadius: UI.borderRadius.medium,
    marginBottom: UI.spacing.sm,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  translationsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
    gap: UI.spacing.sm,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  numberBadge: {
    fontSize: 16,
    fontWeight: "800",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
  speakButton: {
    padding: 4,
    marginLeft: 2,
  },
  actions: {
    flexDirection: "row",
    marginLeft: UI.spacing.sm,
    gap: 12,
  },
  actionButton: {
    padding: 6,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
