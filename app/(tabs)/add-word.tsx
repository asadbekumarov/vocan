import { Palette, Shadows, UI, Typography, ComponentTokens } from "@/constants/theme";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import {
  addMultipleWords,
  addWord,
  updateWord,
} from "@/storage/wordStorage";
import { Word } from "@/types/Word";
import { MotiView } from "@/utils/moti-wrapper";
import { Ionicons } from "@expo/vector-icons";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { parseExtractedText, recognizeTextFromImage } from "@/utils/ocrService";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Toast from "react-native-toast-message";

type Mode = "uz-en" | "en-uz" | "uz-ru" | "ru-uz" | "en-ru" | "ru-en";

const MODES: { id: Mode; from: string; to: string; label: string; color: string }[] = [
  { id: "uz-en", from: "UZ", to: "EN", label: "UZ → EN", color: Palette.emerald500 },
  { id: "en-uz", from: "EN", to: "UZ", label: "EN → UZ", color: "#3B82F6" },
  { id: "uz-ru", from: "UZ", to: "RU", label: "UZ → RU", color: Palette.amber500 },
  { id: "ru-uz", from: "RU", to: "UZ", label: "RU → UZ", color: "#8B5CF6" },
  { id: "en-ru", from: "EN", to: "RU", label: "EN → RU", color: "#EC4899" },
  { id: "ru-en", from: "RU", to: "EN", label: "RU → EN", color: "#14B8A6" },
];

const REVERSE_MODES: Record<Mode, Mode> = {
  "uz-en": "en-uz",
  "en-uz": "uz-en",
  "uz-ru": "ru-uz",
  "ru-uz": "uz-ru",
  "en-ru": "ru-en",
  "ru-en": "en-ru",
};

interface ScannedWord {
  id: string;
  word: string;
  pronunciation?: string;
  translation: string;
  selected: boolean;
}

export default function AddWordScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();

  const [mode, setMode] = useState<Mode>("uz-en");
  const [uz, setUz] = useState("");
  const [en, setEn] = useState("");
  const [ru, setRu] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ uz?: boolean; en?: boolean; ru?: boolean }>({});
  const [focusedField, setFocusedField] = useState<"uz" | "en" | "ru" | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [ocrProgressText, setOcrProgressText] = useState("");
  const [scannedWords, setScannedWords] = useState<ScannedWord[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isManualInputVisible, setIsManualInputVisible] = useState(false);
  const [manualTextInput, setManualTextInput] = useState("");

  // Edit state for scanned words
  const [editingScannedWordId, setEditingScannedWordId] = useState<string | null>(null);
  const [editScannedWordText, setEditScannedWordText] = useState("");
  const [editScannedPronunciationText, setEditScannedPronunciationText] = useState("");
  const [editScannedTranslationText, setEditScannedTranslationText] = useState("");

  useEffect(() => {
    if (params.id && params.id !== editId) {
      setEditId(params.id as string);
      setUz((params.uz as string) || "");
      setEn((params.en as string) || "");
      setRu((params.ru as string) || "");
      if (params.mode) {
        setMode(params.mode as Mode);
      }
    }
  }, [params.id, params.uz, params.en, params.ru, params.mode, editId]);

  const handleSwapLanguages = () => {
    const targetMode = REVERSE_MODES[mode];
    if (targetMode) {
      setMode(targetMode);
    }
  };

  const handleClearForm = () => {
    setUz("");
    setEn("");
    setRu("");
    setErrors({});
    if (editId) {
      setEditId(null);
    }
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    const needsUz = mode.includes("uz");
    const needsEn = mode.includes("en");
    const needsRu = mode.includes("ru");

    const newErrors = {
      uz: needsUz && !uz.trim(),
      en: needsEn && !en.trim(),
      ru: needsRu && !ru.trim(),
    };
    setErrors(newErrors);

    if (newErrors.uz || newErrors.en || newErrors.ru) {
      Toast.show({
        type: "error",
        text1: t("error") || "Xatolik",
        text2: t("fillRequired") || "Barcha maydonlarni to'ldiring",
      });
      return;
    }

    const wordData = {
      id: editId || Date.now().toString(),
      uz: needsUz ? uz.trim() : "",
      en: needsEn ? en.trim() : "",
      ru: needsRu ? ru.trim() : "",
      date: new Date().toISOString().split("T")[0],
      mode,
    };

    if (editId) {
      await updateWord(wordData);
      Toast.show({
        type: "success",
        text1: t("success") || "Muvaffaqiyatli",
        text2: t("wordUpdated") || "So'z yangilandi",
      });
      handleClearForm();
      router.push("/(tabs)/my-words");
    } else {
      await addWord(wordData);
      Toast.show({
        type: "success",
        text1: t("success") || "Muvaffaqiyatli",
        text2: t("wordSaved") || "So'z saqlandi",
      });
      setUz("");
      setEn("");
      setRu("");
    }
  };

  const processImageWithVisionAPI = async (base64Image: string) => {
    try {
      setLoadingImage(true);
      setOcrProgressText("Rasm tahlil qilinmoqda...");

      const extractedText = await recognizeTextFromImage(base64Image, (progress) => {
        setOcrProgressText(progress);
      });

      const extractedWords = parseExtractedText(extractedText);

      if (extractedWords.length > 0) {
        setScannedWords(extractedWords);
        setIsModalVisible(true);
        Toast.show({
          type: "success",
          text1: "Matn muvaffaqiyatli o'qildi",
          text2: `${extractedWords.length} ta so'z ajratib olindi`,
        });
      } else if (extractedText && extractedText.trim().length > 0) {
        // Fallback: If raw text was found but no structure detected, load it into manual editor
        setManualTextInput(extractedText.trim());
        setIsManualInputVisible(true);
        Toast.show({
          type: "info",
          text1: "Matn o'qildi",
          text2: "Formatlash uchun matnni ko'rib chiqing va tasdiqlang",
        });
      } else {
        Alert.alert(
          "So'zlar topilmadi",
          "Rasmdan aniq matn o'qib bo'lmadi. Iltimos, aniqroq yoki yorug'roq rasm tanlang."
        );
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      Alert.alert(
        "Tahlilda xatolik yuz berdi",
        (error?.message || "Rasmni o'qishda xatolik yuz berdi.") +
          "\n\nMatnni o'zingiz qo'lda nusxalab qo'yishni xohlaysizmi?",
        [
          { text: "Bekor qilish", style: "cancel" },
          { text: "Matn kiritish", onPress: () => setIsManualInputVisible(true) },
        ]
      );
    } finally {
      setLoadingImage(false);
      setOcrProgressText("");
    }
  };

  const handlePickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert("Ruxsat kerak", "Galereyaga kirish uchun ruxsat berishingiz zarur.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS !== "web",
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let base64 = asset.base64;

        if (!base64 && asset.uri) {
          try {
            const manipResult = await manipulateAsync(
              asset.uri,
              [{ resize: { width: 1200 } }],
              { compress: 0.85, format: SaveFormat.JPEG, base64: true }
            );
            base64 = manipResult.base64;
          } catch (mErr) {
            console.warn("Manipulate fallback warning:", mErr);
          }
        }

        if (base64) {
          await processImageWithVisionAPI(base64);
        } else {
          Alert.alert("Xatolik", "Tanlangan rasm ma'lumotlarini yuklab bo'lmadi.");
        }
      }
    } catch (e: any) {
      console.error("Pick image error:", e);
      Alert.alert("Xatolik", e.message || "Rasm tanlashda xatolik yuz berdi");
    }
  };

  const handleTakePhoto = async () => {
    try {
      if (Platform.OS !== "web") {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert("Ruxsat kerak", "Kameradan foydalanish uchun ruxsat zarur.");
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: Platform.OS !== "web",
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let base64 = asset.base64;

        if (!base64 && asset.uri) {
          try {
            const manipResult = await manipulateAsync(
              asset.uri,
              [{ resize: { width: 1200 } }],
              { compress: 0.85, format: SaveFormat.JPEG, base64: true }
            );
            base64 = manipResult.base64;
          } catch (mErr) {
            console.warn("Manipulate fallback warning:", mErr);
          }
        }

        if (base64) {
          await processImageWithVisionAPI(base64);
        } else {
          Alert.alert("Xatolik", "Kameradan olingan rasm ma'lumotlarini o'qib bo'lmadi.");
        }
      }
    } catch (e: any) {
      console.error("Camera error:", e);
      if (Platform.OS === "web") {
        Alert.alert(
          "Kamera imkoni yo'q",
          "Brauzerda kamera ochilmadi. Galereyadan yoki kompyuterdan rasm tanlaysizmi?",
          [
            { text: "Bekor qilish", style: "cancel" },
            { text: "Rasm tanlash", onPress: handlePickImage },
          ]
        );
      } else {
        Alert.alert("Xatolik", e.message || "Rasmga olishda xatolik yuz berdi");
      }
    }
  };

  const handleProcessManualText = () => {
    if (!manualTextInput.trim()) {
      Alert.alert("Bo'sh matn", "Iltimos, so'zlar ro'yxatini kiriting yoki joylashtiring.");
      return;
    }
    const extractedWords = parseExtractedText(manualTextInput);
    if (extractedWords.length > 0) {
      setScannedWords(extractedWords);
      setIsManualInputVisible(false);
      setManualTextInput("");
      setIsModalVisible(true);
      Toast.show({
        type: "success",
        text1: "So'zlar ajratildi",
        text2: `${extractedWords.length} ta so'z topildi`,
      });
    } else {
      Alert.alert(
        "So'zlar topilmadi",
        "Kiritilgan matndan so'zlar ajratib olinmadi. Har bir so'zni yangi qatorga yozing."
      );
    }
  };

  const toggleScannedWordSelection = (id: string) => {
    setScannedWords((prev) =>
      prev.map((word) =>
        word.id === id ? { ...word, selected: !word.selected } : word,
      ),
    );
  };

  const deleteScannedWord = (id: string) => {
    setScannedWords((prev) => {
      const updated = prev.filter((word) => word.id !== id);
      if (updated.length === 0) setIsModalVisible(false);
      return updated;
    });
  };

  const startEditingScannedWord = (word: ScannedWord) => {
    setEditingScannedWordId(word.id);
    setEditScannedWordText(word.word);
    setEditScannedPronunciationText(word.pronunciation || "");
    setEditScannedTranslationText(word.translation);
  };

  const saveEditedScannedWord = () => {
    if (!editScannedWordText || !editScannedTranslationText) {
      Alert.alert(t("error") || "Xatolik", "So'z va tarjima bo'sh bo'lishi mumkin emas!");
      return;
    }

    setScannedWords((prev) =>
      prev.map((w) => {
        if (w.id === editingScannedWordId) {
          return {
            ...w,
            word: editScannedWordText,
            pronunciation: editScannedPronunciationText || undefined,
            translation: editScannedTranslationText,
          };
        }
        return w;
      }),
    );
    setEditingScannedWordId(null);
  };

  const saveSelectedWords = async () => {
    const selectedWordsToSave = scannedWords.filter((w) => w.selected);
    if (selectedWordsToSave.length === 0) {
      Alert.alert(t("error") || "Xatolik", "Saqlash uchun kamida bitta so'z tanlang.");
      return;
    }

    try {
      const needsUz = mode.includes("uz");
      const needsEn = mode.includes("en");
      const needsRu = mode.includes("ru");

      const wordsToAdd: Word[] = selectedWordsToSave.map((scanned) => {
        return {
          id: Date.now().toString() + Math.random().toString(),
          uz: needsUz
            ? mode.startsWith("uz")
              ? scanned.word
              : scanned.translation
            : "",
          en: needsEn
            ? mode.startsWith("en")
              ? scanned.word
              : scanned.translation
            : mode.endsWith("en")
              ? scanned.translation
              : "",
          ru: needsRu
            ? mode.startsWith("ru")
              ? scanned.word
              : scanned.translation
            : mode.endsWith("ru")
              ? scanned.translation
              : "",
          date: new Date().toISOString().split("T")[0],
          mode,
        };
      });

      await addMultipleWords(wordsToAdd);
      setIsModalVisible(false);
      setScannedWords([]);

      Toast.show({
        type: "success",
        text1: t("success") || "Muvaffaqiyatli",
        text2: `${selectedWordsToSave.length} ${t("wordsAddedCount") || "ta so'z qo'shildi"}`,
      });
    } catch (error) {
      console.error("Error saving scanned words:", error);
      Alert.alert(t("error") || "Xatolik", "So'zlarni saqlashda xatolik yuz berdi");
    }
  };

  const showUz = mode.includes("uz");
  const showEn = mode.includes("en");
  const showRu = mode.includes("ru");
  const currentModeData = MODES.find((m) => m.id === mode) || MODES[0];
  const currentColor = currentModeData.color;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.contentWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── HEADER WITH BACK / CANCEL IF EDITING ── */}
          <MotiView
            from={{ opacity: 0, translateY: -12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 350 }}
            style={styles.header}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.screenTitle, { color: theme.text }]}>
                  {editId ? t("editWord") || "Tahrirlash" : t("addWord") || "So'z qo'shish"}
                </Text>
                {editId && (
                  <View style={[styles.editingBadge, { backgroundColor: Palette.indigo500 + "18" }]}>
                    <Text style={[styles.editingBadgeText, { color: theme.tint }]}>Edit Mode</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
                {editId ? t("updateWord") || "So'zni yangilang" : t("enterTranslation") || "Yangi lug'at boyligingizni boyiting"}
              </Text>
            </View>

            {editId && (
              <TouchableOpacity
                style={[
                  styles.cancelEditBtn,
                  { backgroundColor: isDark ? "rgba(244,63,94,0.12)" : Palette.rose50 },
                ]}
                onPress={handleClearForm}
              >
                <Ionicons name="close" size={18} color={Palette.rose500} />
              </TouchableOpacity>
            )}
          </MotiView>

          {/* ── INTERACTIVE LANGUAGE PAIR SELECTOR STRIP ── */}
          <View style={styles.pairSelectorWrapper}>
            <View style={styles.pairSelectorHeader}>
              <Text style={[styles.sectionCaption, { color: theme.textSecondary }]}>
                {t("selectPair") || "Til juftligini tanlang"}
              </Text>
              <TouchableOpacity
                onPress={handleSwapLanguages}
                style={[
                  styles.swapButton,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : Palette.slate100 },
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="swap-horizontal" size={16} color={currentColor} />
                <Text style={[styles.swapButtonText, { color: currentColor }]}>Almashtirish</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pairChipsContainer}
            >
              {MODES.map((m) => {
                const isSelected = mode === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => {
                      setMode(m.id);
                      setErrors({});
                    }}
                    style={[
                      styles.pairChip,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? m.color + "25"
                            : m.color + "15"
                          : theme.card,
                        borderColor: isSelected ? m.color : theme.border,
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                      isSelected && (isDark ? Shadows.dark.sm : Shadows.light.sm),
                    ]}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.pairChipDot,
                        { backgroundColor: isSelected ? m.color : theme.muted },
                      ]}
                    />
                    <Text
                      style={[
                        styles.pairChipText,
                        {
                          color: isSelected ? (isDark ? "#fff" : m.color) : theme.textSecondary,
                          fontWeight: isSelected ? "700" : "500",
                        },
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── SMART OCR SCAN BANNER ── */}
          <View style={styles.scanBannerSection}>
            <View
              style={[
                styles.scanBanner,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
                isDark ? Shadows.dark.xs : Shadows.light.xs,
              ]}
            >
              <View style={styles.scanBannerLeft}>
                <View
                  style={[
                    styles.scanIconBox,
                    { backgroundColor: isDark ? "rgba(99,102,241,0.15)" : Palette.indigo50 },
                  ]}
                >
                  <Ionicons name="scan-outline" size={22} color={theme.tint} />
                </View>
                <View style={styles.scanBannerText}>
                  <Text style={[styles.scanBannerTitle, { color: theme.text }]}>
                    Rasmdan skanerlash (OCR)
                  </Text>
                  <Text style={[styles.scanBannerSub, { color: theme.textSecondary }]}>
                    Kitob yoki daftardan so'zlarni avtomatik o'qing
                  </Text>
                </View>
              </View>

              {loadingImage ? (
                <View style={styles.scanLoading}>
                  <ActivityIndicator size="small" color={theme.tint} />
                  <Text style={[styles.scanLoadingText, { color: theme.tint }]}>
                    {ocrProgressText || "Tahlil qilinmoqda..."}
                  </Text>
                </View>
              ) : (
                <View style={styles.scanButtonsGroup}>
                  <TouchableOpacity
                    style={[
                      styles.scanPillBtn,
                      { backgroundColor: isDark ? "rgba(99,102,241,0.12)" : Palette.indigo50 },
                    ]}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={16} color={theme.tint} />
                    <Text style={[styles.scanPillText, { color: theme.tint }]}>Kamera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.scanPillBtn,
                      { backgroundColor: isDark ? "rgba(16,185,129,0.12)" : Palette.emerald50 },
                    ]}
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="images" size={16} color={Palette.emerald500} />
                    <Text style={[styles.scanPillText, { color: Palette.emerald500 }]}>Galereya</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.scanPillBtn,
                      { backgroundColor: isDark ? "rgba(245,158,11,0.12)" : Palette.amber50 },
                    ]}
                    onPress={() => setIsManualInputVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="document-text" size={16} color={Palette.amber500} />
                    <Text style={[styles.scanPillText, { color: Palette.amber500 }]}>Matn</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* ── INPUT FIELDS CONTAINER (Rich Focus & Clear Actions) ── */}
          <View style={styles.inputsContainer}>
            {/* Uzbek Field */}
            {showUz && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 250 }}
                style={styles.fieldGroup}
              >
                <View style={styles.fieldLabelRow}>
                  <View style={styles.fieldTag}>
                    <Text style={styles.fieldTagText}>UZ</Text>
                  </View>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>
                    {t("uzbek") || "O'zbekcha"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: errors.uz
                        ? Palette.rose500
                        : focusedField === "uz"
                        ? currentColor
                        : theme.inputBorder,
                      borderWidth: focusedField === "uz" || errors.uz ? 1.5 : 1,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.textInput, { color: theme.text }]}
                    placeholder="Masalan: Kitob"
                    placeholderTextColor={theme.muted}
                    value={uz}
                    onChangeText={(val) => {
                      setUz(val);
                      if (errors.uz) setErrors((e) => ({ ...e, uz: false }));
                    }}
                    onFocus={() => setFocusedField("uz")}
                    onBlur={() => setFocusedField(null)}
                  />
                  {uz.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setUz("")}
                      style={styles.clearInputBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color={theme.muted} />
                    </TouchableOpacity>
                  )}
                </View>
                {errors.uz && (
                  <Text style={styles.errorText}>O'zbekcha so'z kiritilishi shart</Text>
                )}
              </MotiView>
            )}

            {/* English Field */}
            {showEn && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 250, delay: 60 }}
                style={styles.fieldGroup}
              >
                <View style={styles.fieldLabelRow}>
                  <View style={[styles.fieldTag, { backgroundColor: "#3B82F618" }]}>
                    <Text style={[styles.fieldTagText, { color: "#3B82F6" }]}>EN</Text>
                  </View>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>
                    {t("english") || "Inglizcha"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: errors.en
                        ? Palette.rose500
                        : focusedField === "en"
                        ? currentColor
                        : theme.inputBorder,
                      borderWidth: focusedField === "en" || errors.en ? 1.5 : 1,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.textInput, { color: theme.text }]}
                    placeholder="e.g. Book"
                    placeholderTextColor={theme.muted}
                    value={en}
                    onChangeText={(val) => {
                      setEn(val);
                      if (errors.en) setErrors((e) => ({ ...e, en: false }));
                    }}
                    onFocus={() => setFocusedField("en")}
                    onBlur={() => setFocusedField(null)}
                  />
                  {en.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setEn("")}
                      style={styles.clearInputBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color={theme.muted} />
                    </TouchableOpacity>
                  )}
                </View>
                {errors.en && (
                  <Text style={styles.errorText}>Inglizcha so'z kiritilishi shart</Text>
                )}
              </MotiView>
            )}

            {/* Russian Field */}
            {showRu && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 250, delay: 120 }}
                style={styles.fieldGroup}
              >
                <View style={styles.fieldLabelRow}>
                  <View style={[styles.fieldTag, { backgroundColor: Palette.amber500 + "18" }]}>
                    <Text style={[styles.fieldTagText, { color: Palette.amber500 }]}>RU</Text>
                  </View>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>
                    {t("russian") || "Ruscha"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: errors.ru
                        ? Palette.rose500
                        : focusedField === "ru"
                        ? currentColor
                        : theme.inputBorder,
                      borderWidth: focusedField === "ru" || errors.ru ? 1.5 : 1,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.textInput, { color: theme.text }]}
                    placeholder="Например: Книга"
                    placeholderTextColor={theme.muted}
                    value={ru}
                    onChangeText={(val) => {
                      setRu(val);
                      if (errors.ru) setErrors((e) => ({ ...e, ru: false }));
                    }}
                    onFocus={() => setFocusedField("ru")}
                    onBlur={() => setFocusedField(null)}
                  />
                  {ru.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setRu("")}
                      style={styles.clearInputBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color={theme.muted} />
                    </TouchableOpacity>
                  )}
                </View>
                {errors.ru && (
                  <Text style={styles.errorText}>Ruscha so'z kiritilishi shart</Text>
                )}
              </MotiView>
            )}
          </View>

          {/* ── PRIMARY SAVE BUTTON ── */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 300, delay: 180 }}
            style={styles.saveBtnContainer}
          >
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: currentColor },
                isDark ? Shadows.dark.md : Shadows.light.md,
              ]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Ionicons
                name={editId ? "checkmark-circle" : "add-circle"}
                size={22}
                color="#fff"
              />
              <Text style={styles.saveButtonText}>
                {editId
                  ? t("updateWord") || "O'zgarishlarni saqlash"
                  : t("saveWord") || "Lug'atga qo'shish"}
              </Text>
            </TouchableOpacity>
          </MotiView>

          {/* ── MODAL: SCANNED WORDS LIST ── */}
          <Modal
            visible={isModalVisible}
            animationType="slide"
            transparent={Platform.OS === "web"}
            presentationStyle={Platform.OS === "web" ? "overFullScreen" : "pageSheet"}
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View
              style={
                Platform.OS === "web"
                  ? {
                      flex: 1,
                      backgroundColor: theme.overlay,
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 20,
                    }
                  : { flex: 1, backgroundColor: theme.background }
              }
            >
              <View
                style={[
                  styles.modalContainer,
                  { backgroundColor: theme.background },
                  Platform.OS === "web" && {
                    width: "100%",
                    maxWidth: 580,
                    maxHeight: "88%",
                    borderRadius: UI.borderRadius.xl,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>
                      Topilgan so'zlar
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                      {scannedWords.filter((w) => w.selected).length} / {scannedWords.length} ta so'z tanlandi
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => {
                        const allSelected = scannedWords.every((w) => w.selected);
                        setScannedWords((prev) =>
                          prev.map((w) => ({ ...w, selected: !allSelected }))
                        );
                      }}
                      style={[
                        styles.toggleSelectBtn,
                        {
                          backgroundColor: isDark
                            ? "rgba(99,102,241,0.15)"
                            : Palette.indigo50,
                        },
                      ]}
                    >
                      <Text style={[styles.toggleSelectBtnText, { color: theme.tint }]}>
                        {scannedWords.every((w) => w.selected)
                          ? "Bekor qilish"
                          : "Barchasi"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setIsModalVisible(false)}
                      style={[
                        styles.modalCloseBtn,
                        { backgroundColor: isDark ? "rgba(244,63,94,0.1)" : Palette.rose50 },
                      ]}
                    >
                      <Ionicons name="close" size={20} color={Palette.rose500} />
                    </TouchableOpacity>
                  </View>
                </View>

                <FlatList
                  data={scannedWords}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalListContent}
                  renderItem={({ item }) => {
                    const isEditing = editingScannedWordId === item.id;
                    if (isEditing) {
                      return (
                        <View
                          style={[
                            styles.scannedWordCard,
                            {
                              backgroundColor: theme.card,
                              borderColor: theme.tint,
                              borderWidth: 1.5,
                            },
                          ]}
                        >
                          <TextInput
                            style={[
                              styles.modalInput,
                              {
                                backgroundColor: theme.inputBackground,
                                color: theme.text,
                                borderColor: theme.inputBorder,
                              },
                            ]}
                            value={editScannedWordText}
                            onChangeText={setEditScannedWordText}
                            placeholder="So'z"
                            placeholderTextColor={theme.muted}
                          />
                          <TextInput
                            style={[
                              styles.modalInput,
                              {
                                backgroundColor: theme.inputBackground,
                                color: theme.text,
                                borderColor: theme.inputBorder,
                              },
                            ]}
                            value={editScannedTranslationText}
                            onChangeText={setEditScannedTranslationText}
                            placeholder="Tarjimasi"
                            placeholderTextColor={theme.muted}
                          />
                          <View style={styles.modalEditButtonsRow}>
                            <TouchableOpacity
                              style={[styles.modalBtn, { backgroundColor: Palette.rose500 }]}
                              onPress={() => setEditingScannedWordId(null)}
                            >
                              <Text style={styles.modalBtnText}>Bekor qilish</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.modalBtn,
                                { backgroundColor: Palette.emerald500, marginLeft: 10 },
                              ]}
                              onPress={saveEditedScannedWord}
                            >
                              <Text style={styles.modalBtnText}>Saqlash</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    }

                    return (
                      <View
                        style={[
                          styles.scannedWordCard,
                          {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                          },
                          !item.selected && { opacity: 0.5 },
                        ]}
                      >
                        <View style={styles.scannedWordCardHeader}>
                          <Switch
                            value={item.selected}
                            onValueChange={() => toggleScannedWordSelection(item.id)}
                            trackColor={{ false: theme.muted, true: theme.tint }}
                            thumbColor={item.selected ? "#fff" : "#f4f3f4"}
                          />
                          <View style={styles.scannedWordActions}>
                            <TouchableOpacity
                              onPress={() => startEditingScannedWord(item)}
                              style={[
                                styles.actionBtn,
                                {
                                  backgroundColor: isDark
                                    ? "rgba(99,102,241,0.1)"
                                    : Palette.indigo50,
                                },
                              ]}
                            >
                              <Ionicons name="pencil" size={16} color={theme.tint} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => deleteScannedWord(item.id)}
                              style={[
                                styles.actionBtn,
                                {
                                  backgroundColor: isDark
                                    ? "rgba(244,63,94,0.1)"
                                    : Palette.rose50,
                                },
                              ]}
                            >
                              <Ionicons name="trash" size={16} color={Palette.rose500} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.scannedWordContent}>
                          <Text style={[styles.scannedWordTitle, { color: theme.text }]}>
                            {item.word}
                            {item.pronunciation ? `  [${item.pronunciation}]` : ""}
                          </Text>
                          <Text
                            style={[
                              styles.scannedWordTranslation,
                              {
                                color: item.translation
                                  ? theme.textSecondary
                                  : Palette.amber500,
                                fontStyle: item.translation ? "normal" : "italic",
                              },
                            ]}
                          >
                            {item.translation || "Tarjima kiritilmagan (tahrirlash uchun qalamchani bosing)"}
                          </Text>
                        </View>
                      </View>
                    );
                  }}
                />

                <View
                  style={[
                    styles.modalFooter,
                    {
                      borderTopColor: theme.divider,
                      backgroundColor: theme.card,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.tint, width: "100%" }]}
                    onPress={saveSelectedWords}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="cloud-upload" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>
                      Lug'atga qo'shish ({scannedWords.filter((w) => w.selected).length})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* ── MANUAL TEXT INPUT MODAL ── */}
          <Modal
            visible={isManualInputVisible}
            animationType="slide"
            transparent={Platform.OS === "web"}
            onRequestClose={() => setIsManualInputVisible(false)}
          >
            <View
              style={
                Platform.OS === "web"
                  ? {
                      flex: 1,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 16,
                    }
                  : { flex: 1, backgroundColor: theme.background }
              }
            >
              <View
                style={[
                  styles.modalContainer,
                  { backgroundColor: theme.background },
                  Platform.OS === "web" && {
                    width: "100%",
                    maxWidth: 580,
                    maxHeight: "88%",
                    borderRadius: UI.borderRadius.xl,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>
                      Matn orqali qo'shish
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                      So'zlar ro'yxatini yozing yoki nusxalab joylashtiring
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsManualInputVisible(false)}
                    style={[
                      styles.modalCloseBtn,
                      { backgroundColor: isDark ? "rgba(244,63,94,0.1)" : Palette.rose50 },
                    ]}
                  >
                    <Ionicons name="close" size={20} color={Palette.rose500} />
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, padding: 16 }}>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        flex: 1,
                        height: undefined,
                        minHeight: 200,
                        textAlignVertical: "top",
                        backgroundColor: theme.inputBackground,
                        color: theme.text,
                        borderColor: theme.inputBorder,
                        padding: 14,
                        lineHeight: 22,
                      },
                    ]}
                    multiline
                    value={manualTextInput}
                    onChangeText={setManualTextInput}
                    placeholder={"Format namunalari:\napple - olma\nbook - kitob\nschool : maktab\ncomputer kompyuter"}
                    placeholderTextColor={theme.muted}
                  />
                </View>

                <View
                  style={[
                    styles.modalFooter,
                    {
                      borderTopColor: theme.divider,
                      backgroundColor: theme.card,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.tint, width: "100%" }]}
                    onPress={handleProcessManualText}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="sparkles" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>So'zlarni ajratib olish</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  screenTitle: {
    ...Typography.headingLarge,
    fontWeight: "800",
  },
  screenSubtitle: {
    ...Typography.bodyMedium,
  },
  editingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: UI.borderRadius.pill,
  },
  editingBadgeText: {
    ...Typography.caption,
    fontWeight: "700",
  },
  cancelEditBtn: {
    width: 36,
    height: 36,
    borderRadius: UI.borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  // Pair Selector Strip
  pairSelectorWrapper: {
    marginBottom: 20,
  },
  pairSelectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionCaption: {
    ...Typography.overline,
    letterSpacing: 1,
  },
  swapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: UI.borderRadius.pill,
  },
  swapButtonText: {
    ...Typography.labelSmall,
    fontWeight: "700",
  },
  pairChipsContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  pairChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: UI.borderRadius.large,
    gap: 8,
  },
  pairChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pairChipText: {
    ...Typography.labelSmall,
  },

  // OCR Banner
  scanBannerSection: {
    marginBottom: 24,
  },
  scanBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: UI.borderRadius.large,
    borderWidth: 1,
  },
  scanBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  scanIconBox: {
    width: 44,
    height: 44,
    borderRadius: UI.borderRadius.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBannerText: {
    flex: 1,
    gap: 2,
  },
  scanBannerTitle: {
    ...Typography.labelLarge,
    fontWeight: "700",
  },
  scanBannerSub: {
    ...Typography.caption,
  },
  scanLoading: {
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  scanLoadingText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  scanButtonsGroup: {
    flexDirection: "row",
    gap: 6,
    marginLeft: 8,
  },
  scanPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: UI.borderRadius.pill,
  },
  scanPillText: {
    ...Typography.labelSmall,
    fontWeight: "700",
  },

  // Input Fields
  inputsContainer: {
    gap: 16,
    marginBottom: 28,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
  },
  fieldTag: {
    backgroundColor: Palette.emerald500 + "18",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: UI.borderRadius.pill,
  },
  fieldTagText: {
    ...Typography.caption,
    fontWeight: "800",
    color: Palette.emerald500,
  },
  fieldLabel: {
    ...Typography.labelLarge,
    fontWeight: "700",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: UI.borderRadius.large,
    paddingHorizontal: 16,
    height: 54,
  },
  textInput: {
    flex: 1,
    height: "100%",
    ...Typography.bodyLarge,
  },
  clearInputBtn: {
    padding: 4,
  },
  errorText: {
    ...Typography.caption,
    color: Palette.rose500,
    fontWeight: "600",
    paddingHorizontal: 4,
  },

  // Save Button
  saveBtnContainer: {
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: UI.borderRadius.large,
  },
  saveButtonText: {
    color: "#fff",
    ...Typography.headingSmall,
    fontWeight: "700",
  },

  // OCR Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.headingMedium,
    fontWeight: "700",
  },
  modalSubtitle: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  toggleSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: UI.borderRadius.pill,
  },
  toggleSelectBtnText: {
    ...Typography.caption,
    fontWeight: "700",
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: UI.borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  modalListContent: {
    padding: 16,
    gap: 12,
  },
  scannedWordCard: {
    padding: 14,
    borderRadius: UI.borderRadius.medium,
    borderWidth: 1,
  },
  scannedWordCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  scannedWordActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: UI.borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  scannedWordContent: {
    gap: 4,
  },
  scannedWordTitle: {
    ...Typography.labelLarge,
    fontWeight: "700",
  },
  scannedWordTranslation: {
    ...Typography.bodyMedium,
  },
  modalInput: {
    height: 44,
    borderRadius: UI.borderRadius.medium,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 8,
    ...Typography.bodyMedium,
  },
  modalEditButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: UI.borderRadius.medium,
  },
  modalBtnText: {
    color: "#fff",
    ...Typography.labelSmall,
    fontWeight: "700",
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
});
