import QuizOption from "@/components/QuizOption";
import { Palette, Shadows, UI, Typography, ComponentTokens } from "@/constants/theme";
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

const QUIZ_MODES: { id: QuizMode; from: string; to: string; color: string }[] = [
  { id: "uz-en", from: "UZ", to: "EN", color: Palette.emerald500 },
  { id: "en-uz", from: "EN", to: "UZ", color: '#3B82F6' },
  { id: "uz-ru", from: "UZ", to: "RU", color: Palette.amber500 },
  { id: "ru-uz", from: "RU", to: "UZ", color: '#8B5CF6' },
  { id: "en-ru", from: "EN", to: "RU", color: '#EC4899' },
  { id: "ru-en", from: "RU", to: "EN", color: '#14B8A6' },
];

// Ovoz bilan javob berish funksiyasi (vaqtincha to'xtatildi, keyinroq davom ettiriladi)
const ENABLE_SPEECH_RECOGNITION = false;

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

  useSpeechRecEventSafe("start", () => {
    if (ENABLE_SPEECH_RECOGNITION) setIsListening(true);
  });
  useSpeechRecEventSafe("end", () => {
    if (ENABLE_SPEECH_RECOGNITION) setIsListening(false);
  });
  useSpeechRecEventSafe("result", (event: any) => {
    if (ENABLE_SPEECH_RECOGNITION && event.results && event.results.length > 0) {
      setUserInput(event.results[0]?.transcript);
    }
  });
  useSpeechRecEventSafe("error", (event: any) => {
    if (ENABLE_SPEECH_RECOGNITION) {
      console.log("Speech recognition error:", event.error, event.message);
      setIsListening(false);
    }
  });

  const startListening = async () => {
    if (!ENABLE_SPEECH_RECOGNITION) return;
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
    if (!ENABLE_SPEECH_RECOGNITION) return;
    try {
      await SpeechRecModule?.stop();
    } catch (e) {
      console.error("Error stopping speech recognition:", e);
    }
  };

  const handleConfirm = () => {
    if (isConfirmed) return;
    const currentQuiz = sessionQuestions[currentIndex];
    const isInputType =
      currentQuiz.type === "input" ||
      (ENABLE_SPEECH_RECOGNITION && currentQuiz.type === "speech");

    if (!isInputType && !selectedOption) return;
    if (isInputType && !userInput.trim()) return;

    if (ENABLE_SPEECH_RECOGNITION && currentQuiz.type === "speech" && isListening) {
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
      const dueWords = modeWords
        .filter((w) => !w.nextReviewDate || w.nextReviewDate <= today)
        .sort(() => Math.random() - 0.5);
      const nonDueWords = modeWords
        .filter((w) => w.nextReviewDate && w.nextReviewDate > today)
        .sort(() => Math.random() - 0.5);

      const shuffledQuestions = [...dueWords, ...nonDueWords];
      
      const allowedTypes = ["multiple", "input"];
      if (ENABLE_SPEECH_RECOGNITION && !isExpoGo) {
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

  // ── RESULTS SCREEN ──
  if (isFinished) {
    const percentage = Math.round((score / sessionQuestions.length) * 100);
    const isGood = percentage >= 70;
    
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
                { backgroundColor: theme.card },
                isDark ? Shadows.dark.md : Shadows.light.md,
              ]}
            >
              {/* Result Icon */}
              <MotiView
                from={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 200 }}
              >
                <View style={[styles.resultIconBox, { 
                  backgroundColor: isGood 
                    ? (isDark ? 'rgba(16,185,129,0.15)' : Palette.emerald50) 
                    : (isDark ? 'rgba(244,63,94,0.15)' : Palette.rose50) 
                }]}>
                  <Ionicons 
                    name={isGood ? "trophy" : "refresh"} 
                    size={44} 
                    color={isGood ? Palette.emerald500 : Palette.rose500} 
                  />
                </View>
              </MotiView>

              <Text style={[styles.scoreTitle, { color: theme.text }]}>
                {t("quizComplete")}
              </Text>
              
              {/* Stats Row */}
              <View style={styles.statsContainer}>
                <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : Palette.emerald50 }]}>
                  <Text style={[styles.statValue, { color: Palette.emerald500 }]}>{score}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t("correctCount")}</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : Palette.rose50 }]}>
                  <Text style={[styles.statValue, { color: Palette.rose500 }]}>
                    {sessionQuestions.length - score}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t("incorrectCount")}</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : Palette.indigo50 }]}>
                  <Text style={[styles.statValue, { color: theme.tint }]}>{totalTime}s</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t("seconds")}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={[styles.percentageBar, { backgroundColor: theme.surfaceSubtle }]}>
                <MotiView
                  from={{ width: "0%" }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ type: "timing", duration: 500, delay: 300 }}
                  style={[styles.percentageFill, { 
                    backgroundColor: isGood ? Palette.emerald500 : Palette.amber500 
                  }]}
                />
              </View>
              <Text style={[styles.percentageText, { color: isGood ? Palette.emerald500 : Palette.amber500 }]}>
                {percentage}% {t("accuracy")}
              </Text>

              {/* Restart */}
              <TouchableOpacity
                style={[styles.restartButton, { backgroundColor: theme.tint }]}
                onPress={() => startQuiz(words, mode)}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
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

  const currentModeData = QUIZ_MODES.find(m => m.id === mode);
  const currentColor = currentModeData?.color ?? theme.tint;
  const progressPercent = sessionQuestions.length > 0 ? ((currentIndex) / sessionQuestions.length) * 100 : 0;

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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={[styles.title, { color: theme.text }]}>
                {t("quiz")}
              </Text>
              <View
                style={[
                  styles.progressBadge,
                  {
                    backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : Palette.indigo50,
                  },
                ]}
              >
                <Text style={[styles.progressText, { color: theme.tint }]}>
                  {currentIndex + 1} / {sessionQuestions.length}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            {sessionQuestions.length > 0 && (
              <View style={[styles.quizProgressBar, { backgroundColor: theme.surfaceSubtle }]}>
                <MotiView
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ type: "timing", duration: 300 }}
                  style={[styles.quizProgressFill, { backgroundColor: theme.tint }]}
                />
              </View>
            )}
          </View>

          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modeScroll}
            >
              {QUIZ_MODES.map((m) => {
                const isActive = mode === m.id;
                const [mFrom, mTo] = m.id.split("-");
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
                      <Ionicons
                        name="arrow-forward"
                        size={10}
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
                style={[styles.errorText, { color: theme.textSecondary }]}
              >
                {t("loading")}
              </Text>
            </View>
          ) : currentQuiz ? (
            <View style={[styles.quizArea, { paddingBottom: bottomPad }]}>
                {/* Question Card */}
                <MotiView
                  key={currentIndex}
                  from={{ opacity: 0, scale: 0.95, translateY: -8 }}
                  animate={{ opacity: 1, scale: 1, translateY: 0 }}
                  transition={{ type: "timing", duration: 250 }}
                  style={[
                    styles.questionCard,
                    { backgroundColor: theme.card },
                    isDark ? Shadows.dark.md : Shadows.light.md,
                  ]}
                >
                  <View style={[styles.questionTypeBadge, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : Palette.indigo50 }]}>
                    <Ionicons 
                      name={currentQuiz.type === 'input' ? 'create' : currentQuiz.type === 'speech' ? 'mic' : 'list'} 
                      size={12} 
                      color={theme.tint} 
                    />
                    <Text style={[styles.questionTypeBadgeText, { color: theme.tint }]}>
                      {currentQuiz.type === 'input' ? 'Yozing' : currentQuiz.type === 'speech' ? 'Ayting' : 'Tanlang'}
                    </Text>
                  </View>
                  <Text style={[styles.questionText, { color: theme.text }]}>
                    {currentQuiz.question}
                  </Text>
                </MotiView>
              
              {/* Answer Area */}
              {currentQuiz.type === "input" ? (
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: isConfirmed
                        ? userInput.trim().toLowerCase() === currentQuiz.correctAnswer.trim().toLowerCase()
                          ? Palette.emerald500
                          : Palette.rose500
                        : theme.inputBorder,
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
              ) : ENABLE_SPEECH_RECOGNITION && currentQuiz.type === "speech" ? (
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
                          backgroundColor: isListening ? Palette.rose500 : theme.tint,
                          borderColor: isConfirmed
                            ? userInput.trim().toLowerCase() === currentQuiz.correctAnswer.trim().toLowerCase()
                              ? Palette.emerald500
                              : Palette.rose500
                            : "transparent",
                          borderWidth: isConfirmed ? 4 : 0,
                        },
                      ]}
                      onPress={isListening ? stopListening : startListening}
                      disabled={isConfirmed}
                    >
                      <Ionicons
                        name={isListening ? "stop" : "mic"}
                        size={36}
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

              {/* Confirm Button */}
              <View style={styles.footer}>
                {(selectedOption || ((currentQuiz.type === "input" || (ENABLE_SPEECH_RECOGNITION && currentQuiz.type === "speech")) && userInput.trim())) && !isConfirmed && (
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
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.mainButtonText}>{t("confirm")}</Text>
                    </TouchableOpacity>
                  </MotiView>
                )}
              </View>
            </View>
          ) : (
          <View style={[styles.centered, { padding: 20 }]}>
            <View style={[styles.emptyQuizIcon, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : Palette.indigo50 }]}>
              <Ionicons name="language" size={48} color={theme.tint} />
            </View>
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>
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
    alignItems: "center",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: UI.maxContentWidth,
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
  title: { ...Typography.displaySmall },
  progressBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: UI.borderRadius.pill,
  },
  progressText: { ...Typography.labelMedium },
  quizProgressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 14,
    overflow: 'hidden',
  },
  quizProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  modeSelector: { marginBottom: UI.spacing.lg, marginHorizontal: -UI.padding },
  modeScroll: {
    paddingHorizontal: UI.padding,
  },
  modeItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: UI.borderRadius.pill,
    borderWidth: 1,
    marginRight: UI.spacing.sm,
  },
  modeItemDimmed: { opacity: 0.35 },
  modeLabel: {
    ...Typography.labelSmall,
    marginHorizontal: 3,
  },
  modeLabelActive: { color: "#fff" },
  modeLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quizArea: { flex: 1 },
  questionCard: {
    padding: 32,
    paddingTop: 20,
    borderRadius: UI.borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: UI.spacing.lg,
  },
  questionTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: UI.borderRadius.pill,
    marginBottom: 16,
  },
  questionTypeBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  questionText: { ...Typography.headingLarge, textAlign: "center" },
  optionsContainer: { gap: 0 },
  inputContainer: {
    padding: 14,
    borderRadius: UI.borderRadius.large,
    borderWidth: 2,
    marginTop: UI.spacing.md,
  },
  answerInput: {
    ...Typography.headingSmall,
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
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceText: {
    ...Typography.headingSmall,
    textAlign: "center",
  },
  footer: { marginTop: UI.spacing.lg, marginBottom: 20 },
  mainButton: {
    paddingVertical: 16,
    borderRadius: UI.borderRadius.medium,
    alignItems: "center",
    justifyContent: 'center',
    flexDirection: 'row',
  },
  mainButtonText: { color: "#fff", ...Typography.labelLarge, fontWeight: '700' },
  resultsCard: {
    padding: UI.spacing.lg,
    borderRadius: UI.borderRadius.xl,
    alignItems: "center",
    marginTop: UI.spacing.lg,
  },
  resultIconBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: UI.spacing.lg,
    gap: 12,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 16,
    borderRadius: UI.borderRadius.large,
  },
  statValue: {
    ...Typography.headingLarge,
  },
  statLabel: {
    ...Typography.caption,
    marginTop: 4,
    textTransform: "uppercase",
  },
  scoreTitle: { ...Typography.headingLarge, marginTop: UI.spacing.md },
  percentageBar: {
    height: 8,
    width: "100%",
    borderRadius: 4,
    marginTop: UI.spacing.lg,
    overflow: "hidden",
  },
  percentageFill: { height: "100%", borderRadius: 4 },
  percentageText: { ...Typography.headingMedium, marginTop: UI.spacing.sm },
  restartButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: UI.borderRadius.medium,
    alignItems: "center",
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: UI.spacing.xl,
  },
  restartButtonText: { color: "#fff", ...Typography.labelLarge, fontWeight: '700' },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyQuizIcon: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorText: { ...Typography.bodyMedium, textAlign: "center" },
});
