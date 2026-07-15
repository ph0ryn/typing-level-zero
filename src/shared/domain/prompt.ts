import { ALPHABET, PROMPT_LENGTH } from "./types.ts";

export function isAlphabetKey(key: string): boolean {
  return key.length === 1 && /^[a-z]$/i.test(key);
}

export function normalizeAlphabetKey(key: string): string {
  return key.toLowerCase();
}

export function generatePrompt(random: () => number = Math.random): string {
  let prompt = "";

  while (prompt.length < PROMPT_LENGTH) {
    const previous = prompt.at(-1);
    const candidates = previous ? ALPHABET.replace(previous, "") : ALPHABET;
    const index = Math.floor(random() * candidates.length);

    prompt += candidates[index] ?? ALPHABET[0];
  }

  return prompt;
}
