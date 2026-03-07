import { Word } from "@/types/Word";

export type QuizMode = "uz-en" | "en-uz" | "uz-ru" | "ru-uz" | "en-ru" | "ru-en";

export const generateQuiz = (words: Word[], mode: QuizMode = "uz-en", correctWord?: Word) => {
  if (words.length < 4) return null;

  // Use provided word or pick a random one
  const correctWordToUse = correctWord || words[Math.floor(Math.random() * words.length)];
  const correctIndex = words.findIndex(w => w.id === correctWordToUse.id);

  let question = "";
  let answer = "";

  const [from, to] = mode.split("-") as [keyof Word, keyof Word];
  question = correctWordToUse[from] as string;
  answer = correctWordToUse[to] as string;

  // Pick 3 distractors
  const distractors: string[] = [];
  const otherWords = [...words];
  if (correctIndex !== -1) {
    otherWords.splice(correctIndex, 1);
  }

  while (distractors.length < 3 && otherWords.length > 0) {
    const randomIndex = Math.floor(Math.random() * otherWords.length);
    const distractorWord = otherWords.splice(randomIndex, 1)[0];
    const distractorValue = distractorWord[to] as string;
    
    // Ensure distractor is not same as answer and is not empty
    if (distractorValue && distractorValue !== answer && !distractors.includes(distractorValue)) {
      distractors.push(distractorValue);
    }
  }

  // Shuffle options
  const options = [answer, ...distractors].sort(() => Math.random() - 0.5);

  return {
    question,
    options,
    correctAnswer: answer,
  };
};
