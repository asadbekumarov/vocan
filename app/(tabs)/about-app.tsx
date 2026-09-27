import { Palette, Shadows, UI, Typography } from "@/constants/theme";
import { Language } from "@/constants/translations";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { getWords } from "@/storage/wordStorage";
import { GamificationData, getGamificationData } from "@/storage/gamificationStorage";
import { Word } from "@/types/Word";
import { MotiView } from "@/utils/moti-wrapper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

type ThemeMode = "light" | "dark" | "system";

export default function AboutApp() {
  const { language, setLanguage, t } = useLanguage();
  const { mode, setMode, theme, isDark } = useTheme();

  const [langModalVisible, setLangModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const [words, setWords] = useState<Word[]>([]);
  const [gamification, setGamification] = useState<GamificationData | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setWords(await getWords());
        setGamification(await getGamificationData());
      };
      load();
    }, []),
  );

  const languages: { id: string; name: string; flag: string; code: Language }[] = [
    { id: "1", name: "O'zbekcha", flag: "🇺🇿", code: "uz" },
    { id: "2", name: "English", flag: "🇺🇸", code: "en" },
    { id: "3", name: "Русский", flag: "🇷🇺", code: "ru" },
  ];

  const themes: {
    id: ThemeMode;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }[] = [
    { id: "light", name: "Light (Yorug')", icon: "sunny", color: Palette.amber500 },
    { id: "dark", name: "Dark (Qorong'i)", icon: "moon", color: Palette.indigo400 },
    { id: "system", name: "System (Tizimga mos)", icon: "phone-portrait", color: Palette.slate500 },
  ];

  const handleLanguageSelect = async (langCode: Language) => {
    await setLanguage(langCode);
    setLangModalVisible(false);
    Toast.show({
      type: "success",
      text1: t("success") || "Muvaffaqiyatli",
    });
  };

  const handleThemeSelect = async (themeMode: ThemeMode) => {
    await setMode(themeMode);
    setThemeModalVisible(false);
    Toast.show({
      type: "success",
      text1: t("success") || "Muvaffaqiyatli",
    });
  };

  const currentLang = languages.find((l) => l.code === language) || languages[0];
  const currentTheme = themes.find((item) => item.id === mode) || themes[2];

  const today = new Date().toISOString().split("T")[0];
  const dueWordsCount = words.filter(
    (w) => !w.nextReviewDate || w.nextReviewDate <= today,
  ).length;

  const SettingRow = ({
    icon,
    iconColor,
    iconBg,
    title,
    subtitle,
    value,
    onPress,
    isLast = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBg?: string;
    title: string;
    subtitle?: string;
    value?: string;
    onPress?: () => void;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingRow,
        !isLast && { borderBottomColor: theme.divider, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <View style={styles.settingRowLeft}>
        <View
          style={[
            styles.settingIconBox,
            { backgroundColor: iconBg || (isDark ? "rgba(99,102,241,0.14)" : Palette.indigo50) },
          ]}
        >
          <Ionicons name={icon} size={20} color={iconColor || theme.tint} />
        </View>
        <View style={styles.settingTitleBox}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.textTertiary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.settingRowRight}>
        {value && (
          <Text style={[styles.settingValueText, { color: theme.textSecondary }]}>
            {value}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. APP BRAND HERO ── */}
          <MotiView
            from={{ opacity: 0, translateY: -15, scale: 0.95 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: "timing", duration: 350 }}
            style={styles.heroSection}
          >
            <View
              style={[
                styles.logoCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                isDark ? Shadows.dark.sm : Shadows.light.sm,
              ]}
            >
              <View style={[styles.logoIconCircle, { backgroundColor: theme.tint }]}>
                <Ionicons name="school" size={36} color="#ffffff" />
              </View>
              <Text style={[styles.brandName, { color: theme.text }]}>VocabApp</Text>
              <Text style={[styles.brandTagline, { color: theme.textSecondary }]}>
                Aqlli so'z boyligi va til o'rganish platformasi
              </Text>
              <View
                style={[
                  styles.versionPill,
                  { backgroundColor: isDark ? "rgba(99,102,241,0.14)" : Palette.indigo50 },
                ]}
              >
                <View style={[styles.versionDot, { backgroundColor: theme.tint }]} />
                <Text style={[styles.versionText, { color: theme.tint }]}>
                  {t("version") || "Versiya"} 1.2.0
                </Text>
              </View>
            </View>
          </MotiView>

          {/* ── 2. LEARNING METRICS (4 TILES) ── */}
          <View style={styles.sectionWrapper}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              O'rganish statistikasi
            </Text>

            <View style={styles.metricsGrid}>
              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isDark ? Shadows.dark.xs : Shadows.light.xs,
                ]}
              >
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: isDark ? "rgba(99,102,241,0.12)" : Palette.indigo50 },
                  ]}
                >
                  <Ionicons name="book" size={20} color={theme.tint} />
                </View>
                <Text style={[styles.metricValue, { color: theme.text }]}>{words.length}</Text>
                <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>Jami so'zlar</Text>
              </View>

              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isDark ? Shadows.dark.xs : Shadows.light.xs,
                ]}
              >
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: isDark ? "rgba(245,158,11,0.14)" : Palette.amber50 },
                  ]}
                >
                  <Ionicons name="flame" size={20} color={theme.streak} />
                </View>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {gamification?.currentStreak || 0}
                </Text>
                <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>🔥 Streak</Text>
              </View>

              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isDark ? Shadows.dark.xs : Shadows.light.xs,
                ]}
              >
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: isDark ? "rgba(16,185,129,0.14)" : Palette.emerald50 },
                  ]}
                >
                  <Ionicons name="trophy" size={20} color={Palette.emerald500} />
                </View>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {gamification?.maxStreak || 0}
                </Text>
                <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>Rekord</Text>
              </View>

              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isDark ? Shadows.dark.xs : Shadows.light.xs,
                ]}
              >
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: isDark ? "rgba(99,102,241,0.12)" : Palette.indigo50 },
                  ]}
                >
                  <Ionicons name="sync" size={20} color={theme.tint} />
                </View>
                <Text style={[styles.metricValue, { color: theme.text }]}>{dueWordsCount}</Text>
                <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>Takrorlash</Text>
              </View>
            </View>
          </View>

          {/* ── 3. GROUP 1: PREFERENCES (IOS STYLE) ── */}
          <View style={styles.sectionWrapper}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {t("settings") || "Sozlamalar"}
            </Text>

            <View
              style={[
                styles.groupedCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                isDark ? Shadows.dark.xs : Shadows.light.xs,
              ]}
            >
              <SettingRow
                icon="globe-outline"
                iconColor="#3B82F6"
                iconBg={isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF"}
                title={t("language") || "Ilova tili"}
                subtitle="Interfeys tili"
                value={`${currentLang.flag} ${currentLang.name}`}
                onPress={() => setLangModalVisible(true)}
              />

              <SettingRow
                icon={currentTheme.icon}
                iconColor={Palette.amber500}
                iconBg={isDark ? "rgba(245,158,11,0.12)" : Palette.amber50}
                title={t("darkMode") || "Tashqi ko'rinish"}
                subtitle="Light / Dark rejim"
                value={currentTheme.name.split(" ")[0]}
                onPress={() => setThemeModalVisible(true)}
              />

              <SettingRow
                icon="flame-outline"
                iconColor={theme.streak}
                iconBg={isDark ? "rgba(249,115,22,0.12)" : "#FFF7ED"}
                title="Kunlik maqsad"
                subtitle="Har kuni kiritiladigan yangi so'zlar"
                value={`${gamification?.dailyGoal || 5} ta so'z`}
                isLast
                onPress={() => {
                  Toast.show({
                    type: "info",
                    text1: "Kunlik maqsad",
                    text2: `Kunlik maqsadingiz: ${gamification?.dailyGoal || 5} ta so'z`,
                  });
                }}
              />
            </View>
          </View>

          {/* ── 4. GROUP 2: APP INFO & ABOUT ── */}
          <View style={styles.sectionWrapper}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {t("about") || "Ilova haqida"}
            </Text>

            <View
              style={[
                styles.groupedCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                isDark ? Shadows.dark.xs : Shadows.light.xs,
              ]}
            >
              <SettingRow
                icon="information-circle-outline"
                iconColor={theme.tint}
                iconBg={isDark ? "rgba(99,102,241,0.12)" : Palette.indigo50}
                title="VocabApp vazifasi"
                subtitle={t("description") || "So'zlarni samarali yod olish"}
                onPress={() => {
                  Alert.alert(
                    "VocabApp haqida",
                    t("description") ||
                      "VocabApp — so'z boyligini kengaytirish, SRS (Spaced Repetition) orqali takrorlash va testlar orqali mustahkamlash ilovasi.",
                  );
                }}
              />

              <SettingRow
                icon="shield-checkmark-outline"
                iconColor={Palette.emerald500}
                iconBg={isDark ? "rgba(16,185,129,0.12)" : Palette.emerald50}
                title={t("privacy") || "Xavfsizlik & Maxfiylik"}
                subtitle="Barcha ma'lumotlar qurilmangizda saqlanadi"
                isLast
                onPress={() => {
                  Toast.show({
                    type: "info",
                    text1: t("privacy") || "Maxfiylik",
                    text2: "Lug'atingiz va ma'lumotlaringiz xavfsiz saqlanadi.",
                  });
                }}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ── LANGUAGE MODAL ── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={langModalVisible}
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          onPress={() => setLangModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
              isDark ? Shadows.dark.xl : Shadows.light.xl,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {t("selectLanguage") || "Tilni tanlang"}
              </Text>
              <TouchableOpacity
                onPress={() => setLangModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalList}>
              {languages.map((item) => {
                const isActive = language === item.code;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.modalOptionItem,
                      {
                        backgroundColor: isActive
                          ? isDark
                            ? "rgba(99,102,241,0.15)"
                            : Palette.indigo50
                          : "transparent",
                        borderColor: isActive ? theme.tint : theme.border,
                      },
                    ]}
                    onPress={() => handleLanguageSelect(item.code)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalOptionLeft}>
                      <Text style={styles.modalOptionFlag}>{item.flag}</Text>
                      <Text
                        style={[
                          styles.modalOptionText,
                          {
                            color: isActive ? theme.tint : theme.text,
                            fontWeight: isActive ? "700" : "500",
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.tint} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── THEME MODAL ── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={themeModalVisible}
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          onPress={() => setThemeModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
              isDark ? Shadows.dark.xl : Shadows.light.xl,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {t("darkMode") || "Tashqi ko'rinish"}
              </Text>
              <TouchableOpacity
                onPress={() => setThemeModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalList}>
              {themes.map((item) => {
                const isActive = mode === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.modalOptionItem,
                      {
                        backgroundColor: isActive
                          ? isDark
                            ? "rgba(99,102,241,0.15)"
                            : Palette.indigo50
                          : "transparent",
                        borderColor: isActive ? theme.tint : theme.border,
                      },
                    ]}
                    onPress={() => handleThemeSelect(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalOptionLeft}>
                      <View
                        style={[
                          styles.themeIconCircle,
                          { backgroundColor: item.color + "18" },
                        ]}
                      >
                        <Ionicons name={item.icon} size={18} color={item.color} />
                      </View>
                      <Text
                        style={[
                          styles.modalOptionText,
                          {
                            color: isActive ? theme.tint : theme.text,
                            fontWeight: isActive ? "700" : "500",
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.tint} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  },
  scrollContent: {
    paddingTop: Platform.OS === "web" ? 36 : 56,
    paddingBottom: Platform.OS === "web" ? 110 : 36,
  },

  // Hero Section
  heroSection: {
    marginBottom: 24,
  },
  logoCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: UI.borderRadius.xl,
    borderWidth: 1,
  },
  logoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandName: {
    ...Typography.headingLarge,
    fontWeight: "800",
    marginBottom: 4,
  },
  brandTagline: {
    ...Typography.bodyMedium,
    textAlign: "center",
    marginBottom: 14,
    maxWidth: 260,
  },
  versionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: UI.borderRadius.pill,
  },
  versionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  versionText: {
    ...Typography.caption,
    fontWeight: "700",
  },

  // Metrics Grid
  sectionWrapper: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.overline,
    letterSpacing: 1,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  metricTile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: UI.borderRadius.large,
    borderWidth: 1,
    gap: 4,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: UI.borderRadius.medium,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  metricValue: {
    ...Typography.headingSmall,
    fontWeight: "800",
  },
  metricLabel: {
    ...Typography.caption,
    textAlign: "center",
  },

  // Grouped Card
  groupedCard: {
    borderRadius: UI.borderRadius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingIconBox: {
    width: 38,
    height: 38,
    borderRadius: UI.borderRadius.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  settingTitleBox: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    ...Typography.labelLarge,
    fontWeight: "600",
  },
  settingSubtitle: {
    ...Typography.caption,
  },
  settingRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingValueText: {
    ...Typography.labelSmall,
    fontWeight: "500",
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: UI.borderRadius.xl,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    ...Typography.headingSmall,
    fontWeight: "700",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalList: {
    gap: 10,
  },
  modalOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: UI.borderRadius.large,
    borderWidth: 1,
  },
  modalOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalOptionFlag: {
    fontSize: 22,
  },
  themeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOptionText: {
    ...Typography.bodyLarge,
  },
});
