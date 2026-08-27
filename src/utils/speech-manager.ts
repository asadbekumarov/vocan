import Constants from "expo-constants";
import { Platform } from "react-native";

const isExpoGo = Constants.appOwnership === "expo";

let SpeechRecModule: any = null;
let useSpeechRecognitionEvent: ((name: string, cb: (...args: any[]) => void) => void) | null = null;

if (Platform.OS !== "web" && !isExpoGo) {
  try {
    const moduleName = "expo-speech-recognition";
    const speech = require(moduleName);
    SpeechRecModule = speech.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = speech.useSpeechRecognitionEvent;
  } catch (e) {
    console.warn("Speech recognition module failed to load", e);
  }
}

// Determined once at module load — never changes between renders,
// so React always sees the same hook called in the same order.
function useNoopEvent(_name: string, _cb: (...args: any[]) => void): void {}

const stableEventHook = useSpeechRecognitionEvent ?? useNoopEvent;

export const useSpeechRecEventSafe = (
  eventName: string,
  callback: (...args: any[]) => void
): void => {
  stableEventHook(eventName, callback);
};

export { isExpoGo, SpeechRecModule };
