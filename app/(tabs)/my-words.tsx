import { IconSymbol } from "@/components/ui/icon-symbol";
import WordCard from "@/components/WordCard";
import { UI } from "@/constants/theme";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { deleteMultipleWords, getWords } from "@/storage/wordStorage";
import { groupByDate, GroupedWords } from "@/utils/groupByDate";
import { MotiView } from "@/utils/moti-wrapper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Platform,
    Alert,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from "react-native";
import Toast from "react-native-toast-message";

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
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  
  const numColumns = width > 768 ? 3 : width > 350 ? 2 : 1;
  const availableWidth = width > 900 ? 900 - (UI.padding * 2) : width - (UI.padding * 2);
  const cardWidth = (availableWidth - (16 * (numColumns - 1))) / numColumns;

  const [step, setStep] = useState<"selection" | "list">("selection");
  const [selectedMode, setSelectedMode] = useState<Mode>("uz-en");
  const [groupedWords, setGroupedWords] = useState<GroupedWords[]>([]);
  const [counts, setCounts] = useState<Partial<Record<Mode, number>>>({});
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const loadWords = useCallback(async (query: string = searchQuery) => {
    const data = await getWords();

    const newCounts: Partial<Record<Mode, number>> = {};
    MODES.forEach((m) => {
      newCounts[m.id] = data.filter((w) => w.mode === m.id).length;
    });
    setCounts(newCounts);

    const filteredByMode = data.filter((w) => w.mode === selectedMode);
    
    // Apply search filter if query exists
    const filteredBySearch = query.trim() 
      ? filteredByMode.filter(w => 
          w.uz?.toLowerCase().includes(query.toLowerCase()) ||
          w.en?.toLowerCase().includes(query.toLowerCase()) || 
          w.ru?.toLowerCase().includes(query.toLowerCase())
        )
      : filteredByMode;

    const grouped = groupByDate(filteredBySearch);
    setGroupedWords(grouped);
  }, [selectedMode, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadWords();
    }, [loadWords]),
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    loadWords(text);
  };

  const selectMode = (mode: Mode) => {
    setSelectedMode(mode);
    setStep("list");
    setIsMultiSelectMode(false);
    setSelectedWordIds(new Set());
    setSearchQuery(""); // Clear search when switching mode
  };

  const toggleWordSelection = (wordId: string) => {
    const newSelected = new Set(selectedWordIds);
    if (newSelected.has(wordId)) {
      newSelected.delete(wordId);
    } else {
      newSelected.add(wordId);
    }
    setSelectedWordIds(newSelected);
  };

  const deleteSelectedWords = async () => {
    if (selectedWordIds.size === 0) return;

    const performDelete = async () => {
      try {
        await deleteMultipleWords(Array.from(selectedWordIds));
        Toast.show({
          type: "success",
          text1: t("deleted"),
          text2: `${selectedWordIds.size} ta so'z o'chirildi`,
        });
        setSelectedWordIds(new Set());
        setIsMultiSelectMode(false);
        await loadWords();
      } catch {
        Toast.show({
          type: "error",
          text1: "Xato",
          text2: "So'zlarni o'chirishda xatolik",
        });
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(`${t("areYouSure")} (${selectedWordIds.size} so'z o'chiriladi)`);
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        t("deleteWord"),
        `${t("areYouSure")} (${selectedWordIds.size} so'z o'chiriladi)`,
        [
          { text: t("no"), style: "cancel" },
          {
            text: t("yes"),
            style: "destructive",
            onPress: performDelete,
          },
        ],
      );
    }
  };

  const selectAllWords = () => {
    const allIds = new Set<string>();
    groupedWords.forEach((section) => {
      section.data.forEach((word) => {
        allIds.add(word.id);
      });
    });
    setSelectedWordIds(allIds);
  };

  const deselectAllWords = () => {
    setSelectedWordIds(new Set());
  };

  if (step === "selection") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{ width: "100%", maxWidth: 900, padding: UI.padding, paddingTop: 60, paddingBottom: Platform.OS === "web" ? 120 : 40, alignSelf: "center" }}
          showsVerticalScrollIndicator={false}
        >
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
                style={{ width: cardWidth }}
              >
                <TouchableOpacity
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => selectMode(m.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.cardIconContainer,
                      { backgroundColor: theme.secondary },
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
                        backgroundColor: theme.secondary,
                        borderColor: theme.border,
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
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.contentWrapper}>
        <MotiView
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: 200 }}
        >
          <View style={styles.headerControls}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setStep("selection");
                setIsMultiSelectMode(false);
                setSelectedWordIds(new Set());
              }}
            >
              <Ionicons name="arrow-back" size={22} color={theme.tint} />
            </TouchableOpacity>
            <View style={styles.headerButtonsRow}>
              {isMultiSelectMode && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.headerButton,
                      {
                        backgroundColor: theme.secondary,
                        flexDirection: "row",
                        width: "auto",
                        paddingHorizontal: 12,
                        gap: 6
                      },
                    ]}
                    onPress={selectAllWords}
                  >
                    <Ionicons
                      name="checkbox-outline"
                      size={18}
                      color={theme.tint}
                    />
                    {Platform.OS === 'web' && <Text style={{color: theme.tint, fontSize: 14, fontWeight: '600'}}>{t('selectAll') || 'Barchasi'}</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.headerButton,
                      {
                        backgroundColor: theme.secondary,
                        flexDirection: "row",
                        width: "auto",
                        paddingHorizontal: 12,
                        gap: 6
                      },
                    ]}
                    onPress={deselectAllWords}
                  >
                    <Ionicons
                      name="square-outline"
                      size={18}
                      color={theme.muted}
                    />
                    {Platform.OS === 'web' && <Text style={{color: theme.muted, fontSize: 14, fontWeight: '600'}}>{t('clear') || 'Tozalash'}</Text>}
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  {
                    backgroundColor: isMultiSelectMode
                      ? theme.tint
                      : theme.secondary,
                  },
                ]}
                onPress={() => {
                  setIsMultiSelectMode(!isMultiSelectMode);
                  setSelectedWordIds(new Set());
                }}
              >
                <Ionicons
                  name={isMultiSelectMode ? "checkmark-done" : "checkmark"}
                  size={18}
                  color={
                    isMultiSelectMode ? "#fff" : theme.text
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
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
            {isMultiSelectMode
              ? `${selectedWordIds.size} ta tanlandi`
              : t("savedWords")}
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 250, delay: 100 }}
          style={styles.searchContainer}
        >
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons name="search" size={20} color={theme.muted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Qidirish..."
              placeholderTextColor={theme.muted}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch("")}>
                <Ionicons name="close-circle" size={20} color={theme.muted} />
              </TouchableOpacity>
            )}
          </View>
        </MotiView>

        <SectionList
          sections={groupedWords}
          keyExtractor={(item) => item.id}
          extraData={{ selectedWordIds, isMultiSelectMode }}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : (isMultiSelectMode ? 100 : 40) }}
          renderItem={({ item, index }) => (
            <WordCard
              word={item}
              onRefresh={loadWords}
              index={index}
              isMultiSelectMode={isMultiSelectMode}
              isSelected={selectedWordIds.has(item.id)}
              onSelect={() => toggleWordSelection(item.id)}
            />
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
                  { backgroundColor: theme.border },
                ]}
              />
            </MotiView>
          )}
          ListEmptyComponent={
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 250, delay: 150 }}
              style={styles.emptyContainer}
            >
              <Ionicons 
                name={searchQuery ? "search-outline" : "document-text-outline"} 
                size={48} 
                color={theme.muted} 
              />
              <Text
                style={[styles.emptyText, { color: theme.muted }]}
              >
                {searchQuery 
                  ? `"${searchQuery}" ga mos so'z topilmadi`
                  : t("noWords")}
              </Text>
            </MotiView>
          }
        />
      </View>

      {isMultiSelectMode && selectedWordIds.size > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 200 }}
          style={[
            styles.deleteButtonContainer,
            { backgroundColor: theme.card, borderTopColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: "#ff4444" }]}
            onPress={deleteSelectedWords}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>
              {selectedWordIds.size} ta o&apos;chirish
            </Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
}

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center", // Center for web
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 900, // Max width for large screens
    padding: UI.padding,
    paddingTop: 60,
    flex: 1,
  },
  title: { fontSize: 32, fontWeight: "800" },
  subtitle: { fontSize: 16, marginBottom: UI.spacing.lg },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    width: "100%", 
    borderRadius: UI.borderRadius.large,
    padding: UI.padding * 1.5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: UI.spacing.sm,
  },
  cardLabel: {
    fontSize: 20,
    fontWeight: "700",
  },
  cardLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: UI.spacing.xs,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: UI.borderRadius.small,
    borderWidth: 1,
    marginTop: UI.spacing.xs,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  headerContainer: {
    marginTop: UI.spacing.lg,
    marginBottom: UI.spacing.sm,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerLine: {
    height: 1,
    width: "100%",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: UI.spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: UI.borderRadius.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: UI.padding,
    borderTopWidth: 1,
    alignItems: "center", // Center for web
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: UI.borderRadius.medium,
    gap: 8,
    width: "100%",
    maxWidth: 400, // Prevent too wide button
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  searchContainer: {
    marginBottom: UI.spacing.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: UI.spacing.md,
    height: 50,
    borderRadius: UI.borderRadius.medium,
    borderWidth: 1,
    gap: UI.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
});
