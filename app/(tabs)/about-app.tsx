import { UI } from "@/constants/theme";
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

const AboutApp = () => {
  const { language, setLanguage, t } = useLanguage();
  const { mode, setMode, theme } = useTheme();

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
    }, [])
  );

  const languages: { id: string; name: string; code: Language }[] = [
    { id: "1", name: "O‘zbekcha", code: "uz" },
    { id: "2", name: "English", code: "en" },
    { id: "3", name: "Русский", code: "ru" },
  ];

  const themes: { id: ThemeMode; name: string; icon: any }[] = [
    { id: "light", name: "Light", icon: "sunny-outline" },
    { id: "dark", name: "Dark", icon: "moon-outline" },
    { id: "system", name: "System", icon: "settings-outline" },
  ];

  const handleLanguageSelect = async (langCode: Language) => {
    await setLanguage(langCode);
    setLangModalVisible(false);
    Toast.show({
      type: "success",
      text1: t("success"),
    });
  };

  const handleThemeSelect = async (themeMode: ThemeMode) => {
    await setMode(themeMode);
    setThemeModalVisible(false);
    Toast.show({
      type: "success",
      text1: t("success"),
    });
  };

  const currentLangName =
    languages.find((l) => l.code === language)?.name || "O‘zbekcha";
  const currentThemeName = themes.find((themeItem) => themeItem.id === mode)?.name || "System";

  const today = new Date().toISOString().split("T")[0];
  const dueWordsCount = words.filter(w => !w.nextReviewDate || w.nextReviewDate <= today).length;

  const SettingItem = ({
    icon,
    title,
    value,
    onPress,
  }: {
    icon: any;
    title: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <View>
      <TouchableOpacity
        style={[
          styles.item,
          { borderBottomColor: theme.border },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.leftSide}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.secondary },
            ]}
          >
            <Ionicons name={icon} size={20} color={theme.tint} />
          </View>
          <Text style={[styles.itemText, { color: theme.text }]}>{title}</Text>
        </View>
        <View style={styles.rightSide}>
          <Text style={[styles.itemValue, { color: theme.icon }]}>{value}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.icon} />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <MotiView
            style={styles.headerSection}
            from={{ opacity: 0, scale: 0.85, translateY: -15 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 250 }}
          >
            <MotiView
              from={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "timing", duration: 200, delay: 100 }}
              style={[styles.logoContainer, { backgroundColor: theme.tint }]}
            >
              <Ionicons name="school" size={45} color="white" />
            </MotiView>
            <Text style={[styles.appName, { color: theme.text }]}>VocabApp</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.secondary },
              ]}
            >
              <Text style={[styles.appVersion, { color: theme.tint }]}>
                {t("version")} 1.2.0
              </Text>
            </View>
          </MotiView>

          {/* Dashboard Section */}
          <MotiView
            style={styles.section}
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: 250, delay: 150 }}
          >
            <Text style={[styles.sectionTitle, { color: theme.tint }]}>
              Dashboard
            </Text>
            <View style={styles.dashboardGrid}>
              <View style={[styles.dashboardTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="book" size={24} color={theme.tint} />
                <Text style={[styles.dashboardValue, { color: theme.text }]}>{words.length}</Text>
                <Text style={[styles.dashboardLabel, { color: theme.muted }]}>Jami so'zlar</Text>
              </View>
              <View style={[styles.dashboardTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="flame" size={24} color="#FCD34D" />
                <Text style={[styles.dashboardValue, { color: theme.text }]}>{gamification?.currentStreak || 0}</Text>
                <Text style={[styles.dashboardLabel, { color: theme.muted }]}>🔥 Streak</Text>
              </View>
              <View style={[styles.dashboardTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="trophy" size={24} color="#F59E0B" />
                <Text style={[styles.dashboardValue, { color: theme.text }]}>{gamification?.maxStreak || 0}</Text>
                <Text style={[styles.dashboardLabel, { color: theme.muted }]}>Rekord</Text>
              </View>
              <View style={[styles.dashboardTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="sync" size={24} color="#6366F1" />
                <Text style={[styles.dashboardValue, { color: theme.text }]}>{dueWordsCount}</Text>
                <Text style={[styles.dashboardLabel, { color: theme.muted }]}>Takrorlash</Text>
              </View>
            </View>
          </MotiView>

          {/* About Section */}
          <MotiView
            style={styles.section}
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: 250, delay: 200 }}
          >
            <Text style={[styles.sectionTitle, { color: theme.tint }]}>
              {t("about")}
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.description, { color: theme.text }]}>
                {t("description")}
              </Text>
            </View>
          </MotiView>

          {/* Settings Section */}
          <MotiView
            style={styles.section}
            from={{ opacity: 0, translateX: 20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: 250, delay: 350 }}
          >
            <Text style={[styles.sectionTitle, { color: theme.tint }]}>
              {t("settings")}
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <SettingItem
                icon="language-outline"
                title={t("language")}
                value={currentLangName}
                onPress={() => setLangModalVisible(true)}
              />
              <SettingItem
                icon="moon-outline"
                title={t("darkMode")}
                value={currentThemeName}
                onPress={() => setThemeModalVisible(true)}
              />
              <SettingItem
                icon="shield-checkmark-outline"
                title={t("privacy")}
                onPress={() => {
                  Toast.show({
                    type: "info",
                    text1: t("privacy"),
                    text2: t("comingSoon"),
                  });
                }}
              />
            </View>
          </MotiView>
        </ScrollView>
      </View>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={langModalVisible}
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLangModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {t("selectLanguage")}
              </Text>
            </View>

            <View style={styles.langList}>
              {languages.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.langItem,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() => handleLanguageSelect(item.code)}
                >
                  <View style={styles.langLeft}>
                    <View
                      style={[
                        styles.langDot,
                        {
                          backgroundColor:
                            language === item.code
                              ? theme.tint
                              : theme.border,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.langText,
                        {
                          color:
                            language === item.code ? theme.tint : theme.text,
                          fontWeight: language === item.code ? "700" : "500",
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  {language === item.code && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.tint}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={themeModalVisible}
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setThemeModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {t("darkMode")}
              </Text>
            </View>

            <View style={styles.langList}>
              {themes.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.langItem,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() => handleThemeSelect(item.id)}
                >
                  <View style={styles.langLeft}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={mode === item.id ? theme.tint : theme.icon}
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={[
                        styles.langText,
                        {
                          color: mode === item.id ? theme.tint : theme.text,
                          fontWeight: mode === item.id ? "700" : "500",
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  {mode === item.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.tint}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center", // Center for web
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 600, // Max width for large screens
    flex: 1,
        paddingTop: 60,

  },
  content: { padding: UI.padding, paddingTop: 40, paddingBottom: Platform.OS === "web" ? 120 : 40 },
  headerSection: { alignItems: "center", marginBottom: UI.spacing.lg },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: UI.borderRadius.large,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: UI.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: "#16a34a",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  appName: { fontSize: 28, fontWeight: "800", letterSpacing: 0.5 },
  badge: {
    paddingHorizontal: UI.spacing.md,
    paddingVertical: UI.spacing.xs,
    borderRadius: UI.borderRadius.medium,
    marginTop: 8,
  },
  appVersion: { fontSize: 13, fontWeight: "700" },
  section: { marginBottom: UI.spacing.xl },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: UI.spacing.sm,
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    borderRadius: UI.borderRadius.large,
    paddingVertical: UI.spacing.sm,
    paddingHorizontal: UI.spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  description: {
    padding: UI.padding,
    lineHeight: 24,
    fontSize: 15,
    opacity: 0.8,
  },
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dashboardTile: {
    width: "48%",
    padding: UI.spacing.md,
    borderRadius: UI.borderRadius.large,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: UI.spacing.sm,
  },
  dashboardValue: {
    fontSize: 24,
    fontWeight: "800",
    marginVertical: 4,
  },
  dashboardLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: UI.spacing.md,
    paddingHorizontal: UI.spacing.md,
    borderBottomWidth: 0.5,
  },
  leftSide: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: UI.borderRadius.small,
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: { fontSize: 16, fontWeight: "600" },
  rightSide: { flexDirection: "row", alignItems: "center", gap: 4 },
  itemValue: { fontSize: 14, fontWeight: "500" },
  footerText: {
    textAlign: "center",
    fontSize: 13,
    marginTop: UI.spacing.lg,
    opacity: 0.5,
    fontWeight: "500",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    alignItems: "center", // Center for web
  },
  modalContent: {
    width: "100%",
    maxWidth: 600, // Max width for large screens
    borderTopLeftRadius: UI.borderRadius.xl,
    borderTopRightRadius: UI.borderRadius.xl,
    padding: UI.padding,
    paddingBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: UI.spacing.lg,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  langList: {
    /* spacing via marginBottom on langItem */
  },
  langItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: UI.spacing.md,
    paddingHorizontal: UI.spacing.md,
    borderRadius: UI.borderRadius.medium,
    borderBottomWidth: 0.5,
    marginBottom: 8,
  },
  langLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  langDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  langText: { fontSize: 17 },
});

export default AboutApp;
