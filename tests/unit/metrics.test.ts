import { describe, expect, it } from "vitest";

import { calculateSummary, median } from "../../src/shared/domain/metrics.ts";

import type { InputEventRecord } from "../../src/shared/domain/types.ts";

function event(overrides: Partial<InputEventRecord>): InputEventRecord {
  return {
    actualKey: "a",
    expectedKey: "a",
    intervalMs: null,
    isCorrect: true,
    physicalCode: "KeyA",
    positionAfter: 1,
    positionBefore: 0,
    resetCount: 0,
    sequence: 1,
    timestampMs: 1_000,
    ...overrides,
  };
}

describe("metrics", () => {
  it("calculates gross and net speed from analyzed inputs", () => {
    const events = [
      event({ sequence: 1 }),
      event({ isCorrect: false, sequence: 2 }),
      event({ intervalMs: 250, sequence: 3 }),
    ];
    const summary = calculateSummary(1_000, 61_000, events);

    expect(summary.durationMs).toBe(60_000);
    expect(summary.totalInputs).toBe(4);
    expect(summary.correctInputs).toBe(2);
    expect(summary.mistakeCount).toBe(1);
    expect(summary.accuracy).toBeCloseTo(2 / 3);
    expect(summary.grossCpm).toBe(3);
    expect(summary.netCpm).toBe(2);
    expect(summary.grossWpm).toBe(0.6);
    expect(summary.netWpm).toBe(0.4);
  });

  it("returns zero speed when the duration is zero", () => {
    const summary = calculateSummary(1_000, 1_000, [event({})]);

    expect(summary.grossCpm).toBe(0);
    expect(summary.netCpm).toBe(0);
    expect(summary.grossWpm).toBe(0);
    expect(summary.netWpm).toBe(0);
  });

  it("calculates an even and odd median without mutating input", () => {
    const values = [450, 100, 250, 200];

    expect(median(values)).toBe(225);
    expect(median([100, 300, 200])).toBe(200);
    expect(values).toEqual([450, 100, 250, 200]);
  });
});
