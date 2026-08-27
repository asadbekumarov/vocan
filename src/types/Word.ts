export interface Word {
    id: string;
    uz?: string;
    en?: string;
    ru?: string;
    date: string;
    mode: 'uz-en' | 'en-uz' | 'uz-ru' | 'ru-uz' | 'en-ru' | 'ru-en';
    // SRS fields
    repetition?: number;
    interval?: number;
    efactor?: number;
    nextReviewDate?: string;
}
