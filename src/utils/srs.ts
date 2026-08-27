import { Word } from "@/types/Word";

// SuperMemo-2 (SM-2) algorithm implementation
// quality: 0-5 (0 = complete blackout, 3 = correct with difficulty, 4 = correct with hesitation, 5 = perfect)
export const calculateSRS = (word: Word, quality: number): Partial<Word> => {
    let repetition = word.repetition || 0;
    let interval = word.interval || 0;
    let efactor = word.efactor || 2.5;

    if (quality >= 3) {
        if (repetition === 0) {
            interval = 1;
        } else if (repetition === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * efactor);
        }
        repetition += 1;
    } else {
        repetition = 0;
        interval = 1;
    }

    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) {
        efactor = 1.3;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    
    return {
        repetition,
        interval,
        efactor,
        nextReviewDate: nextReviewDate.toISOString().split("T")[0],
    };
};
