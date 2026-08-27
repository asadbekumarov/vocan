import AsyncStorage from "@react-native-async-storage/async-storage";

const GAMIFICATION_KEY = "vocab_gamification";

export interface GamificationData {
    currentStreak: number;
    maxStreak: number;
    lastActiveDate: string | null;
    dailyGoal: number;
}

const defaultData: GamificationData = {
    currentStreak: 0,
    maxStreak: 0,
    lastActiveDate: null,
    dailyGoal: 10,
};

export const getGamificationData = async (): Promise<GamificationData> => {
    try {
        const jsonValue = await AsyncStorage.getItem(GAMIFICATION_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : defaultData;
    } catch (e) {
        console.error("Error reading gamification data", e);
        return defaultData;
    }
};

export const updateGamificationData = async (data: GamificationData) => {
    try {
        await AsyncStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Error saving gamification data", e);
    }
};

export const logActivity = async (): Promise<GamificationData> => {
    const data = await getGamificationData();
    const today = new Date().toISOString().split("T")[0];

    if (!data.lastActiveDate) {
        // First time opening the app ever or after reset
        data.currentStreak = 1;
        data.maxStreak = 1;
        data.lastActiveDate = today;
    } else if (data.lastActiveDate !== today) {
        // Check if yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (data.lastActiveDate === yesterdayStr) {
            // Consecutive day
            data.currentStreak += 1;
            if (data.currentStreak > data.maxStreak) {
                data.maxStreak = data.currentStreak;
            }
        } else {
            // Streak broken
            data.currentStreak = 1;
        }
        data.lastActiveDate = today;
    }
    // If it is the same day, do nothing.

    await updateGamificationData(data);
    return data;
};

export const updateDailyGoal = async (newGoal: number) => {
    const data = await getGamificationData();
    data.dailyGoal = newGoal;
    await updateGamificationData(data);
    return data;
};
