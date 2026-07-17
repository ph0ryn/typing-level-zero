import { describe, expect, it } from "vitest";

import { deriveAnalytics } from "../../src/shared/domain/analytics.ts";
import { filterRecordsByAnalyticsScope } from "../../src/shared/ui/analyticsScopeContext.tsx";

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
  it("filters records by recent count and local calendar days", () => {
    const now = new Date(2026, 6, 17, 12).getTime();
    const baseRecord = records[0] as PlayRecord;
    const scopedRecords = Array.from({ length: 60 }, (_, index) => ({
      ...baseRecord,
      completedAt: now - index,
      id: `${index}`,
    }));
    const beforeToday = {
      ...baseRecord,
      completedAt: new Date(2026, 6, 16, 23, 59).getTime(),
      id: "before-today",
    };
    const firstOfThreeDays = {
      ...baseRecord,
      completedAt: new Date(2026, 6, 15).getTime(),
      id: "first-of-three-days",
    };

    expect(filterRecordsByAnalyticsScope(scopedRecords, "last10", now)).toHaveLength(10);

    expect(filterRecordsByAnalyticsScope(scopedRecords, "last50", now)).toHaveLength(50);

    expect(filterRecordsByAnalyticsScope(scopedRecords, "all", now)).toHaveLength(60);

    expect(
      filterRecordsByAnalyticsScope([beforeToday, ...scopedRecords], "today", now),
    ).toHaveLength(60);

    expect(
      filterRecordsByAnalyticsScope([firstOfThreeDays, beforeToday], "last3Days", now),
    ).toHaveLength(2);
  });

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
