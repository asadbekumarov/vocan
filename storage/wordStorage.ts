import { Word } from "@/types/Word";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "vocab_words";

export const getWords = async (): Promise<Word[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error("Error reading words", e);
        return [];
    }
};

export const addWord = async (word: Word) => {
    try {
        const words = await getWords();
        const newWords = [...words, word];
        const jsonValue = JSON.stringify(newWords);
        await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
        console.error("Error saving word", e);
    }
};

export const addMultipleWords = async (newWordsArray: Word[]) => {
    try {
        const existingWords = await getWords();
        const updatedWords = [...existingWords, ...newWordsArray];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWords));
    } catch (e) {
        console.error("Error saving multiple words", e);
    }
};

export const deleteWord = async (id: string) => {
    try {
        const words = await getWords();
        const newWords = words.filter((w) => w.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newWords));
    } catch (e) {
        console.error("Error deleting word", e);
    }
};

export const updateWord = async (updatedWord: Word) => {
    try {
        const words = await getWords();
        const newWords = words.map((w) => (w.id === updatedWord.id ? updatedWord : w));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newWords));
    } catch (e) {
        console.error("Error updating word", e);
    }
};

export type { Word };

