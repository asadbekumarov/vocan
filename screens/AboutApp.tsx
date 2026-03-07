import { Language } from "@/constants/translations";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { MotiView } from "@/utils/moti-wrapper";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
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
  const { mode, setMode, theme, isDark } = useTheme();

  const [langModalVisible, setLangModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

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
      position: "bottom",
    });
  };

  const handleThemeSelect = async (themeMode: ThemeMode) => {
    await setMode(themeMode);
    setThemeModalVisible(false);
    Toast.show({
      type: "success",
      text1: t("success"),
      position: "bottom",
    });
  };

  const currentLangName =
    languages.find((l) => l.code === language)?.name || "O‘zbekcha";
  const currentThemeName = themes.find((t) => t.id === mode)?.name || "System";

  const SettingItem = ({
    icon,
    title,
    value,
    onPress,
    type = "arrow",
    index = 0,
  }: {
    icon: any;
    title: string;
    value?: string;
    onPress?: () => void;
    type?: "arrow" | "switch";
    index?: number;
  }) => (
    <View>
      <TouchableOpacity
        style={[
          styles.item,
          { borderBottomColor: isDark ? "#2A2C2E" : "#E5E7EB" },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.leftSide}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isDark ? "#2A2C2E" : "#F3F4F6" },
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
              { backgroundColor: isDark ? "#2A2C2E" : "#E5F6ED" },
            ]}
          >
            <Text style={[styles.appVersion, { color: theme.tint }]}>
              {t("version")} 1.2.0
            </Text>
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
              { backgroundColor: isDark ? "#1C1E1F" : "#FFFFFF" },
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
              { backgroundColor: isDark ? "#1C1E1F" : "#FFFFFF" },
            ]}
          >
            <SettingItem
              icon="language-outline"
              title={t("language")}
              value={currentLangName}
              onPress={() => setLangModalVisible(true)}
              index={1}
            />
            <SettingItem
              icon="moon-outline"
              title={t("darkMode")}
              value={currentThemeName}
              onPress={() => setThemeModalVisible(true)}
              index={2}
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
              index={3}
            />
          </View>
        </MotiView>
      </ScrollView>

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
              { backgroundColor: isDark ? "#1C1E1F" : "#FFFFFF" },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
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
                    { borderBottomColor: isDark ? "#2A2C2E" : "#F3F4F6" },
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
                              : isDark
                                ? "#333"
                                : "#DDD",
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
              { backgroundColor: isDark ? "#1C1E1F" : "#FFFFFF" },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
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
                    { borderBottomColor: isDark ? "#2A2C2E" : "#F3F4F6" },
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
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 40 },
  headerSection: { alignItems: "center", marginBottom: 35 },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  appVersion: { fontSize: 13, fontWeight: "700" },
  section: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
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
    padding: 20,
    lineHeight: 24,
    fontSize: 15,
    opacity: 0.8,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  leftSide: { flexDirection: "row", alignItems: "center" },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemText: { fontSize: 16, fontWeight: "600" },
  rightSide: { flexDirection: "row", alignItems: "center" },
  itemValue: { fontSize: 14, marginRight: 8, fontWeight: "500" },
  footerText: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 20,
    opacity: 0.5,
    fontWeight: "500",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    width: "100%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
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
    marginBottom: 24,
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
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderBottomWidth: 0.5,
    marginBottom: 8,
  },
  langLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  langDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  langText: { fontSize: 17 },
});

export default AboutApp;
