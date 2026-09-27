import { Platform } from "react-native";

export interface ParsedWord {
  id: string;
  word: string;
  pronunciation?: string;
  translation: string;
  selected: boolean;
}

// Fallback public / free API keys for OCR.space
const OCR_SPACE_KEYS = [
  process.env.EXPO_PUBLIC_OCR_API_KEY,
  "K87899142388957",
  "K84724912988957",
  "K83963286888957",
  "K82898988888957",
  "helloworld",
].filter(Boolean) as string[];

/**
 * Perform OCR on an image using Tesseract.js (on Web) or OCR.space API (Native & fallback)
 */
export async function recognizeTextFromImage(
  base64Image: string,
  onProgress?: (progressText: string) => void
): Promise<string> {
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

  // 1. On Web: Use Tesseract.js directly (runs client-side, zero CORS, no API key or rate limit)
  if (Platform.OS === "web") {
    try {
      if (onProgress) onProgress("Rasm matni tahlil qilinmoqda (Tesseract)...");
      const { createWorker } = await import("tesseract.js");
      
      const worker = await createWorker(["eng"]);
      const imageSource = `data:image/jpeg;base64,${cleanBase64}`;
      const { data } = await worker.recognize(imageSource);
      await worker.terminate();

      if (data && data.text && data.text.trim().length > 0) {
        return data.text;
      }
    } catch (webErr) {
      console.warn("Tesseract.js web recognition error, falling back to OCR API:", webErr);
    }
  }

  // 2. OCR API fallback (used on Native, or if web Tesseract fails)
  if (onProgress) onProgress("Server orqali matn o'qilmoqda...");

  let lastError = "OCR xizmatiga ulanib bo'lmadi";

  for (const apiKey of OCR_SPACE_KEYS) {
    try {
      const formData = new FormData();
      formData.append("base64Image", `data:image/jpeg;base64,${cleanBase64}`);
      formData.append("language", "eng");
      formData.append("isOverlayRequired", "false");
      formData.append("isTable", "false");
      formData.append("scale", "true");

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        lastError = `Server xatosi: ${response.status}`;
        continue;
      }

      const result = await response.json();

      if (result.IsErroredOnProcessing) {
        const errorMsg = Array.isArray(result.ErrorMessage)
          ? result.ErrorMessage.join(", ")
          : result.ErrorMessage || result.error || "OCR xatolik";
        lastError = errorMsg;
        continue;
      }

      if (
        result.ParsedResults &&
        result.ParsedResults.length > 0 &&
        result.ParsedResults[0].ParsedText
      ) {
        return result.ParsedResults[0].ParsedText;
      }
    } catch (apiErr: any) {
      lastError = apiErr?.message || "Tarmoq xatosi";
    }
  }

  throw new Error(lastError);
}

/**
 * Parse raw scanned text into structured words.
 * Handles formats like:
 * - "apple - olma"
 * - "1. apple : olma"
 * - "apple [æpl] - olma"
 * - "apple    olma" (separated by tabs or 2+ spaces)
 * - Single words per line (user can provide translation in modal)
 */
export function parseExtractedText(rawText: string): ParsedWord[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const parsedWords: ParsedWord[] = [];
  const seenWords = new Set<string>();

  lines.forEach((line, index) => {
    // Clean leading numbers, bullets, list markers: "1.", "1)", "-", "*", "•"
    let cleanLine = line.replace(/^[\d\s\.\)\-\*•]+/, "").trim();
    if (!cleanLine || cleanLine.length < 2) return;

    let word = "";
    let pronunciation = "";
    let translation = "";

    // Extract pronunciation [text] or /text/
    const pronMatch = cleanLine.match(/\[(.*?)\]|\/(.*?)\//);
    if (pronMatch) {
      pronunciation = (pronMatch[1] || pronMatch[2] || "").trim();
      cleanLine = cleanLine.replace(/\[(.*?)\]|\/(.*?)\//, " ").replace(/\s{2,}/g, " ").trim();
    }

    // Check for explicit delimiters: - , – , — , : , = , | , or tabs/double spaces
    let parts: string[] = [];
    if (/[-–—:=|]/.test(cleanLine)) {
      parts = cleanLine.split(/[-–—:=|]+/);
    } else if (/\t|\s{2,}/.test(cleanLine)) {
      parts = cleanLine.split(/\t|\s{2,}/);
    }

    if (parts.length >= 2) {
      word = parts[0].trim();
      translation = parts.slice(1).join(" ").trim();
    } else {
      // If no delimiter, but there are multiple words, check if line is "Word Translation"
      const tokens = cleanLine.split(/\s+/);
      if (tokens.length === 2 && /^[a-zA-Z]+$/.test(tokens[0])) {
        word = tokens[0];
        translation = tokens[1];
      } else {
        // Single word or expression: save as word, let user fill or keep translation
        word = cleanLine;
        translation = "";
      }
    }

    // Clean extraneous punctuation from word
    word = word.replace(/^[,\.;:!?"'\s]+|[,\.;:!?"'\s]+$/g, "").trim();
    translation = translation.replace(/^[,\.;:!?"'\s]+|[,\.;:!?"'\s]+$/g, "").trim();

    // Skip if word is only numbers or special chars
    if (!word || /^[\d\W]+$/.test(word)) return;

    // Deduplicate within the same scan
    const key = word.toLowerCase();
    if (seenWords.has(key)) return;
    seenWords.add(key);

    parsedWords.push({
      id: `${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      word,
      pronunciation: pronunciation || undefined,
      translation,
      selected: true,
    });
  });

  return parsedWords;
}
