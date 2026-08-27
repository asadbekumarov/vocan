import { Word } from "@/types/Word";

export interface GroupedWords {
  title: string;
  data: Word[];
}

export const groupByDate = (words: Word[]): GroupedWords[] => {
  const groups: { [key: string]: Word[] } = {};

  words.forEach((word) => {
    const date = word.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(word);
  });

  // Convert to array and sort by date descending
  return Object.keys(groups)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map((date) => ({
      title: date,
      data: groups[date],
    }));
};
