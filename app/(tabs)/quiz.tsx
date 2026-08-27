import QuizOption from "@/components/QuizOption";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UI } from "@/constants/theme";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { getWords, updateWord } from "@/storage/wordStorage";
import { calculateSRS } from "@/utils/srs";
import { Word } from "@/types/Word";
import { generateQuiz, QuizMode } from "@/utils/generateQuiz";
import { MotiView } from "@/utils/moti-wrapper";
import {
  isExpoGo,
  SpeechRecModule,
  useSpeechRecEventSafe,
} from "@/utils/speech-manager";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const QUIZ_MODES: { id: QuizMode; from: string; to: string }[] = [
  { id: "uz-en", from: "UZ", to: "EN" },
  { id: "en-uz", from: "EN", to: "UZ" },
  { id: "uz-ru", from: "UZ", to: "RU" },
  { id: "ru-uz", from: "RU", to: "UZ" },
  { id: "en-ru", from: "EN", to: "RU" },
  { id: "ru-en", from: "RU", to: "EN" },
];

export default function QuizScreen() {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const [mode, setMode] = useState<QuizMode>("uz-en");
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const bottomPad = Math.max(40, tabBarHeight);

  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isListening, setIsListening] = useState(false);

  const timerRef = useRef<any>(null);

  useSpeechRecEventSafe("start", () => setIsListening(true));
  useSpeechRecEventSafe("end", () => setIsListening(false));
  useSpeechRecEventSafe("result", (event: any) => {
    if (event.results && event.results.length > 0) {
      setUserInput(event.results[0]?.transcript);
    }
  });
  useSpeechRecEventSafe("error", (event: any) => {
    console.log("Speech recognition error:", event.error, event.message);
    setIsListening(false);
  });

  const startListening = async () => {
    if (isExpoGo) {
      Toast.show({
        type: "error",
        text1: t("error") || "Error",
        text2: "Speech recognition is not supported in Expo Go",
      });
      return;
    }
    try {
      const permissions = await SpeechRecModule?.requestPermissionsAsync();
      if (!permissions?.granted) {
        console.warn("Speech recognition permissions not granted");
        return;
      }

      setUserInput("");
      const [, to] = mode.split("-");
      const langMap: Record<string, string> = {
        en: "en-US",
        uz: "uz-UZ",
        ru: "ru-RU",
      };

      await SpeechRecModule?.start({
        lang: langMap[to] || "en-US",
        interimResults: true,
      });
    } catch (e) {
      console.error("Error starting speech recognition:", e);
    }
  };

  const stopListening = async () => {
    try {
      await SpeechRecModule?.stop();
    } catch (e) {
      console.error("Error stopping speech recognition:", e);
    }
  };

  const handleConfirm = () => {
    if (isConfirmed) return;
    const currentQuiz = sessionQuestions[currentIndex];
    const isInputType = currentQuiz.type === "input" || currentQuiz.type === "speech";

    if (!isInputType && !selectedOption) return;
    if (isInputType && !userInput.trim()) return;

    if (currentQuiz.type === "speech" && isListening) {
      stopListening();
    }

    const isCorrect = isInputType
      ? userInput.trim().toLowerCase() === currentQuiz.correctAnswer.trim().toLowerCase()
      : selectedOption === currentQuiz.correctAnswer;

    const quality = isCorrect ? (isInputType ? 4 : 5) : 0; 
    const updatedSrsFields = calculateSRS(currentQuiz.word, quality);
    const updatedWord = { ...currentQuiz.word, ...updatedSrsFields };
    updateWord(updatedWord).catch(console.error);

    if (isCorrect) {
      setScore((s) => s + 1);
      Toast.show({
        type: "success",
        text1: t("correct"),
        text2: t("greatJob"),
      });
    } else {
      Toast.show({
        type: "error",
        text1: t("incorrect"),
        text2: `${t("correctIs")} ${currentQuiz.correctAnswer}`,
      });
    }
    setIsConfirmed(true);

    // Auto-advance after 2 seconds to give user time to see result
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleNext();
    }, 2000);
  };

  const startQuiz = useCallback((allWords: Word[], currentMode: QuizMode) => {
    const modeParts = currentMode.split("-") as [keyof Word, keyof Word];
    const to = modeParts[1];
    const modeWords = (allWords || []).filter((w) => !!w[modeParts[0]] && !!w[to]);

    if (modeWords.length >= 4) {
      const today = new Date().toISOString().split("T")[0];
      const dueWords = modeWords.filter(w => !w.nextReviewDate || w.nextReviewDate <= today);
      const nonDueWords = modeWords.filter(w => w.nextReviewDate && w.nextReviewDate > today).sort(() => Math.random() - 0.5);

      let targetWords = [];
      if (dueWords.length >= 10) {
        targetWords = dueWords.sort(() => Math.random() - 0.5).slice(0, 10);
      } else {
        targetWords = [...dueWords, ...nonDueWords.slice(0, 10 - dueWords.length)];
      }

      const questionsCount = Math.min(10, targetWords.length);
      const shuffledQuestions = targetWords.slice(0, questionsCount).sort(() => Math.random() - 0.5);
      
      const allowedTypes = ["multiple", "input"];
      if (!isExpoGo) {
        allowedTypes.push("speech");
      }

      const questions = shuffledQuestions.map((w) =>
        generateQuiz(modeWords, currentMode, w, allowedTypes),
      );

      setSessionQuestions(questions);
      setCurrentIndex(0);
      setScore(0);
      setSelectedOption(null);
      setUserInput("");
      setIsConfirmed(false);
      setIsFinished(false);
      setStartTime(Date.now());
      setTotalTime(0);
    } else {
      setSessionQuestions([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setIsLoading(true);
        const data = await getWords();
        setWords(data);
        startQuiz(data, mode);
        setIsLoading(false);
      };
      load();
    }, [mode, startQuiz]),
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const changeMode = (newMode: QuizMode) => {
    setMode(newMode);
    startQuiz(words, newMode);
  };

  const handleSelect = (option: string) => {
    if (!isConfirmed) {
      setSelectedOption(option);
    }
  };

  const handleNext = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setUserInput("");
      setIsConfirmed(false);
    } else {
      setTotalTime(Math.round((Date.now() - startTime) / 1000));
      setIsFinished(true);
    }
  }, [currentIndex, sessionQuestions.length, startTime]);

  if (isFinished) {
    const percentage = Math.round((score / sessionQuestions.length) * 100);
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Platform.OS === "web" ? 120 : 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            <MotiView
              from={{ opacity: 0, translateY: -15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 250 }}
              style={styles.header}
            >
              <Text style={[styles.title, { color: theme.text }]}>
                {t("results")}
              </Text>
            </MotiView>
            <MotiView
              from={{ opacity: 0, translateY: 50, scale: 0.9 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: "timing", duration: 250, delay: 100 }}
              style={[
                styles.resultsCard,
                { backgroundColor: isDark ? "#111827" : "#fff" },
              ]}
            >
              <MotiView
                from={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "timing", duration: 200, delay: 200 }}
              >
                <IconSymbol
                  name={
                    percentage >= 70 ? "checkmark.circle.fill" : "xmark.circle.fill"
                  }
                  size={80}
                  color={theme.tint}
                />
              </MotiView>
              <Text style={[styles.scoreTitle, { color: theme.text }]}>
                {t("quizComplete")}
              </Text>
              
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: theme.tint }]}>{score}</Text>
                  <Text style={[styles.statLabel, { color: theme.text }]}>{t("correctCount")}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: "#ef4444" }]}>
                    {sessionQuestions.length - score}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.text }]}>{t("incorrectCount")}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: "#3b82f6" }]}>{totalTime}</Text>
                  <Text style={[styles.statLabel, { color: theme.text }]}>{t("seconds")}</Text>
                </View>
              </View>

              <View style={styles.timeTakenContainer}>
                <Ionicons name="time-outline" size={16} color={theme.muted} />
                <Text style={[styles.timeTakenText, { color: theme.muted }]}>
                  {t("timeTaken")}: {totalTime} {t("seconds")}
                </Text>
              </View>

              <View
                style={[
                  styles.percentageBar,
                  { backgroundColor: isDark ? "#2A2C2E" : "#f0f0f0" },
                ]}
              >
                <MotiView
                  from={{ width: "0%" }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ type: "timing", duration: 500, delay: 300 }}
                  style={[styles.percentageFill, { backgroundColor: theme.tint }]}
                />
              </View>
              <Text style={[styles.percentageText, { color: theme.tint }]}>
                {percentage}% {t("accuracy")}
              </Text>

              <TouchableOpacity
                style={[styles.restartButton, { backgroundColor: theme.tint }]}
                onPress={() => startQuiz(words, mode)}
              >
                <Text style={styles.restartButtonText}>{t("tryAgain")}</Text>
              </TouchableOpacity>
            </MotiView>
          </View>
        </ScrollView>
      </View>
    );
  }

  const currentQuiz = sessionQuestions[currentIndex];

  const [currentFrom, currentTo] = mode.split("-");
  const langNames: Record<string, string> = { uz: "o'zbek", en: "ingliz", ru: "rus" };
  const targetLang = langNames[currentTo] || "tarjimani";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Platform.OS === "web" ? 120 : 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={[styles.title, { color: theme.text }]}>
                {t("quiz")}
              </Text>
              <View
                  style={[
                    styles.progressBadge,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.progressText, { color: theme.tint }]}>
                    {currentIndex + 1} / {sessionQuestions.length}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.modeSelector}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modeScroll}
              >
                {QUIZ_MODES.map((m) => {
                  const isActive = mode === m.id;
                  const [mFrom, mTo] = m.id.split("-");
                  const [currentFrom, currentTo] = mode.split("-");
                  const isMirror = mFrom === currentTo && mTo === currentFrom;
                  const isMainPair = isActive || isMirror;

                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.modeItem,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        },
                        isActive && {
                          backgroundColor: theme.tint,
                          borderColor: theme.tint,
                        },
                        isMirror && { borderColor: theme.tint },
                        !isMainPair && styles.modeItemDimmed,
                      ]}
                      onPress={() => changeMode(m.id)}
                    >
                      <View style={styles.modeLabelContainer}>
                        <Text
                          style={[
                            styles.modeLabel,
                            { color: theme.text },
                            isActive && styles.modeLabelActive,
                            isMirror && { color: theme.tint },
                          ]}
                        >
                          {m.from}
                        </Text>
                        <IconSymbol
                          name="arrow.right"
                          size={12}
                          color={isActive ? "#fff" : theme.tint}
                        />
                        <Text
                          style={[
                            styles.modeLabel,
                            { color: theme.text },
                            isActive && styles.modeLabelActive,
                            isMirror && { color: theme.tint },
                          ]}
                        >
                          {m.to}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {isLoading ? (
              <View style={styles.centered}>
                <Text
                  style={[styles.errorText, { color: theme.text, opacity: 0.5 }]}
                >
                  {t("loading")}
                </Text>
              </View>
            ) : currentQuiz ? (
              <View style={[styles.quizArea, { paddingBottom: bottomPad }]}>
                  <MotiView
                    key={currentIndex}
                    from={{ opacity: 0, scale: 0.95, translateY: -8 }}
                    animate={{ opacity: 1, scale: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 250 }}
                    style={[
                      styles.questionCard,
                      { backgroundColor: theme.card },
                    ]}
                  >
                    <Text style={[styles.questionText, { color: theme.text }]}>
                      {currentQuiz.question}
                    </Text>
                  </MotiView>
                
                {currentQuiz.type === "input" ? (
                  <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: theme.card,
                        borderColor: isConfirmed
                          ? userInput.trim().toLowerCase() === currentQuiz.correctAnswer.trim().toLowerCase()
                            ? "#10b981"
                            : "#ef4444"
                          : theme.border,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.answerInput, { color: theme.text }]}
                      placeholder={`${targetLang} tilida yozing...`}
                      placeholderTextColor={theme.muted}
                      value={userInput}
                      onChangeText={setUserInput}
                      editable={!isConfirmed}
                      autoFocus
                      onSubmitEditing={handleConfirm}
                    />
                  </MotiView>
                ) : currentQuiz.type === "speech" ? (
                  <View style={styles.voiceArea}>
                    <MotiView
                      animate={{
                        scale: isListening ? [1, 1.2, 1] : 1,
                        opacity: isListening ? [0.8, 1, 0.8] : 1,
                      }}
                      transition={{
                        loop: Infinity,
                        duration: 1000,
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.micButton,
                          {
                            backgroundColor: isListening ? "#ef4444" : theme.tint,
                            borderColor: isConfirmed
                              ? userInput.trim().toLowerCase() === currentQuiz.correctAnswer.trim().toLowerCase()
                                ? "#10b981"
                                : "#ef4444"
                              : "transparent",
                            borderWidth: isConfirmed ? 4 : 0,
                          },
                        ]}
                        onPress={isListening ? stopListening : startListening}
                        disabled={isConfirmed}
                      >
                        <Ionicons
                          name={isListening ? "stop" : "mic"}
                          size={40}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </MotiView>
                    <Text style={[styles.voiceText, { color: theme.text }]}>
                      {isExpoGo
                        ? t("speechNotSupported")
                        : isListening
                        ? t("listening")
                        : userInput
                        ? userInput
                        : t("pressToSpeak")}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.optionsContainer}>
                    {currentQuiz.options.map((opt: string, idx: number) => (
                      <QuizOption
                        key={opt}
                        index={idx}
                        text={opt}
                        isSelected={selectedOption === opt}
                        isCorrect={isConfirmed && opt === currentQuiz.correctAnswer}
                        isWrong={
                          isConfirmed &&
                          selectedOption === opt &&
                          opt !== currentQuiz.correctAnswer
                        }
                        disabled={isConfirmed}
                        onPress={() => handleSelect(opt)}
                      />
                    ))}
                  </View>
                )}

                <View style={styles.footer}>
                  {(selectedOption || ((currentQuiz.type === "input" || currentQuiz.type === "speech") && userInput.trim())) && !isConfirmed && (
                    <MotiView
                      from={{ opacity: 0, translateY: 10 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: "timing", duration: 200 }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.mainButton,
                          { backgroundColor: theme.tint },
                        ]}
                        onPress={handleConfirm}
                      >
                        <Text style={styles.mainButtonText}>{t("confirm")}</Text>
                      </TouchableOpacity>
                    </MotiView>
                  )}
                </View>
              </View>
            ) : (
            <View style={[styles.centered, { padding: 20 }]}>
              <IconSymbol
                name="language"
                size={64}
                color={isDark ? "#333" : "#ccc"}
              />
              <Text
                style={[styles.errorText, { color: theme.text, opacity: 0.5 }]}
              >
                {mode.toUpperCase()}: {t("minWordsError")}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
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
    maxWidth: 600, // Max width for large screens
    paddingHorizontal: UI.padding,
    paddingTop: 60,
    flex: 1,
  },
  header: { marginBottom: UI.spacing.md },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 32, fontWeight: "800" },
  progressBadge: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: UI.borderRadius.large,
    borderWidth: 1,
  },
  progressText: { fontSize: 14, fontWeight: "700" },
  modeSelector: { marginBottom: UI.spacing.lg, marginHorizontal: -UI.padding },
  modeScroll: {
    paddingHorizontal: UI.padding,
  },
  modeItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: UI.borderRadius.large,
    borderWidth: 1,
    marginRight: UI.spacing.sm,
  },
  modeItemDimmed: { opacity: 0.4 },
  modeLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 3,
  },
  modeLabelActive: { color: "#fff" },
  modeLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quizArea: { flex: 1 },
  questionCard: {
    padding: 40,
    borderRadius: UI.borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: UI.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  questionText: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  optionsContainer: { gap: 12 },
  inputContainer: {
    padding: 12,
    borderRadius: UI.borderRadius.large,
    borderWidth: 2,
    marginTop: UI.spacing.md,
  },
  answerInput: {
    fontSize: 20,
    fontWeight: "600",
    paddingVertical: 8,
    textAlign: "center",
  },
  voiceArea: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 20,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  voiceText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: { marginTop: UI.spacing.lg, marginBottom: 20 },
  mainButton: {
    paddingVertical: 16,
    borderRadius: UI.borderRadius.medium,
    alignItems: "center",
  },
  mainButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  resultsCard: {
    padding: UI.padding,
    borderRadius: UI.borderRadius.xl,
    alignItems: "center",
    marginTop: UI.spacing.lg,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: UI.spacing.lg,
    paddingHorizontal: UI.spacing.md,
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textTransform: "uppercase",
    opacity: 0.7,
  },
  timeTakenContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: UI.spacing.lg,
    opacity: 0.8,
  },
  timeTakenText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scoreTitle: { fontSize: 24, fontWeight: "800", marginTop: UI.spacing.md },
  percentageBar: {
    height: 12,
    width: "100%",
    borderRadius: 6,
    marginTop: UI.spacing.lg,
    overflow: "hidden",
  },
  percentageFill: { height: "100%", borderRadius: 6 },
  percentageText: { fontSize: 20, fontWeight: "800", marginTop: UI.spacing.md },
  restartButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: UI.borderRadius.medium,
    alignItems: "center",
    marginTop: UI.spacing.xl,
  },
  restartButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, textAlign: "center" },
});
