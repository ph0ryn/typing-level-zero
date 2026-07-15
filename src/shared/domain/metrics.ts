import type { InputEventRecord, PlaySummary } from "./types.ts";

export function calculateSummary(
  startedAt: number,
  completedAt: number,
  events: readonly InputEventRecord[],
): PlaySummary & { readonly durationMs: number } {
  const durationMs = Math.max(0, completedAt - startedAt);
  const correctInputs = events.filter((event) => event.isCorrect).length;
  const mistakeCount = events.length - correctInputs;
  const minutes = durationMs / 60_000;
  const grossCpm = minutes > 0 ? events.length / minutes : 0;
  const netCpm = minutes > 0 ? correctInputs / minutes : 0;
  const accuracy = events.length > 0 ? correctInputs / events.length : 0;

  return {
    accuracy,
    correctInputs,
    durationMs,
    grossCpm,
    grossWpm: grossCpm / 5,
    mistakeCount,
    netCpm,
    netWpm: netCpm / 5,
    resetCount: mistakeCount,
    totalInputs: events.length + 1,
  };
}

export function average(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0);
}

export function latencyValues(events: readonly InputEventRecord[]): number[] {
  return events.flatMap((event) => (event.intervalMs === null ? [] : [event.intervalMs]));
}
