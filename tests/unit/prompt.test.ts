import { describe, expect, it } from "vitest";

import {
  generatePrompt,
  isAlphabetKey,
  normalizeAlphabetKey,
} from "../../src/shared/domain/prompt.ts";

describe("prompt helpers", () => {
  it("generates a ten-character lowercase prompt without adjacent duplicates", () => {
    const prompt = generatePrompt(() => 0);

    expect(prompt).toHaveLength(10);
    expect(prompt).toMatch(/^[a-z]{10}$/);

    for (let index = 1; index < prompt.length; index += 1) {
      expect(prompt[index]).not.toBe(prompt[index - 1]);
    }
  });

  it("accepts only single alphabet characters", () => {
    expect(isAlphabetKey("a")).toBe(true);
    expect(isAlphabetKey("Z")).toBe(true);
    expect(isAlphabetKey("ab")).toBe(false);
    expect(isAlphabetKey("1")).toBe(false);
    expect(isAlphabetKey(" ")).toBe(false);
  });

  it("normalizes alphabet input to lowercase", () => {
    expect(normalizeAlphabetKey("Q")).toBe("q");
  });
});
