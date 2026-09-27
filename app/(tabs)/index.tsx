import { Palette, Shadows, UI, Typography } from "@/constants/theme";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { getWords } from "@/storage/wordStorage";
import { getGamificationData, logActivity, GamificationData } from "@/storage/gamificationStorage";
import { Word } from "@/types/Word";
import { MotiView } from "@/utils/moti-wrapper";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import StreakCard from "@/components/home/StreakCard";
import StatBadge from "@/components/home/StatBadge";
import QuickAction from "@/components/home/QuickAction";
import { RecentWordItem } from "@/components/home/RecentWordItem";

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

function getGreeting(lang: string): string {
  const hour = new Date().getHours();
  if (lang === "uz") {
    if (hour < 12) return "Xayrli tong ☀️";
    if (hour < 17) return "Xayrli kun 🌤";
    if (hour < 21) return "Xayrli oqshom 🌅";
    return "Xayrli tun 🌙";
  } else if (lang === "ru") {
    if (hour < 12) return "Доброе утро ☀️";
    if (hour < 17) return "Добрый день 🌤";
    if (hour < 21) return "Добрый вечер 🌅";
    return "Доброй ночи 🌙";
  } else {
    if (hour < 12) return "Good morning ☀️";
    if (hour < 17) return "Good afternoon 🌤";
    if (hour < 21) return "Good evening 🌅";
    return "Good night 🌙";
  }
}

function getFormattedDate(lang: string): string {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" };
  try {
    return date.toLocaleDateString(
      lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US",
      options
    );
  } catch (e) {
    return date.toDateString();
  }
}

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { language, t } = useLanguage();

  const [words, setWords] = useState<Word[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [modeCounts, setModeCounts] = useState<Partial<Record<Mode, number>>>({});
  const [gamification, setGamification] = useState<GamificationData | null>(null);

  const loadData = useCallback(async () => {
    const data = await getWords();
    setWords(data);

    const today = new Date().toISOString().split("T")[0];
    setTodayCount(data.filter((w) => w.date?.startsWith(today)).length);

    const counts: Partial<Record<Mode, number>> = {};
    (["uz-en", "en-uz", "uz-ru", "ru-uz", "en-ru", "ru-en"] as Mode[]).forEach((m) => {
      counts[m] = data.filter((w) => w.mode === m).length;
    });
    setModeCounts(counts);

    const gData = await logActivity();
    setGamification(gData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const recentWords = [...words]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const greeting = getGreeting(language);
  const dateStr = getFormattedDate(language);
  const activeCategories = Object.values(modeCounts).filter((v) => (v ?? 0) > 0).length;

  const translations = {
    uz: {
      total: "Jami so'zlar",
      today: "Bugun",
      categories: "Tillar",
      actions: "Tezkor amallar",
      addWord: "So'z qo'shish",
      addWordSub: "Yangi so'z yoki ibora",
      practice: "Mashq qilish",
      practiceSub: "Test & SRS orqali",
      explore: "Lug'at",
      exploreSub: "Barcha kartochkalar",
      pairs: "Til juftliklari",
      recent: "Oxirgi qo'shilganlar",
      all: "Barchasi",
      noWordsTitle: "Lug'atingiz hali bo'sh",
      noWordsSub: "O'rganishni boshlash uchun ilk so'zingizni qo'shing",
      addFirst: "Birinchi so'zni qo'shish",
      dailyGoal: "KUNLIK MAQSAD",
      streak: "kunlik streak",
      words: "so'z",
      maxStreak: "Rekord",
    },
    en: {
      total: "Total Words",
      today: "Today",
      categories: "Languages",
      actions: "Quick Actions",
      addWord: "Add Word",
      addWordSub: "New vocabulary",
      practice: "Practice",
      practiceSub: "Quiz & SRS review",
      explore: "My Words",
      exploreSub: "All vocabulary cards",
      pairs: "Language Pairs",
      recent: "Recently Added",
      all: "View All",
      noWordsTitle: "Your vocabulary is empty",
      noWordsSub: "Add your very first word to kickstart your journey",
      addFirst: "Add First Word",
      dailyGoal: "DAILY GOAL",
      streak: "day streak",
      words: "words",
      maxStreak: "Record",
    },
    ru: {
      total: "Всего слов",
      today: "Сегодня",
      categories: "Языки",
      actions: "Быстрые действия",
      addWord: "Добавить слово",
      addWordSub: "Новое слово или фраза",
      practice: "Практика",
      practiceSub: "Викторина и SRS",
      explore: "Мои слова",
      exploreSub: "Все карточки слов",
      pairs: "Языковые пары",
      recent: "Недавно добавленные",
      all: "Все",
      noWordsTitle: "Ваш словарь пуст",
      noWordsSub: "Добавьте первое слово, чтобы начать обучение",
      addFirst: "Добавить первое слово",
      dailyGoal: "ДНЕВНАЯ ЦЕЛЬ",
      streak: "дней подряд",
      words: "слов",
      maxStreak: "Рекорд",
    },
  };

  const text = translations[language as keyof typeof translations] || translations.en;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.contentWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── 1. HEADER (Greeting & Date) ── */}
          <MotiView
            from={{ opacity: 0, translateY: -16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
            style={styles.header}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                {dateStr.toUpperCase()}
              </Text>
              <Text style={[styles.greeting, { color: theme.text }]}>{greeting}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : Palette.indigo50 },
              ]}
              onPress={() => router.push("/(tabs)/about-app")}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={20} color={theme.tint} />
            </TouchableOpacity>
          </MotiView>

          {/* ── 2. HERO: MOTIVATIONAL STREAK CARD ── */}
          <View style={styles.heroSection}>
            <StreakCard
              gamification={gamification}
              todayCount={todayCount}
              labels={{
                dailyGoal: text.dailyGoal,
                streak: text.streak,
                words: text.words,
                maxStreak: text.maxStreak,
              }}
            />
          </View>

          {/* ── 3. STAT BADGES ROW (Balanced visual weight) ── */}
          <View style={styles.statsRow}>
            <StatBadge
              icon="book"
              value={words.length}
              label={text.total}
              color={theme.tint}
              index={0}
            />
            <StatBadge
              icon="flash"
              value={`+${todayCount}`}
              label={text.today}
              color={Palette.amber500}
              index={1}
            />
            <StatBadge
              icon="globe"
              value={activeCategories}
              label={text.categories}
              color={Palette.emerald500}
              index={2}
            />
          </View>

          {/* ── 4. QUICK ACTIONS ROW (With Spring Feedback) ── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {text.actions}
            </Text>
          </View>

          <View style={styles.actionsGrid}>
            <QuickAction
              title={text.addWord}
              subtitle={text.addWordSub}
              icon="add"
              color={Palette.emerald500}
              bgColor={isDark ? "rgba(16, 185, 129, 0.15)" : Palette.emerald50}
              onPress={() => router.push("/(tabs)/add-word")}
            />
            <QuickAction
              title={text.practice}
              subtitle={text.practiceSub}
              icon="play"
              color={theme.tint}
              highlight
              onPress={() => router.push("/(tabs)/quiz")}
            />
          </View>

          {/* ── 5. LANGUAGE PAIRS STRIP ── */}
          {words.length > 0 && (
            <View style={styles.languagesSection}>
              <View style={styles.subSectionHeader}>
                <Text style={[styles.subSectionTitle, { color: theme.textSecondary }]}>
                  {text.pairs}
                </Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/my-words")}>
                  <Text style={[styles.seeAllText, { color: theme.tint }]}>
                    {text.all}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.languagesScroll}
              >
                {(Object.entries(MODE_LABELS) as [Mode, string][]).map(([mode, label]) => {
                  const count = modeCounts[mode] ?? 0;
                  if (count === 0) return null;
                  const color = MODE_COLORS[mode];
                  return (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.langChip,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        },
                        isDark ? Shadows.dark.xs : Shadows.light.xs,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => router.push("/(tabs)/my-words")}
                    >
                      <View style={[styles.langChipDot, { backgroundColor: color }]} />
                      <Text style={[styles.langChipLabel, { color: theme.text }]}>
                        {label}
                      </Text>
                      <View style={[styles.langChipBadge, { backgroundColor: color + "18" }]}>
                        <Text style={[styles.langChipCount, { color }]}>{count}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ── 6. RECENT WORDS SECTION ── */}
          {recentWords.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {text.recent}
                </Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/my-words")}>
                  <Text style={[styles.seeAllText, { color: theme.tint }]}>
                    {text.all}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.recentList}>
                {recentWords.map((word, index) => (
                  <RecentWordItem
                    key={word.id}
                    word={word}
                    index={index}
                    onPress={() => router.push("/(tabs)/my-words")}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── 7. EMPTY STATE (First-time user) ── */}
          {words.length === 0 && (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "timing", duration: 400, delay: 200 }}
              style={styles.emptyWrapper}
            >
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                  isDark ? Shadows.dark.sm : Shadows.light.sm,
                ]}
              >
                <View
                  style={[
                    styles.emptyIconBox,
                    {
                      backgroundColor: isDark
                        ? "rgba(99, 102, 241, 0.15)"
                        : Palette.indigo50,
                    },
                  ]}
                >
                  <Ionicons name="sparkles" size={36} color={theme.tint} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  {text.noWordsTitle}
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  {text.noWordsSub}
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: theme.tint }]}
                  onPress={() => router.push("/(tabs)/add-word")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>{text.addFirst}</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          )}
        </ScrollView>
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
  },
  scrollContent: {
    padding: UI.padding,
    paddingTop: Platform.OS === "web" ? 36 : 56,
    paddingBottom: Platform.OS === "web" ? 110 : 36,
  },

  // 1. Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dateText: {
    ...Typography.overline,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  greeting: {
    ...Typography.headingLarge,
    fontWeight: "800",
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: UI.borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  // 2. Hero Section
  heroSection: {
    marginBottom: 16,
  },

  // 3. Stats Row
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },

  // 4. Quick Actions
  actionsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...Typography.headingSmall,
    fontWeight: "700",
  },
  seeAllText: {
    ...Typography.labelMedium,
    fontWeight: "600",
  },

  // 5. Languages Strip
  languagesSection: {
    marginBottom: 24,
  },
  subSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  subSectionTitle: {
    ...Typography.overline,
    letterSpacing: 1,
  },
  languagesScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  langChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: UI.borderRadius.medium,
    borderWidth: 1,
    gap: 8,
  },
  langChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  langChipLabel: {
    ...Typography.labelSmall,
    fontWeight: "700",
  },
  langChipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: UI.borderRadius.pill,
  },
  langChipCount: {
    ...Typography.caption,
    fontWeight: "800",
  },

  // 6. Recent Words
  recentSection: {
    marginBottom: 20,
  },
  recentList: {
    gap: 8,
  },

  // 7. Empty State
  emptyWrapper: {
    marginTop: 12,
  },
  emptyCard: {
    padding: 32,
    alignItems: "center",
    borderRadius: UI.borderRadius.xl,
    borderWidth: 1,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.headingMedium,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
    textAlign: "center",
    marginBottom: 20,
    maxWidth: 280,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: UI.borderRadius.large,
  },
  emptyButtonText: {
    color: "#fff",
    ...Typography.labelLarge,
    fontWeight: "700",
  },
});
