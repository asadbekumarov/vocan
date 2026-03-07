import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { deleteWord } from "@/storage/wordStorage";
import { Word } from "@/types/Word";
import { MotiView } from "@/utils/moti-wrapper";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function WordCard({
  word,
  onRefresh,
  index = 0,
}: {
  word: Word;
  onRefresh?: () => void;
  index?: number;
}) {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const showUz = !!word.uz;
  const showEn = !!word.en;
  const showRu = !!word.ru;

  const handleDelete = () => {
    Alert.alert(t("deleteWord"), t("areYouSure"), [
      { text: t("no"), style: "cancel" },
      {
        text: t("yes"),
        style: "destructive",
        onPress: async () => {
          await deleteWord(word.id);
          Toast.show({
            type: "success",
            text1: t("deleted"),
            text2: t("wordRemoved"),
          });
          if (onRefresh) onRefresh();
        },
      },
    ]);
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

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 200, delay: index * 50 }}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1C1E1F" : "#fff",
          borderColor: isDark ? "#2A2C2E" : "#f0f0f0",
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.translationsRow}>
          {showEn && (
            <View style={styles.item}>
              <Text style={[styles.label, { color: theme.tint }]}>EN:</Text>
              <Text style={[styles.text, { color: theme.text }]}>
                {word.en}
              </Text>
            </View>
          )}
          {showUz && (
            <View style={styles.item}>
              <Text style={[styles.label, { color: theme.tint }]}>UZ:</Text>
              <Text style={[styles.text, { color: theme.text }]}>
                {word.uz}
              </Text>
            </View>
          )}
          {showRu && !showEn && (
            <View style={styles.item}>
              <Text style={[styles.label, { color: theme.tint }]}>RU:</Text>
              <Text style={[styles.text, { color: theme.text }]}>
                {word.ru}
              </Text>
            </View>
          )}
          {showRu && showEn && !showUz && (
            <View style={styles.item}>
              <Text style={[styles.label, { color: theme.tint }]}>RU:</Text>
              <Text style={[styles.text, { color: theme.text }]}>
                {word.ru}
              </Text>
            </View>
          )}
        </View>

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
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
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
  },
  translationsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
    // spacing between items via margin
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    // assign marginRight on inner elements
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
  },
  text: {
    fontSize: 16,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    marginLeft: 10,
    // spacing via marginRight on buttons
  },
  actionButton: {
    padding: 4,
    marginRight: 12,
  },
});
