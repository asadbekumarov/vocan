import QuizOption from "@/components/QuizOption";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { getWords } from "@/storage/wordStorage";
import { Word } from "@/types/Word";
import { generateQuiz, QuizMode } from "@/utils/generateQuiz";
import { MotiView } from "@/utils/moti-wrapper";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
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
  const bottomPad = Math.max(40, insets.bottom + tabBarHeight);

  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef<any>(null);

  const startQuiz = useCallback((allWords: Word[], currentMode: QuizMode) => {
    const [from, to] = currentMode.split("-") as [keyof Word, keyof Word];
    const modeWords = allWords.filter((w) => !!w[from] && !!w[to]);

    if (modeWords.length >= 4) {
      const shuffledQuestions = [...modeWords].sort(() => Math.random() - 0.5);
      const questions = shuffledQuestions.map((w) =>
        generateQuiz(modeWords, currentMode, w),
      );

      setSessionQuestions(questions);
      setCurrentIndex(0);
      setScore(0);
      setSelectedOption(null);
      setIsConfirmed(false);
      setIsFinished(false);
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
      setIsConfirmed(false);
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, sessionQuestions.length]);

  const handleConfirm = () => {
    if (!selectedOption) return;

    const currentQuiz = sessionQuestions[currentIndex];
    if (selectedOption === currentQuiz.correctAnswer) {
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

    // Auto-advance after 1.5 seconds
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleNext();
    }, 1500);
  };

  if (isFinished) {
    const percentage = Math.round((score / sessionQuestions.length) * 100);
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
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
            { backgroundColor: isDark ? "#1C1E1F" : "#fff" },
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
          <Text style={[styles.scoreText, { color: theme.text, opacity: 0.7 }]}>
            {score} / {sessionQuestions.length} {t("correctCount")}
          </Text>
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
    );
  }

  const currentQuiz = sessionQuestions[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 10,
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
                  backgroundColor: isDark ? "#1C1E1F" : "#fff",
                  borderColor: isDark ? "#2A2C2E" : "#eee",
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
                      backgroundColor: isDark ? "#1C1E1F" : "#fff",
                      borderColor: isDark ? "#2A2C2E" : "#eee",
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
                        { color: isDark ? "#ECEDEE" : "#666" },
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
                        { color: isDark ? "#ECEDEE" : "#666" },
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
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomPad }}
          >
            <View style={styles.quizArea}>
              <MotiView
                key={currentIndex}
                from={{ opacity: 0, scale: 0.95, translateY: -8 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 250 }}
                style={[
                  styles.questionCard,
                  { backgroundColor: isDark ? "#1C1E1F" : "#fff" },
                ]}
              >
                <Text style={[styles.questionText, { color: theme.text }]}>
                  {currentQuiz.question}
                </Text>
              </MotiView>
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

              <View style={styles.footer}>
                {selectedOption && !isConfirmed && (
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
          </ScrollView>
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
              {t("minWordsError")} {mode.toUpperCase()}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  header: { marginBottom: 20 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 32, fontWeight: "800", color: "#000" },
  progressBadge: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  progressText: { fontSize: 14, fontWeight: "700" },
  modeSelector: { marginBottom: 30, marginHorizontal: -20 },
  modeScroll: {
    paddingHorizontal: 20 /* spacing between items handled by marginRight on modeItem */,
  },
  modeItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10, // spacing between scroll items
  },
  modeItemActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  modeItemMirror: { backgroundColor: "#fff", borderColor: "#16a34a" },
  modeItemDimmed: { opacity: 0.4 },
  modeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginHorizontal: 3,
  },
  modeLabelActive: { color: "#fff" },
  modeLabelMirror: { color: "#16a34a" },
  modeLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    // marginHorizontal applied on modeLabel
  },
  quizArea: { flex: 1 },
  questionCard: {
    padding: 40,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  questionText: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  optionsContainer: {
    /* vertical spacing via marginBottom on option items */
  },
  footer: { marginTop: 30, marginBottom: 40 },
  mainButton: {
    backgroundColor: "#16a34a",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.5, shadowOpacity: 0 },
  mainButtonText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: {
    fontSize: 18,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  resultsCard: {
    borderRadius: 32,
    padding: 40,
    alignItems: "center",
    marginTop: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  scoreTitle: { fontSize: 24, fontWeight: "800", marginTop: 20 },
  scoreText: { fontSize: 18, marginTop: 8 },
  percentageBar: {
    width: "100%",
    height: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    marginTop: 30,
    overflow: "hidden",
  },
  percentageFill: { height: "100%" },
  percentageText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16a34a",
    marginTop: 12,
  },
  restartButton: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 40,
    width: "100%",
    alignItems: "center",
  },
  restartButtonText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
