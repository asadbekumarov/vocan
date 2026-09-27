import WordCard from "@/components/WordCard";
import { Palette, Shadows, UI, Typography } from "@/constants/theme";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { deleteMultipleWords, getWords } from "@/storage/wordStorage";
import { groupByDate, GroupedWords } from "@/utils/groupByDate";
import { MotiView } from "@/utils/moti-wrapper";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
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
} from "react-native";
import Toast from "react-native-toast-message";

type Mode = "uz-en" | "en-uz" | "uz-ru" | "ru-uz" | "en-ru" | "ru-en";
type FilterMode = "all" | Mode;

const MODES: { id: Mode; label: string; color: string }[] = [
  { id: "uz-en", label: "UZ → EN", color: Palette.emerald500 },
  { id: "en-uz", label: "EN → UZ", color: "#3B82F6" },
  { id: "uz-ru", label: "UZ → RU", color: Palette.amber500 },
  { id: "ru-uz", label: "RU → UZ", color: "#8B5CF6" },
  { id: "en-ru", label: "EN → RU", color: "#EC4899" },
  { id: "ru-en", label: "RU → EN", color: "#14B8A6" },
];

function formatSectionDate(dateStr: string, lang: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (dateStr === today) {
    return lang === "uz" ? "Bugun" : lang === "ru" ? "Сегодня" : "Today";
  }
  if (dateStr === yesterday) {
    return lang === "uz" ? "Kecha" : lang === "ru" ? "Вчера" : "Yesterday";
  }

  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(
      lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US",
      { month: "short", day: "numeric", year: "numeric" },
    );
  } catch {
    return dateStr;
  }
}

export default function MyWordsScreen() {
  const { language, t } = useLanguage();
  const { theme, isDark } = useTheme();

  const [allWords, setAllWords] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterMode>("all");
  const [groupedWords, setGroupedWords] = useState<GroupedWords[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const applyFilters = useCallback(
    (words: any[], filter: FilterMode, query: string) => {
      let filtered = words;

      // Filter by language mode if not "all"
      if (filter !== "all") {
        filtered = filtered.filter((w) => w.mode === filter);
      }

      // Filter by search query
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        filtered = filtered.filter(
          (w) =>
            w.uz?.toLowerCase().includes(q) ||
            w.en?.toLowerCase().includes(q) ||
            w.ru?.toLowerCase().includes(q),
        );
      }

      setGroupedWords(groupByDate(filtered));
    },
    [],
  );

  const loadWords = useCallback(async () => {
    const data = await getWords();
    setAllWords(data);

    // Calculate count per mode + total
    const newCounts: Record<string, number> = { all: data.length };
    MODES.forEach((m) => {
      newCounts[m.id] = data.filter((w) => w.mode === m.id).length;
    });
    setCounts(newCounts);

    applyFilters(data, selectedFilter, searchQuery);
  }, [selectedFilter, searchQuery, applyFilters]);

  useFocusEffect(
    useCallback(() => {
      loadWords();
    }, [loadWords]),
  );

  const handleFilterChange = (filter: FilterMode) => {
    setSelectedFilter(filter);
    setSelectedWordIds(new Set());
    applyFilters(allWords, filter, searchQuery);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(allWords, selectedFilter, text);
  };

  const toggleWordSelection = (wordId: string) => {
    const next = new Set(selectedWordIds);
    if (next.has(wordId)) {
      next.delete(wordId);
    } else {
      next.add(wordId);
    }
    setSelectedWordIds(next);
  };

  const selectAllVisibleWords = () => {
    const allIds = new Set<string>();
    groupedWords.forEach((section) => {
      section.data.forEach((w) => allIds.add(w.id));
    });
    setSelectedWordIds(allIds);
  };

  const deselectAllWords = () => {
    setSelectedWordIds(new Set());
  };

  const deleteSelectedWords = async () => {
    if (selectedWordIds.size === 0) return;

    const performDelete = async () => {
      try {
        await deleteMultipleWords(Array.from(selectedWordIds));
        Toast.show({
          type: "success",
          text1: t("deleted") || "O'chirildi",
          text2: `${selectedWordIds.size} ta so'z o'chirildi`,
        });
        setSelectedWordIds(new Set());
        setIsMultiSelectMode(false);
        await loadWords();
      } catch {
        Toast.show({
          type: "error",
          text1: t("error") || "Xatolik",
          text2: "So'zlarni o'chirishda xatolik",
        });
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `${t("areYouSure") || "Ishonchingiz komilmi?"} (${selectedWordIds.size} so'z o'chiriladi)`,
      );
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        t("deleteWord") || "So'zlarni o'chirish",
        `${t("areYouSure") || "Ishonchingiz komilmi?"} (${selectedWordIds.size} so'z o'chiriladi)`,
        [
          { text: t("no") || "Yo'q", style: "cancel" },
          { text: t("yes") || "Ha", style: "destructive", onPress: performDelete },
        ],
      );
    }
  };

  const totalVisibleWords = groupedWords.reduce((acc, curr) => acc + curr.data.length, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.contentWrapper}>
        {/* ── 1. HEADER (Title & Multi-select Toggle) ── */}
        <MotiView
          from={{ opacity: 0, translateY: -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 350 }}
          style={styles.header}
        >
          <View>
            <Text style={[styles.title, { color: theme.text }]}>
              {t("vocabulary") || "Mening lug'atim"}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {totalVisibleWords} {t("words") || "ta so'z mavjud"}
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={[
                styles.multiSelectBtn,
                {
                  backgroundColor: isMultiSelectMode
                    ? theme.tint
                    : isDark
                    ? "rgba(99,102,241,0.12)"
                    : Palette.indigo50,
                },
              ]}
              onPress={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                setSelectedWordIds(new Set());
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={isMultiSelectMode ? "checkmark-done" : "checkbox-outline"}
                size={18}
                color={isMultiSelectMode ? "#fff" : theme.tint}
              />
              <Text
                style={[
                  styles.multiSelectBtnText,
                  { color: isMultiSelectMode ? "#fff" : theme.tint },
                ]}
              >
                {isMultiSelectMode ? "Tayyor" : "Tanlash"}
              </Text>
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* ── 2. SEARCH BAR ── */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={theme.muted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Lug'atdan qidirish..."
              placeholderTextColor={theme.muted}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch("")}>
                <Ionicons name="close-circle" size={18} color={theme.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── 3. FILTER PILL BAR (Horizontal Carousel) ── */}
        <View style={styles.filterStripWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterStrip}
          >
            {/* All Words Pill */}
            <TouchableOpacity
              onPress={() => handleFilterChange("all")}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    selectedFilter === "all"
                      ? isDark
                        ? "rgba(99,102,241,0.25)"
                        : Palette.indigo50
                      : theme.card,
                  borderColor: selectedFilter === "all" ? theme.tint : theme.border,
                  borderWidth: selectedFilter === "all" ? 1.5 : 1,
                },
                selectedFilter === "all" && (isDark ? Shadows.dark.xs : Shadows.light.xs),
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterPillLabel,
                  {
                    color: selectedFilter === "all" ? theme.tint : theme.textSecondary,
                    fontWeight: selectedFilter === "all" ? "700" : "500",
                  },
                ]}
              >
                Barchasi
              </Text>
              <View
                style={[
                  styles.filterCountBadge,
                  {
                    backgroundColor:
                      selectedFilter === "all" ? theme.tint + "20" : theme.surfaceSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    {
                      color: selectedFilter === "all" ? theme.tint : theme.textTertiary,
                    },
                  ]}
                >
                  {counts["all"] || 0}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Individual Language Mode Pills */}
            {MODES.map((m) => {
              const isSelected = selectedFilter === m.id;
              const count = counts[m.id] || 0;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => handleFilterChange(m.id)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? m.color + "22"
                          : m.color + "12"
                        : theme.card,
                      borderColor: isSelected ? m.color : theme.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                    isSelected && (isDark ? Shadows.dark.xs : Shadows.light.xs),
                  ]}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.filterPillDot,
                      { backgroundColor: isSelected ? m.color : theme.muted },
                    ]}
                  />
                  <Text
                    style={[
                      styles.filterPillLabel,
                      {
                        color: isSelected
                          ? isDark
                            ? "#fff"
                            : m.color
                          : theme.textSecondary,
                        fontWeight: isSelected ? "700" : "500",
                      },
                    ]}
                  >
                    {m.label}
                  </Text>
                  <View
                    style={[
                      styles.filterCountBadge,
                      {
                        backgroundColor: isSelected ? m.color + "22" : theme.surfaceSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        {
                          color: isSelected ? m.color : theme.textTertiary,
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 4. MULTI-SELECT FLOATING ACTION BAR ── */}
        {isMultiSelectMode && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 18 }}
            style={[
              styles.multiSelectActionBar,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
              isDark ? Shadows.dark.md : Shadows.light.md,
            ]}
          >
            <View style={styles.selectionInfo}>
              <Text style={[styles.selectionCount, { color: theme.text }]}>
                {selectedWordIds.size} ta tanlandi
              </Text>
            </View>

            <View style={styles.selectionButtons}>
              <TouchableOpacity
                onPress={selectAllVisibleWords}
                style={[
                  styles.selectActionSmallBtn,
                  { backgroundColor: isDark ? "rgba(99,102,241,0.12)" : Palette.indigo50 },
                ]}
              >
                <Text style={{ color: theme.tint, ...Typography.labelSmall }}>
                  Barchasini tanlash
                </Text>
              </TouchableOpacity>

              {selectedWordIds.size > 0 && (
                <TouchableOpacity
                  onPress={deselectAllWords}
                  style={[styles.selectActionSmallBtn, { backgroundColor: theme.surfaceSubtle }]}
                >
                  <Text style={{ color: theme.textSecondary, ...Typography.labelSmall }}>
                    Bekor qilish
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={deleteSelectedWords}
                disabled={selectedWordIds.size === 0}
                style={[
                  styles.deleteSelectedBtn,
                  {
                    backgroundColor:
                      selectedWordIds.size > 0 ? Palette.rose500 : theme.surfaceSubtle,
                    opacity: selectedWordIds.size > 0 ? 1 : 0.6,
                  },
                ]}
              >
                <Ionicons name="trash" size={16} color="#fff" />
                <Text style={styles.deleteSelectedBtnText}>O'chirish</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        )}

        {/* ── 5. WORD LIST (SECTION LIST) ── */}
        <SectionList
          sections={groupedWords}
          keyExtractor={(item) => item.id}
          extraData={{ selectedWordIds, isMultiSelectMode }}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Platform.OS === "web" ? 120 : isMultiSelectMode ? 100 : 40 },
          ]}
          renderSectionHeader={({ section: { title, data } }) => (
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionDatePill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="calendar-outline" size={13} color={theme.textTertiary} />
                <Text style={[styles.sectionDateText, { color: theme.textSecondary }]}>
                  {formatSectionDate(title, language)}
                </Text>
              </View>
              <Text style={[styles.sectionWordsCount, { color: theme.textTertiary }]}>
                {data.length} {t("words") || "so'z"}
              </Text>
            </View>
          )}
          renderItem={({ item, index }) => (
            <WordCard
              word={item}
              index={index}
              onRefresh={loadWords}
              isMultiSelectMode={isMultiSelectMode}
              isSelected={selectedWordIds.has(item.id)}
              onSelect={() => toggleWordSelection(item.id)}
            />
          )}
          ListEmptyComponent={
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "timing", duration: 350 }}
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
                isDark ? Shadows.dark.sm : Shadows.light.sm,
              ]}
            >
              <View
                style={[
                  styles.emptyStateIconBox,
                  { backgroundColor: isDark ? "rgba(99,102,241,0.12)" : Palette.indigo50 },
                ]}
              >
                <Ionicons name="library-outline" size={36} color={theme.tint} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                {searchQuery ? "So'z topilmadi" : "Lug'at bo'sh"}
              </Text>
              <Text style={[styles.emptyStateSub, { color: theme.textSecondary }]}>
                {searchQuery
                  ? `"${searchQuery}" bo'yicha hech qanday natija chiqmadi`
                  : "Bu toifaga hali so'zlar kiritilmagan. Yangi so'z qo'shishni boshlang!"}
              </Text>
              <TouchableOpacity
                style={[styles.addFirstBtn, { backgroundColor: theme.tint }]}
                onPress={() => router.push("/(tabs)/add-word")}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addFirstBtnText}>
                  {t("addWord") || "So'z qo'shish"}
                </Text>
              </TouchableOpacity>
            </MotiView>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: UI.maxContentWidth,
    flex: 1,
    paddingHorizontal: UI.padding,
    paddingTop: Platform.OS === "web" ? 36 : 56,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    ...Typography.headingLarge,
    fontWeight: "800",
  },
  subtitle: {
    ...Typography.bodyMedium,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  multiSelectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: UI.borderRadius.pill,
  },
  multiSelectBtnText: {
    ...Typography.labelSmall,
    fontWeight: "700",
  },

  // Search
  searchSection: {
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: UI.borderRadius.large,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    ...Typography.bodyMedium,
  },

  // Filter Strip
  filterStripWrapper: {
    marginBottom: 16,
  },
  filterStrip: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: UI.borderRadius.large,
    gap: 8,
  },
  filterPillDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  filterPillLabel: {
    ...Typography.labelSmall,
  },
  filterCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: UI.borderRadius.pill,
  },
  filterCountText: {
    ...Typography.caption,
    fontWeight: "800",
  },

  // Multi-select Action Bar
  multiSelectActionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: UI.borderRadius.large,
    borderWidth: 1,
    marginBottom: 14,
    gap: 10,
  },
  selectionInfo: {
    paddingLeft: 4,
  },
  selectionCount: {
    ...Typography.labelMedium,
    fontWeight: "700",
  },
  selectionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectActionSmallBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: UI.borderRadius.small,
  },
  deleteSelectedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: UI.borderRadius.small,
  },
  deleteSelectedBtnText: {
    color: "#fff",
    ...Typography.labelSmall,
    fontWeight: "700",
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 10,
  },
  sectionDatePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: UI.borderRadius.pill,
    borderWidth: 1,
  },
  sectionDateText: {
    ...Typography.caption,
    fontWeight: "700",
  },
  sectionWordsCount: {
    ...Typography.caption,
    fontWeight: "500",
  },

  // List Content
  listContent: {
    flexGrow: 1,
  },

  // Empty State
  emptyStateCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: UI.borderRadius.xl,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyStateIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    ...Typography.headingMedium,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyStateSub: {
    ...Typography.bodyMedium,
    textAlign: "center",
    marginBottom: 20,
    maxWidth: 280,
  },
  addFirstBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: UI.borderRadius.medium,
  },
  addFirstBtnText: {
    color: "#fff",
    ...Typography.labelMedium,
    fontWeight: "700",
  },
});
