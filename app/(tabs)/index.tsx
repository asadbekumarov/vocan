import { UI } from "@/constants/theme";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { getWords } from "@/storage/wordStorage";
import { getGamificationData, logActivity, GamificationData } from "@/storage/gamificationStorage";
import { Word } from "@/types/Word";
import { MotiView } from "@/utils/moti-wrapper";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState, useEffect } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";

type Mode = "uz-en" | "en-uz" | "uz-ru" | "ru-uz" | "en-ru" | "ru-en";

const MODE_COLORS: Record<Mode, string> = {
  "uz-en": "#10B981", // Emerald
  "en-uz": "#3B82F6", // Blue
  "uz-ru": "#F59E0B", // Amber
  "ru-uz": "#8B5CF6", // Violet
  "en-ru": "#EC4899", // Pink
  "ru-en": "#14B8A6", // Teal
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
    if (hour < 12) return "Xayrli tong,";
    if (hour < 17) return "Xayrli kun,";
    if (hour < 21) return "Xayrli oqshom,";
    return "Xayrli tun,";
  } else if (lang === "ru") {
    if (hour < 12) return "Доброе утро,";
    if (hour < 17) return "Добрый день,";
    if (hour < 21) return "Добрый вечер,";
    return "Доброй ночи,";
  } else {
    if (hour < 12) return "Good morning,";
    if (hour < 17) return "Good afternoon,";
    if (hour < 21) return "Good evening,";
    return "Good night,";
  }
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getFormattedDate(lang: string): string {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  try {
    return date.toLocaleDateString(lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-US', options);
  } catch (e) {
    return date.toDateString();
  }
}

const Marquee = ({ children }: { children: React.ReactNode }) => {
  const offset = useSharedValue(0);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    if (contentWidth > 0) {
      offset.value = 0;
      offset.value = withRepeat(
        withTiming(-contentWidth, { duration: contentWidth * 25, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [contentWidth, offset]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  if (!children) return null;

  return (
    <View style={{ overflow: 'hidden', width: '100%', marginLeft: -8 }}>
      <Animated.View 
        style={[{ flexDirection: 'row', gap: 8, paddingLeft: 8 }, animatedStyle]}
        onLayout={(e) => setContentWidth(e.nativeEvent.layout.width / 3)}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>{children}</View>
        <View style={{ flexDirection: 'row', gap: 8 }}>{children}</View>
        <View style={{ flexDirection: 'row', gap: 8 }}>{children}</View>
      </Animated.View>
    </View>
  );
};

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

    const today = getTodayStr();
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
    .slice(0, 4);

  const greeting = getGreeting(language);
  const dateStr = getFormattedDate(language);

  const activeCategories = Object.values(modeCounts).filter((v) => (v ?? 0) > 0).length;

  // Helper: get primary/secondary text from word
  function getWordTexts(word: Word): { primary: string; secondary: string } {
    const m = word.mode as Mode;
    const pairs: Record<Mode, [string | undefined, string | undefined]> = {
      "uz-en": [word.uz, word.en],
      "en-uz": [word.en, word.uz],
      "uz-ru": [word.uz, word.ru],
      "ru-uz": [word.ru, word.uz],
      "en-ru": [word.en, word.ru],
      "ru-en": [word.ru, word.en],
    };
    const [p, s] = pairs[m] ?? [undefined, undefined];
    return { primary: p ?? "–", secondary: s ?? "" };
  }

  const translations = {
    uz: {
      ready: "O'rganishga tayyormisiz?",
      total: "Jami",
      today: "Bugun",
      categories: "Toifalar",
      quick: "Harakatlar",
      pairs: "Juftliklar",
      recent: "Oxirgi qo'shilganlar",
      all: "Barchasi",
      noWordsTitle: "Sizning lug'atingiz bo'sh",
      noWordsSub: "Yangi so'zlarni kashf eting va qo'shing",
      addFirst: "Birinchi so'zni qo'shish",
      practice: "Mashq",
      explore: "Lug'at"
    },
    en: {
      ready: "Ready to learn?",
      total: "Total",
      today: "Today",
      categories: "Categories",
      quick: "Actions",
      pairs: "Languages",
      recent: "Recently Added",
      all: "View All",
      noWordsTitle: "Your vocabulary is empty",
      noWordsSub: "Discover and add new words to start learning",
      addFirst: "Add your first word",
      practice: "Practice",
      explore: "Explore"
    },
    ru: {
      ready: "Готовы учиться?",
      total: "Всего",
      today: "Сегодня",
      categories: "Категории",
      quick: "Действия",
      pairs: "Языки",
      recent: "Последние",
      all: "Все",
      noWordsTitle: "Ваш словарь пуст",
      noWordsSub: "Открывайте и добавляйте новые слова",
      addFirst: "Добавить первое слово",
      practice: "Практика",
      explore: "Словарь"
    }
  };

  const text = translations[language as keyof typeof translations] || translations.en;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.contentWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── PREMIUM HEADER ── */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500, easing: Easing.out(Easing.quad) }}
            style={styles.header}
          >
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={[styles.greeting, { color: theme.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }]}>{greeting}</Text>
            </View>
            <View style={[styles.avatarBox, { backgroundColor: theme.tint + '20' }]}>
               <Ionicons name="sparkles" size={24} color={theme.tint} />
            </View>
          </MotiView>

          {/* ── BENTO GRID ── */}
          <View style={styles.bentoGrid}>
            
            {/* LARGE HERO TILE - Total Words */}
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", delay: 100 }}
              style={styles.bentoFull}
            >
              <View style={[styles.bentoCard, styles.heroTile, { backgroundColor: theme.tint }]}>
                 <View style={styles.heroBgCircle} />
                 <View style={styles.heroBgCircle2} />
                 <View style={styles.heroContentRow}>
                    <View>
                      <Text style={styles.heroTileLabel}>{text.total.toUpperCase()}</Text>
                      <Text style={styles.heroTileValue}>{words.length}</Text>
                    </View>
                    <View style={styles.heroStatsMini}>
                      <View style={styles.miniStat}>
                        <Text style={styles.miniStatValue}>+{todayCount}</Text>
                        <Text style={styles.miniStatLabel}>{text.today}</Text>
                      </View>
                      <View style={styles.miniStatDivider} />
                      <View style={styles.miniStat}>
                        <Text style={styles.miniStatValue}>{activeCategories}</Text>
                        <Text style={styles.miniStatLabel}>{text.categories}</Text>
                      </View>
                    </View>
                 </View>
                 {gamification && (
                   <View style={{ marginTop: 24 }}>
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                       <Text style={{ color: '#ffffff90', fontSize: 12, fontWeight: '700' }}>KUNLIK MAQSAD</Text>
                       <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                         <Ionicons name="flame" size={14} color="#FCD34D" />
                         <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{gamification.currentStreak} kunlik Streak</Text>
                       </View>
                     </View>
                     <View style={{ height: 8, backgroundColor: '#ffffff30', borderRadius: 4, overflow: 'hidden' }}>
                       <View style={{ width: `${Math.min((todayCount / gamification.dailyGoal) * 100, 100)}%`, height: '100%', backgroundColor: '#fff', borderRadius: 4 }} />
                     </View>
                     <Text style={{ color: '#ffffff90', fontSize: 11, fontWeight: '600', marginTop: 8, textAlign: 'right' }}>
                       {todayCount} / {gamification.dailyGoal} ta so'z
                     </Text>
                   </View>
                 )}
              </View>
            </MotiView>

            {/* ACTION TILES ROW */}
            <View style={styles.bentoRow}>
              
              {/* Add Word Tile */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "spring", delay: 200 }}
                style={styles.bentoHalf}
              >
                <TouchableOpacity
                  style={[styles.bentoCard, styles.actionTile, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderColor: theme.border, borderWidth: 1 }]}
                  onPress={() => router.push("/(tabs)/add-word")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: '#10B98120' }]}>
                    <Ionicons name="add" size={28} color="#10B981" />
                  </View>
                  <Text style={[styles.actionTileTitle, { color: theme.text }]}>{(t as any)("addWord")}</Text>
                  <Text style={[styles.actionTileSub, { color: theme.muted }]}>New word</Text>
                </TouchableOpacity>
              </MotiView>

              {/* Quiz Tile */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "spring", delay: 300 }}
                style={styles.bentoHalf}
              >
                <TouchableOpacity
                  style={[styles.bentoCard, styles.actionTile, { backgroundColor: isDark ? '#3730A3' : '#EEF2FF', borderColor: theme.border, borderWidth: isDark ? 0 : 1 }]}
                  onPress={() => router.push("/(tabs)/quiz")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: '#6366F120' }]}>
                    <Ionicons name="game-controller" size={28} color="#6366F1" />
                  </View>
                  <Text style={[styles.actionTileTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>{text.practice}</Text>
                  <Text style={[styles.actionTileSub, { color: isDark ? '#A5B4FC' : '#6B7280' }]}>{(t as any)("quiz")}</Text>
                </TouchableOpacity>
              </MotiView>

            </View>

            {/* MY WORDS & LANGUAGES ROW */}
            <View style={styles.bentoRow}>
                {/* Dictionary Tile */}
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", delay: 400 }}
                  style={styles.bentoThird}
                >
                  <TouchableOpacity
                    style={[styles.bentoCard, styles.smallTile, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderColor: theme.border, borderWidth: 1 }]}
                    onPress={() => router.push("/(tabs)/my-words" as any)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="library" size={24} color={theme.tint} style={{marginBottom: 8}} />
                    <Text style={[styles.smallTileTitle, { color: theme.text }]}>{text.explore}</Text>
                  </TouchableOpacity>
                </MotiView>

                {/* Languages Scroll Tile */}
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", delay: 500 }}
                  style={styles.bentoTwoThirds}
                >
                  <View style={[styles.bentoCard, styles.scrollTile, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderColor: theme.border, borderWidth: 1 }]}>
                    <Text style={[styles.scrollTileTitle, { color: theme.text }]}>{text.pairs}</Text>
                    <Marquee>
                      {(Object.entries(MODE_LABELS) as [Mode, string][]).map(([mode, label]) => {
                        const count = modeCounts[mode] ?? 0;
                        if (count === 0 && words.length > 0) return null; // Hide empty if there are words
                        const color = MODE_COLORS[mode];
                        return (
                          <View key={mode} style={[styles.langPill, { backgroundColor: color + '15', borderColor: color + '30' }]}>
                            <View style={[styles.langDot, { backgroundColor: color }]} />
                            <Text style={[styles.langPillText, { color: isDark ? '#FFF' : color }]}>{label}</Text>
                            <Text style={[styles.langPillCount, { color: color }]}>{count}</Text>
                          </View>
                        );
                      })}
                    </Marquee>
                  </View>
                </MotiView>
            </View>
          </View>

          {/* ── RECENT WORDS ── */}
          {recentWords.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 400, delay: 600 }}
              style={styles.recentSection}
            >
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{text.recent}</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/my-words" as any)}>
                  <Text style={[styles.seeAll, { color: theme.tint }]}>{text.all}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.recentList}>
                {recentWords.map((word, index) => {
                  const modeColor = MODE_COLORS[word.mode as Mode] ?? theme.tint;
                  const { primary, secondary } = getWordTexts(word);
                  return (
                    <TouchableOpacity
                      key={word.id}
                      style={[styles.recentItem, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderColor: theme.border }]}
                      activeOpacity={0.7}
                      onPress={() => router.push("/(tabs)/my-words" as any)}
                    >
                      <View style={[styles.recentIcon, { backgroundColor: modeColor + '15' }]}>
                        <Text style={[styles.recentIconText, { color: modeColor }]}>{primary.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.recentTexts}>
                        <Text style={[styles.recentPrimary, { color: theme.text }]} numberOfLines={1}>{primary}</Text>
                        {secondary ? <Text style={[styles.recentSecondary, { color: theme.muted }]} numberOfLines={1}>{secondary}</Text> : null}
                      </View>
                      <View style={[styles.recentBadge, { backgroundColor: theme.background }]}>
                         <Text style={[styles.recentBadgeText, { color: theme.muted }]}>{MODE_LABELS[word.mode as Mode]}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </MotiView>
          )}

          {/* ── EMPTY STATE ── */}
          {words.length === 0 && (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "timing", duration: 500, delay: 600 }}
            >
              <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: theme.border }]}>
                <View style={[styles.emptyIllustration, { backgroundColor: theme.tint + '15' }]}>
                  <Ionicons name="book-outline" size={48} color={theme.tint} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>{text.noWordsTitle}</Text>
                <Text style={[styles.emptySub, { color: theme.muted }]}>{text.noWordsSub}</Text>
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: theme.tint }]}
                  onPress={() => router.push("/(tabs)/add-word")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyBtnText}>{text.addFirst}</Text>
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
  container: { flex: 1, alignItems: "center" },
  contentWrapper: { width: "100%", maxWidth: 600, flex: 1 },
  scrollContent: {
    padding: UI.padding,
    paddingTop: Platform.OS === "web" ? 40 : 60,
    paddingBottom: Platform.OS === "web" ? 120 : 40,
  },

  // Premium Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 32,
  },
  dateText: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  greeting: { fontSize: 24, fontWeight: '400', letterSpacing: 0.2 },
  subGreeting: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  avatarBox: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },

  // Bento Grid
  bentoGrid: { gap: 16, marginBottom: 32 },
  bentoRow: { flexDirection: 'row', gap: 16 },
  bentoFull: { width: '100%' },
  bentoHalf: { flex: 1 },
  bentoThird: { flex: 0.35 },
  bentoTwoThirds: { flex: 0.65 },
  
  bentoCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: "0 4px 20px rgba(0,0,0,0.05)" } as any,
    }),
  },

  // Hero Tile
  heroTile: { padding: 24, position: 'relative' },
  heroBgCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#ffffff15', top: -100, right: -50 },
  heroBgCircle2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: '#ffffff10', bottom: -20, left: 20 },
  heroContentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroTileLabel: { fontSize: 13, fontWeight: '700', color: '#ffffff90', letterSpacing: 1, marginBottom: 4 },
  heroTileValue: { fontSize: 48, fontWeight: '900', color: '#fff', lineHeight: 52, letterSpacing: -1 },
  heroStatsMini: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff20', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backdropFilter: 'blur(10px)' as any },
  miniStat: { alignItems: 'center' },
  miniStatValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  miniStatLabel: { fontSize: 10, fontWeight: '600', color: '#ffffff90', marginTop: 2 },
  miniStatDivider: { width: 1, height: 24, backgroundColor: '#ffffff40', marginHorizontal: 12 },

  // Action Tiles
  actionTile: { padding: 20, alignItems: 'flex-start', justifyContent: 'space-between', minHeight: 140 },
  iconWrapper: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  actionTileTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  actionTileSub: { fontSize: 13, fontWeight: '500' },

  // Small Tiles
  smallTile: { padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 110 },
  smallTileTitle: { fontSize: 14, fontWeight: '700' },
  
  // Scroll Tile
  scrollTile: { padding: 20, minHeight: 110, justifyContent: 'center' },
  scrollTileTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12 },
  langScroll: { gap: 8, paddingRight: 20 },
  langPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 6 },
  langDot: { width: 6, height: 6, borderRadius: 3 },
  langPillText: { fontSize: 12, fontWeight: '700' },
  langPillCount: { fontSize: 12, fontWeight: '800' },

  // Recent Section
  recentSection: { marginTop: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  seeAll: { fontSize: 14, fontWeight: "700" },
  recentList: { gap: 12 },
  recentItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, gap: 16 },
  recentIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  recentIconText: { fontSize: 18, fontWeight: '800' },
  recentTexts: { flex: 1 },
  recentPrimary: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  recentSecondary: { fontSize: 14, fontWeight: "500" },
  recentBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  recentBadgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },

  // Empty State
  emptyContainer: { padding: 40, alignItems: 'center', borderRadius: 24, borderWidth: 1, borderStyle: 'dashed' },
  emptyIllustration: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptySub: { fontSize: 15, fontWeight: '500', textAlign: 'center', marginBottom: 24 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  emptyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
