import { IconSymbol } from "@/components/ui/icon-symbol";
import WordCard from "@/components/WordCard";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { getWords } from "@/storage/wordStorage";
import { groupByDate, GroupedWords } from "@/utils/groupByDate";
import { MotiView } from "@/utils/moti-wrapper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Mode = "uz-en" | "en-uz" | "uz-ru" | "ru-uz" | "en-ru" | "ru-en";

const MODES: { id: Mode; from: string; to: string }[] = [
  { id: "uz-en", from: "UZ", to: "EN" },
  { id: "uz-ru", from: "UZ", to: "RU" },
  { id: "en-uz", from: "EN", to: "UZ" },
  { id: "en-ru", from: "EN", to: "RU" },
  { id: "ru-uz", from: "RU", to: "UZ" },
  { id: "ru-en", from: "RU", to: "EN" },
];

export default function MyWordsScreen() {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const [step, setStep] = useState<"selection" | "list">("selection");
  const [selectedMode, setSelectedMode] = useState<Mode>("uz-en");
  const [groupedWords, setGroupedWords] = useState<GroupedWords[]>([]);
  const [counts, setCounts] = useState<Partial<Record<Mode, number>>>({});

  const loadWords = useCallback(async () => {
    const data = await getWords();

    const newCounts: Partial<Record<Mode, number>> = {};
    MODES.forEach((m) => {
      newCounts[m.id] = data.filter((w) => w.mode === m.id).length;
    });
    setCounts(newCounts);

    const filtered = data.filter((w) => w.mode === selectedMode);
    const grouped = groupByDate(filtered);
    setGroupedWords(grouped);
  }, [selectedMode]);

  useFocusEffect(
    useCallback(() => {
      loadWords();
    }, [loadWords]),
  );

  const selectMode = (mode: Mode) => {
    setSelectedMode(mode);
    setStep("list");
  };

  if (step === "selection") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 250 }}
        >
          <Text style={[styles.title, { color: theme.text }]}>
            {t("vocabulary")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
            {t("selectCategory")}
          </Text>
        </MotiView>

        <View style={styles.grid}>
          {MODES.map((m, index) => (
            <MotiView
              key={m.id}
              from={{ opacity: 0, scale: 0.9, translateY: 15 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 200, delay: index * 60 }}
              style={{ width: "47%" }}
            >
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? "#1C1E1F" : "#FFFFFF",
                    borderColor: isDark ? "#2A2C2E" : "#eee",
                  },
                ]}
                onPress={() => selectMode(m.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.cardIconContainer,
                    { backgroundColor: isDark ? "#2A2C2E" : "#f0fdf4" },
                  ]}
                >
                  <IconSymbol name="language" size={32} color={theme.tint} />
                </View>
                <View style={styles.cardLabelContainer}>
                  <Text style={[styles.cardLabel, { color: theme.text }]}>
                    {m.from}
                  </Text>
                  <IconSymbol name="arrow.right" size={14} color={theme.tint} />
                  <Text style={[styles.cardLabel, { color: theme.text }]}>
                    {m.to}
                  </Text>
                </View>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isDark ? "#2A2C2E" : "#f0fdf4",
                      borderColor: isDark ? "#333" : "#dcfce7",
                    },
                  ]}
                >
                  <Text style={[styles.countText, { color: theme.tint }]}>
                    {counts[m.id] || 0} {t("words")}
                  </Text>
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MotiView
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: "timing", duration: 200 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep("selection")}
        >
          <Ionicons name="arrow-back" size={22} color={theme.tint} />
        </TouchableOpacity>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 250 }}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          {selectedMode.toUpperCase()}
        </Text>
        <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
          {t("savedWords")}
        </Text>
      </MotiView>

      <SectionList
        sections={groupedWords}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <WordCard word={item} onRefresh={loadWords} index={index} />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <MotiView
            from={{ opacity: 0, translateX: -15 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: 300 }}
            style={styles.headerContainer}
          >
            <Text style={[styles.sectionHeader, { color: theme.tint }]}>
              {title}
            </Text>
            <View
              style={[
                styles.headerLine,
                { backgroundColor: isDark ? "#2A2C2E" : "#eee" },
              ]}
            />
          </MotiView>
        )}
        ListEmptyComponent={
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 250, delay: 150 }}
          >
            <Text
              style={[styles.emptyText, { color: isDark ? "#9BA1A6" : "#999" }]}
            >
              {t("noWords")}
            </Text>
          </MotiView>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: "800" },
  subtitle: { fontSize: 16, marginBottom: 30 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    // horizontal spacing handled by space-between
  },
  card: {
    width: "100%", // two cards per row
    marginBottom: 15,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 4,
  },
  cardLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    // margin added on cardLabel text
    justifyContent: "space-between",
  },
  countBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  countText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginLeft: -5,
  },
  backText: {
    fontSize: 18,
    color: "#16a34a",
    fontWeight: "600",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    // spacing via marginRight on child
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#16a34a",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#eee",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
    fontSize: 16,
  },
});
