import { IconSymbol } from "@/components/ui/icon-symbol";
import { UI } from "@/constants/theme";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import {
  addMultipleWords,
  addWord,
  updateWord,
} from "@/storage/wordStorage";
import { Word } from "@/types/Word";
import { MotiView } from "@/utils/moti-wrapper";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
  useWindowDimensions
} from "react-native";
import Toast from "react-native-toast-message";

type Step = "selection" | "form";
type Mode = "uz-en" | "en-uz" | "uz-ru" | "ru-uz" | "en-ru" | "ru-en";

const OCR_API_KEY = "helloworld"; // TODO: .env fayliga ko'chiring: EXPO_PUBLIC_OCR_API_KEY

const MODES: { id: Mode; from: string; to: string }[] = [
  { id: "uz-en", from: "UZ", to: "EN" },
  { id: "uz-ru", from: "UZ", to: "RU" },
  { id: "en-uz", from: "EN", to: "UZ" },
  { id: "en-ru", from: "EN", to: "RU" },
  { id: "ru-uz", from: "RU", to: "UZ" },
  { id: "ru-en", from: "RU", to: "EN" },
];

interface ScannedWord {
  id: string;
  word: string;
  pronunciation?: string;
  translation: string;
  selected: boolean;
}

export default function AddWordScreen() {
  const { width } = useWindowDimensions();
  const numColumns = width > 768 ? 3 : width > 350 ? 2 : 1;
  const availableWidth = width > 900 ? 900 - (UI.padding * 2) : width - (UI.padding * 2);
  const cardWidth = (availableWidth - (16 * (numColumns - 1))) / numColumns;

  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const [step, setStep] = useState<Step>("selection");
  const [mode, setMode] = useState<Mode>("uz-en");
  const [uz, setUz] = useState("");
  const [en, setEn] = useState("");
  const [ru, setRu] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{uz?: boolean, en?: boolean, ru?: boolean}>({});
  const [, setImageUri] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [scannedWords, setScannedWords] = useState<ScannedWord[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Edit state for scanned words
  const [editingScannedWordId, setEditingScannedWordId] = useState<
    string | null
  >(null);
  const [editScannedWordText, setEditScannedWordText] = useState("");
  const [editScannedPronunciationText, setEditScannedPronunciationText] =
    useState("");
  const [editScannedTranslationText, setEditScannedTranslationText] =
    useState("");

  useEffect(() => {
    if (params.id && params.id !== editId) {
      setEditId(params.id as string);
      setUz((params.uz as string) || "");
      setEn((params.en as string) || "");
      setRu((params.ru as string) || "");
      setMode(params.mode as Mode);
      setStep("form");
    }
  }, [params.id, params.uz, params.en, params.ru, params.mode, editId]);

  const handleSave = async () => {
    Keyboard.dismiss();
    const needsUz = mode.includes("uz");
    const needsEn = mode.includes("en");
    const needsRu = mode.includes("ru");

    const newErrors = {
      uz: needsUz && !uz,
      en: needsEn && !en,
      ru: needsRu && !ru,
    };
    setErrors(newErrors);

    if (newErrors.uz || newErrors.en || newErrors.ru) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("fillRequired"),
      });
      return;
    }

    const wordData = {
      id: editId || Date.now().toString(),
      uz: needsUz ? uz : "",
      en: needsEn ? en : "",
      ru: needsRu ? ru : "",
      date: new Date().toISOString().split("T")[0],
      mode,
    };

    if (editId) {
      await updateWord(wordData);
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("wordUpdated"),
      });
      setUz("");
      setEn("");
      setRu("");
      setEditId(null);
      setStep("selection");
    } else {
      await addWord(wordData);
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("wordSaved"),
      });
      setUz("");
      setEn("");
      setRu("");
    }
  };

  const selectMode = (selectedMode: Mode) => {
    setMode(selectedMode);
    setStep("form");
    setErrors({});
    if (!editId) {
      setUz("");
      setEn("");
      setRu("");
    }
  };

  const handleBack = () => {
    setStep("selection");
    setEditId(null);
    setUz("");
    setEn("");
    setRu("");
    setErrors({});
    setImageUri(null);
  };

  const processImageWithVisionAPI = async (base64Image: string) => {
    try {
      setLoadingImage(true);

      const formData = new FormData();
      formData.append("base64Image", `data:image/jpeg;base64,${base64Image}`);
      formData.append("language", "eng");
      formData.append("isOverlayRequired", "false");
      formData.append("isTable", "true");

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: OCR_API_KEY,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.IsErroredOnProcessing) {
        const errorMessage =
          result.ErrorMessage && Array.isArray(result.ErrorMessage)
            ? result.ErrorMessage.join(", ")
            : "OCR API noma'lum xatolik qaytardi";
        throw new Error(errorMessage);
      }

      let fullText = "";
      if (result.ParsedResults && result.ParsedResults.length > 0) {
        fullText = result.ParsedResults[0].ParsedText;
      } else {
        throw new Error("Matnni aniqlab bo'lmadi");
      }

      // Regex logic format: 
      // 1. "354. Rough (raf) - qo'pol"
      // 2. "Rough - qo'pol"
      // 3. "A bit\tBiroz" (Table format)
      // We look for dashes, equals, colons, or tabs as separators.
      const regex = /^\d*\.?\s*([a-zA-Z'\- ]+?)(?:\s*\(([^)]+)\))?\s*(?:[-–—=:\t]|\s{2,})\s*(.+)$/;

      const extractedWords: ScannedWord[] = [];
      const lines = fullText.split(/\r?\n/);

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        let match = cleanLine.match(regex);
        let word = "";
        let translation = "";
        let pronunciation = undefined;
        
        if (match) {
          word = match[1].trim();
          pronunciation = match[2] ? match[2].trim() : undefined;
          translation = match[3].trim();
        } else {
          // Fallback parsing for lines that didn't match the standard delimiters
          if (cleanLine.length > 3 && cleanLine.includes(" ")) {
            // Check if there's a big gap (more than 1 space)
            const gapMatch = cleanLine.match(/^(.*?)\s{2,}(.*)$/);
            if (gapMatch) {
                word = gapMatch[1].trim();
                translation = gapMatch[2].trim();
            } else {
                // No big gap. Just words separated by a single space.
                // We assume the last word is the translation and everything before is the word.
                // e.g., "A little bit Birozgina" -> word="A little bit", trans="Birozgina"
                const parts = cleanLine.split(" ");
                if (parts.length >= 2) {
                   translation = parts.pop() || "";
                   word = parts.join(" ");
                }
            }
          }
        }

        if (word && translation) {
          // Filter out table headers
          if (word.toLowerCase() === 'english' || translation.toLowerCase() === 'uzbek' || translation.toLowerCase() === 'russian') {
             continue;
          }
          
          // Clean up numbering (e.g. "1. Word" or "1) Word")
          word = word.replace(/^\d+[\.\)]\s*/, '');

          extractedWords.push({
            id: Date.now().toString() + Math.random().toString(),
            word,
            pronunciation,
            translation,
            selected: true,
          });
        }
      }

      setScannedWords(extractedWords);

      if (extractedWords.length > 0) {
        setIsModalVisible(true);
      } else {
        Alert.alert(
          "Ma'lumot topilmadi",
          "Rasmdan mos formatdagi so'zlar aniqlanmadi.",
        );
      }
    } catch (error: any) {
      console.error("OCR API error:", error);
      Alert.alert(
        t("error") || "Xatolik",
        `Rasm o'qishda xatolik yuz berdi: ${error?.message || JSON.stringify(error)}`,
      );
    } finally {
      setLoadingImage(false);
    }
  };

  const handlePickImage = async () => {
    try {
      setLoadingImage(true);
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          t("error") || "Xatolik",
          "Galereyaga kirish uchun ruxsat kerak!",
        );
        setLoadingImage(false);
        return;
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      } as any;
      (pickerOptions as any).usePicker = true;
      (pickerOptions as any).legacy = true;
      const result = await ImagePicker.launchImageLibraryAsync(
        pickerOptions as any,
      );

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        console.log("Tanlangan rasm URI:", uri);
        setImageUri(uri);

        // Resize and compress image
        const manipResult = await manipulateAsync(
          uri,
          [{ resize: { width: 1000 } }],
          { compress: 0.7, format: SaveFormat.JPEG, base64: true },
        );

        if (manipResult.base64) {
          await processImageWithVisionAPI(manipResult.base64);
        }
      }
    } catch (error: any) {
      console.error("Rasm tanlashda xatolik:", error);
      Alert.alert(
        t("error") || "Xatolik",
        `Rasm tanlashda xatolik yuz berdi: ${error?.message || JSON.stringify(error)}`,
      );
    } finally {
      setLoadingImage(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setLoadingImage(true);
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          t("error") || "Xatolik",
          "Kameraga kirish uchun ruxsat kerak!",
        );
        setLoadingImage(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        console.log("Olingan rasm URI:", uri);
        setImageUri(uri);

        // Resize and compress image
        const manipResult = await manipulateAsync(
          uri,
          [{ resize: { width: 1000 } }],
          { compress: 0.7, format: SaveFormat.JPEG, base64: true },
        );

        if (manipResult.base64) {
          await processImageWithVisionAPI(manipResult.base64);
        }
      }
    } catch (error: any) {
      console.error("Rasm olishda xatolik:", error);
      Alert.alert(
        t("error") || "Xatolik",
        `Rasm olishda xatolik yuz berdi: ${error?.message || JSON.stringify(error)}`,
      );
    } finally {
      setLoadingImage(false);
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
      Alert.alert(
        t("error") || "Xatolik",
        "So'z va tarjima bo'sh bo'lishi mumkin emas!",
      );
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

  const cancelEditingScannedWord = () => {
    setEditingScannedWordId(null);
  };

  const saveSelectedWords = async () => {
    const selectedWordsToSave = scannedWords.filter((w) => w.selected);

    if (selectedWordsToSave.length === 0) {
      Alert.alert(
        t("error") || "Xatolik",
        "Saqlash uchun hech qanday so'z tanlanmagan.",
      );
      return;
    }

    try {
      const needsUz = mode.includes("uz");
      const needsEn = mode.includes("en");
      const needsRu = mode.includes("ru");

      const wordsToAdd: Word[] = selectedWordsToSave.map((scanned) => {
        const wordData: Word = {
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

        return wordData;
      });

      await addMultipleWords(wordsToAdd);

      setIsModalVisible(false);
      setScannedWords([]);

      Toast.show({
        type: "success",
        text1: t("success"),
        text2: `${selectedWordsToSave.length} ${t("wordsAddedCount")}`,
      });
    } catch (error) {
      console.error("Error saving scanned words:", error);
      Alert.alert(
        t("error") || "Xatolik",
        "So'zlarni saqlashda xatolik yuz berdi",
      );
    }
  };

  const renderScannedWordItem = ({ item }: { item: ScannedWord }) => {
    const isEditing = editingScannedWordId === item.id;

    if (isEditing) {
      return (
        <View
          style={[
            styles.scannedWordCard,
            {
              backgroundColor: isDark ? "#2A2C2E" : "#FFF",
              borderColor: isDark ? "#3A3C3E" : "#e5e7eb",
            },
          ]}
        >
          <TextInput
            style={[
              styles.modalInput,
              {
                backgroundColor: isDark ? "#111827" : "#f9fafb",
                color: theme.text,
                borderColor: isDark ? "#3A3C3E" : "#e5e7eb",
              },
            ]}
            value={editScannedWordText}
            onChangeText={setEditScannedWordText}
            placeholder={"So'z"}
            placeholderTextColor={isDark ? "#888" : "#999"}
          />
          <TextInput
            style={[
              styles.modalInput,
              {
                backgroundColor: isDark ? "#111827" : "#f9fafb",
                color: theme.text,
                borderColor: isDark ? "#3A3C3E" : "#e5e7eb",
              },
            ]}
            value={editScannedPronunciationText}
            onChangeText={setEditScannedPronunciationText}
            placeholder="Talaffuzi (ixtiyoriy)"
            placeholderTextColor={isDark ? "#888" : "#999"}
          />
          <TextInput
            style={[
              styles.modalInput,
              {
                backgroundColor: isDark ? "#111827" : "#f9fafb",
                color: theme.text,
                borderColor: isDark ? "#3A3C3E" : "#e5e7eb",
              },
            ]}
            value={editScannedTranslationText}
            onChangeText={setEditScannedTranslationText}
            placeholder={"Tarjimasi"}
            placeholderTextColor={isDark ? "#888" : "#999"}
          />
          <View style={styles.modalEditButtonsRow}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#ef4444" }]}
              onPress={cancelEditingScannedWord}
            >
              <Text style={styles.modalBtnText}>{t("cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                { backgroundColor: "#10b981", marginLeft: 10 },
              ]}
              onPress={saveEditedScannedWord}
            >
              <Text style={styles.modalBtnText}>{t("save")}</Text>
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
            backgroundColor: isDark ? "#111827" : "#FFF",
            borderColor: isDark ? "#2A2C2E" : "#e5e7eb",
          },
          !item.selected && { opacity: 0.6 },
        ]}
      >
        <View style={styles.scannedWordCardHeader}>
          <View style={styles.switchContainer}>
            <Switch
              value={item.selected}
              onValueChange={() => toggleScannedWordSelection(item.id)}
              trackColor={{ false: "#767577", true: theme.tint }}
              thumbColor={item.selected ? "#fff" : "#f4f3f4"}
            />
          </View>
          <View style={styles.scannedWordActions}>
            <TouchableOpacity
              onPress={() => startEditingScannedWord(item)}
              style={styles.actionBtn}
            >
              <AntDesign name="edit" size={20} color={theme.tint} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteScannedWord(item.id)}
              style={[styles.actionBtn, { marginRight: 0 }]}
            >
              <AntDesign name="delete" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.scannedWordContent}>
          <Text style={[styles.scannedWordTitle, { color: theme.text }]}>
            {item.word}{" "}
            {item.pronunciation ? (
              <Text style={{ color: "#8b5cf6" }}>({item.pronunciation})</Text>
            ) : (
              ""
            )}
          </Text>
          <Text style={[styles.scannedWordTranslation, { color: theme.text }]}>
            {item.translation}
          </Text>
        </View>
      </View>
    );
  };

  if (step === "selection") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={[styles.contentWrapper, { paddingBottom: Platform.OS === "web" ? 120 : 40, alignItems: 'center' }]}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 250 }}
            style={{ marginBottom: UI.spacing.xl, width: "100%" }}
          >
            <Text style={[styles.title, { color: theme.text }]}>
              {t("selectPair")}
            </Text>
            <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
              {t("selectLanguage")}
            </Text>
          </MotiView>

          <View style={styles.grid}>
            {MODES.map((m, index) => (
              <MotiView
                key={m.id}
                from={{ opacity: 0, scale: 0.9, translateY: 15 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 200, delay: index * 60 }}
                style={[styles.cardWrapper, { width: cardWidth }]}
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
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  const showUz = mode.includes("uz");
  const showEn = mode.includes("en");
  const showRu = mode.includes("ru");

  return (
    <ScrollView
      style={[styles.scrollContainer, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.contentWrapper}>
        <MotiView
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: 200 }}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color={theme.tint} />
          </TouchableOpacity>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 250 }}
        >
          <Text style={[styles.title, { color: theme.text }]}>
            {editId ? t("editWord") : t("newWord")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
            {editId
              ? t("updateWord")
              : `${t("enterTranslation")} (${mode.toUpperCase()})`}
          </Text>
        </MotiView>

        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={Platform.OS === "web"}
          presentationStyle={Platform.OS === "web" ? "overFullScreen" : "pageSheet"}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={Platform.OS === "web" ? { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 } : { flex: 1 }}>
            <View
              style={[
                styles.modalContainer, 
                { backgroundColor: theme.background },
                Platform.OS === "web" && { width: "100%", maxWidth: 600, maxHeight: "90%", borderRadius: 16, overflow: "hidden" }
              ]}
            >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: theme.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {`${t("foundWords")} (${scannedWords.filter((w) => w.selected).length})`}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <AntDesign name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={scannedWords}
              keyExtractor={(item) => item.id}
              renderItem={renderScannedWordItem}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
            />

            <View
              style={[
                styles.modalFooter,
                {
                  borderTopColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.tint, width: "100%", marginTop: 0 },
                ]}
                onPress={saveSelectedWords}
              >
                <Text style={styles.buttonText}>
                  {t("saveToVocabulary")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          </View>
        </Modal>

        <View style={styles.form}>
          {loadingImage ? (
            <ActivityIndicator size="large" color={theme.tint} />
          ) : (
            <View style={styles.imageButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleTakePhoto}
              >
                <MaterialIcons name="photo-camera" size={32} color={theme.tint} />
                <Text style={[styles.iconButtonText, { color: theme.text }]}>
                  {t("takePhoto")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handlePickImage}
              >
                <MaterialIcons
                  name="photo-library"
                  size={32}
                  color={theme.tint}
                />
                <Text style={[styles.iconButtonText, { color: theme.text }]}>
                  {t("chooseFromGallery")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {showUz && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              {t("uzbek")}
            </Text>
            <TextInput
              placeholder={`${t("example")}: Olma`}
              placeholderTextColor={theme.muted}
              value={uz}
              onChangeText={(text) => { setUz(text); setErrors(e => ({...e, uz: false})); }}
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: errors.uz ? "#ef4444" : theme.border,
                  color: theme.text,
                },
              ]}
            />
          </View>
        )}

        {showEn && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              {t("english")}
            </Text>
            <TextInput
              placeholder={`${t("example")}: Apple`}
              placeholderTextColor={theme.muted}
              value={en}
              onChangeText={(text) => { setEn(text); setErrors(e => ({...e, en: false})); }}
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: errors.en ? "#ef4444" : theme.border,
                  color: theme.text,
                },
              ]}
            />
          </View>
        )}

        {showRu && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              {t("russian")}
            </Text>
            <TextInput
              placeholder={`${t("example")}: Яблоко`}
              placeholderTextColor={theme.muted}
              value={ru}
              onChangeText={(text) => { setRu(text); setErrors(e => ({...e, ru: false})); }}
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: errors.ru ? "#ef4444" : theme.border,
                  color: theme.text,
                },
              ]}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.tint }]}
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>
            {editId ? t("updateWord") : t("saveWord")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
    // alignItems must NOT be here for ScrollView — put it in contentContainerStyle
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === "web" ? 120 : 40,
    alignItems: "center", 
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 900, // Max width for large screens
    padding: UI.padding,
    paddingTop: 60,
  },
  header: {
    marginBottom: UI.spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: UI.spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  cardWrapper: {
    width: "48.5%",
    marginBottom: UI.spacing.md,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: UI.spacing.sm,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  form: {
    marginBottom: UI.spacing.lg,
  },
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: UI.spacing.md,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginBottom: UI.spacing.md,
  },
  inputGroup: {
    marginBottom: UI.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: UI.spacing.sm,
    marginLeft: 4,
  },
  input: {
    borderRadius: UI.borderRadius.medium,
    borderWidth: 1,
    paddingHorizontal: UI.spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "500",
  },
  button: {
    paddingVertical: 16,
    borderRadius: UI.borderRadius.medium,
    alignItems: "center",
    marginTop: UI.spacing.lg,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  imageButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: UI.spacing.md,
  },
  iconButton: {
    flex: 1,
    borderRadius: UI.borderRadius.medium,
    borderWidth: 1,
    padding: UI.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: UI.spacing.xs,
    textAlign: "center",
  },
  // Modal & Scanned Words Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: UI.padding,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  modalCloseBtn: {
    padding: 5,
  },
  modalListContent: {
    padding: UI.padding,
    paddingBottom: 40,
  },
  scannedWordCard: {
    borderWidth: 1,
    borderRadius: UI.borderRadius.large,
    padding: UI.spacing.md,
    marginBottom: UI.spacing.md,
  },
  scannedWordCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: UI.spacing.sm,
  },
  switchContainer: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
    marginLeft: -5,
  },
  scannedWordActions: {
    flexDirection: "row",
    gap: UI.spacing.md,
  },
  actionBtn: {
    padding: 5,
  },
  scannedWordContent: {
    paddingLeft: 5,
  },
  scannedWordTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  scannedWordTranslation: {
    fontSize: 16,
    opacity: 0.8,
  },
  modalFooter: {
    padding: UI.padding,
    borderTopWidth: 1,
    paddingBottom: 40,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: UI.borderRadius.small,
    padding: UI.spacing.sm,
    fontSize: 16,
    marginBottom: UI.spacing.sm,
  },
  modalEditButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: UI.spacing.sm,
    marginTop: UI.spacing.xs,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: UI.borderRadius.small,
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
