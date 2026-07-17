import { describe, expect, it } from "vitest";

import { deriveAnalytics } from "../../src/shared/domain/analytics.ts";

import type { InputEventRecord, PlayRecord } from "../../src/shared/domain/types.ts";

function event(overrides: Partial<InputEventRecord>): InputEventRecord {
  return {
    actualKey: "a",
    expectedKey: "a",
    intervalMs: 200,
    isCorrect: true,
    physicalCode: "KeyA",
    positionAfter: 1,
    positionBefore: 0,
    resetCount: 0,
    sequence: 1,
    timestampMs: 1_100,
    ...overrides,
  };
}

const records: PlayRecord[] = [
  {
    completedAt: 2_000,
    durationMs: 1_000,
    events: [
      event({ sequence: 1 }),
      event({ actualKey: "s", intervalMs: 300, isCorrect: false, sequence: 2 }),
      event({ expectedKey: "b", positionAfter: 2, positionBefore: 1, sequence: 3 }),
    ],
    id: "one",
    prompt: "abcdefghij",
    startedAt: 1_000,
    summary: {
      accuracy: 0,
      correctInputs: 0,
      grossCpm: 0,
      grossWpm: 0,
      mistakeCount: 0,
      netCpm: 0,
      netWpm: 0,
      resetCount: 0,
      totalInputs: 0,
    },
  },
];

describe("analytics", () => {
  it("rebuilds overview, position, and key data from events", () => {
    const analytics = deriveAnalytics(records);
    const keyA = analytics.keys.find((key) => key.key === "a");
    const keyB = analytics.keys.find((key) => key.key === "b");
    const positionOne = analytics.positions[0];

    expect(analytics.overview.totalPlays).toBe(1);
    expect(analytics.overview.totalMistakes).toBe(1);
    expect(analytics.overview.averageInputTimeMs).toBeCloseTo(233.33, 2);
    expect(analytics.overview.fastestInputTimeMs).toBe(200);
    expect(keyA?.inputCount).toBe(2);
    expect(keyA?.mistakeTargets[0]?.key).toBe("s");
    expect(keyA?.mistakeTargets[0]?.count).toBe(1);
    expect(keyB?.inputCount).toBe(1);
    expect(positionOne?.inputCount).toBe(2);
    expect(positionOne?.mistakeCount).toBe(1);
  });

  it("always returns all alphabet keys and ten positions for empty data", () => {
    const analytics = deriveAnalytics([]);

    expect(analytics.keys).toHaveLength(26);
    expect(analytics.positions).toHaveLength(10);
    expect(analytics.overview.totalPlays).toBe(0);
  });
});
