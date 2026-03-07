import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import {
  addMultipleWords,
  addWord,
  updateWord,
  Word,
} from "@/storage/wordStorage";
import { MotiView } from "@/utils/moti-wrapper";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
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
} from "react-native";
import Toast from "react-native-toast-message";

type Step = "selection" | "form";
type Mode = "uz-en" | "en-uz" | "uz-ru" | "ru-uz" | "en-ru" | "ru-en";

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
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const [step, setStep] = useState<Step>("selection");
  const [mode, setMode] = useState<Mode>("uz-en");
  const [uz, setUz] = useState("");
  const [en, setEn] = useState("");
  const [ru, setRu] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
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

    if ((needsUz && !uz) || (needsEn && !en) || (needsRu && !ru)) {
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
    } else {
      await addWord(wordData);
    }

    Toast.show({
      type: "success",
      text1: t("success"),
      text2: editId ? t("wordUpdated") : t("wordSaved"),
    });

    // Clear state after successful save
    setUz("");
    setEn("");
    setRu("");
    setEditId(null);
  };

  const selectMode = (selectedMode: Mode) => {
    setMode(selectedMode);
    setStep("form");
  };

  const handleBack = () => {
    setStep("selection");
    setEditId(null);
    setUz("");
    setEn("");
    setRu("");
    setImageUri(null);
  };

  const processImageWithVisionAPI = async (base64Image: string) => {
    try {
      setLoadingImage(true);

      const formData = new FormData();
      formData.append("base64Image", `data:image/jpeg;base64,${base64Image}`);
      formData.append("language", "eng");
      formData.append("isOverlayRequired", "false");

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: "helloworld",
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

      // Regex logic format: "354. Rough (raf) - qo'pol" or "Rough - qo'pol"
      const regex =
        /^\d*\.?\s*([a-zA-Z'\- ]+?)(?:\s*\(([^)]+)\))?\s*[-–—]\s*(.+)$/;

      const extractedWords: ScannedWord[] = [];

      // Split by new lines to process row by row
      const lines = fullText.split("\n");

      for (const line of lines) {
        const match = line.trim().match(regex);
        if (match) {
          const word = match[1].trim();
          const pronunciation = match[2] ? match[2].trim() : undefined;
          const translation = match[3].trim();

          if (word && translation) {
            extractedWords.push({
              id: Date.now().toString() + Math.random().toString(),
              word,
              pronunciation,
              translation,
              selected: true,
            });
          }
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
    setScannedWords((prev) => prev.filter((word) => word.id !== id));
    if (scannedWords.length === 1) {
      // If it was the last one
      setIsModalVisible(false);
    }
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

      // For simplicity, we ASSUME the extracted word is the "from" language
      // and the translation is the "to" language based on the current mode.
      // Example: Mode uz-en -> extracted word is UZ, translation is EN.

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

        // Keep pronunciation together with the word if needed, or handle it differently based on app structure.
        // Currently putting it with EN for demonstration if EN exists
        if (scanned.pronunciation && needsEn) {
          wordData.en = `${wordData.en} (${scanned.pronunciation})`;
        }

        return wordData;
      });

      await addMultipleWords(wordsToAdd);

      setIsModalVisible(false);
      setScannedWords([]);

      Toast.show({
        type: "success",
        text1: "Muvaffaqiyatli",
        text2: `${selectedWordsToSave.length} ta so'z saqlandi!`,
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
                backgroundColor: isDark ? "#1C1E1F" : "#f9fafb",
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
                backgroundColor: isDark ? "#1C1E1F" : "#f9fafb",
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
                backgroundColor: isDark ? "#1C1E1F" : "#f9fafb",
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
              <Text style={styles.modalBtnText}>Bekor qilish</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                { backgroundColor: "#10b981", marginLeft: 10 },
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
            backgroundColor: isDark ? "#1C1E1F" : "#FFF",
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
      <View
        style={[
          styles.container,
          styles.scrollContent,
          { backgroundColor: theme.background },
        ]}
      >
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 250 }}
        >
          <Text style={[styles.title, { color: theme.text }]}>
            {t("selectPair")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
            {t("chooseLanguages")}
          </Text>
        </MotiView>

        <View style={styles.grid}>
          {MODES.map((m, index) => (
            <MotiView
              key={m.id}
              from={{ opacity: 0, scale: 0.9, translateY: 15 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 200, delay: index * 60 }}
            >
              <TouchableOpacity
                key={m.id + "_btn"}
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
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      </View>
    );
  }

  const showUz = mode.includes("uz");
  const showEn = mode.includes("en");
  const showRu = mode.includes("ru");

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
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
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: isDark ? "#2A2C2E" : "#eee" },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {`Topilgan so'zlar (${scannedWords.filter((w) => w.selected).length})`}
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
                borderTopColor: isDark ? "#2A2C2E" : "#eee",
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
                {"Tanlanganlarni lug’atga qo’shish"}
              </Text>
            </TouchableOpacity>
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
                  backgroundColor: isDark ? "#1C1E1F" : "#FFF",
                  borderColor: isDark ? "#2A2C2E" : "#eee",
                },
              ]}
              onPress={handleTakePhoto}
            >
              <MaterialIcons name="photo-camera" size={32} color={theme.tint} />
              <Text style={[styles.iconButtonText, { color: theme.text }]}>
                Kameradan olish
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDark ? "#1C1E1F" : "#FFF",
                  borderColor: isDark ? "#2A2C2E" : "#eee",
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
                Galereyadan tanlash
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
            placeholderTextColor={isDark ? "#666" : "#999"}
            value={uz}
            onChangeText={setUz}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#1C1E1F" : "#FFF",
                borderColor: isDark ? "#2A2C2E" : "#eee",
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
            placeholderTextColor={isDark ? "#666" : "#999"}
            value={en}
            onChangeText={setEn}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#1C1E1F" : "#FFF",
                borderColor: isDark ? "#2A2C2E" : "#eee",
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
            placeholder={`${t("example")}: Яbloko`}
            placeholderTextColor={isDark ? "#666" : "#999"}
            value={ru}
            onChangeText={setRu}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#1C1E1F" : "#FFF",
                borderColor: isDark ? "#2A2C2E" : "#eee",
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, paddingTop: 60 },
  scrollContent: { paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: "800" },
  subtitle: { fontSize: 16, marginBottom: 30 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    // horizontal spacing handled by space-between
  },
  card: {
    width: "100%",
    margin: 10,
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
    justifyContent: "space-between",
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
  form: {
    /* vertical spacing handled by marginBottom on sections */
  },
  inputGroup: {
    /* add marginBottom to inputs instead */
  },
  label: { fontSize: 14, fontWeight: "600", marginLeft: 4 },
  input: {
    borderWidth: 1.5,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#16a34a",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  imagePickerContainer: {
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  imageButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    // horizontal spacing via justifyContent
  },
  iconButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    // gap replaced by marginTop on text
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconButtonText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
  },
  // Modal & Scanned Words Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50, // for notch
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalCloseBtn: {
    padding: 5,
  },
  modalListContent: {
    padding: 20,
    paddingBottom: 40,
    // child cards already have marginBottom
  },
  scannedWordCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scannedWordCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  switchContainer: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
    marginLeft: -5,
  },
  scannedWordActions: {
    flexDirection: "row",
    // we use marginRight on each button for spacing
  },
  actionBtn: {
    padding: 5,
    marginRight: 15,
  },
  scannedWordContent: {
    paddingLeft: 5,
  },
  scannedWordTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  scannedWordTranslation: {
    fontSize: 16,
    opacity: 0.8,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    paddingBottom: 40,
  },
  // Edit Input Styles
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  modalEditButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    // spacing via marginLeft on buttons
    marginTop: 5,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
