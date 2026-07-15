import { average, calculateSummary, latencyValues, median } from "./metrics.ts";
import {
  ALPHABET,
  PROMPT_LENGTH,
  type AnalyticsSnapshot,
  type InputEventRecord,
  type KeyMetrics,
  type MistakeTarget,
  type PlayRecord,
  type PositionMetrics,
  type TrendPoint,
} from "./types.ts";

const TREND_LIMIT = 30;

function createPositionMetrics(
  position: number,
  events: readonly InputEventRecord[],
): PositionMetrics {
  const positionEvents = events.filter((event) => event.positionBefore === position);
  const correctCount = positionEvents.filter((event) => event.isCorrect).length;
  const latencies = latencyValues(positionEvents);

  return {
    accuracy: positionEvents.length > 0 ? correctCount / positionEvents.length : 0,
    averageLatencyMs: average(latencies),
    correctCount,
    inputCount: positionEvents.length,
    medianLatencyMs: median(latencies),
    mistakeCount: positionEvents.length - correctCount,
    position: position + 1,
  };
}

function createMistakeTargets(events: readonly InputEventRecord[]): MistakeTarget[] {
  const mistakes = events.filter((event) => !event.isCorrect);
  const counts = new Map<string, number>();

  for (const event of mistakes) {
    counts.set(event.actualKey, (counts.get(event.actualKey) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => ({
      count,
      key,
      percentage: mistakes.length > 0 ? count / mistakes.length : 0,
    }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

function createKeyMetrics(key: string, events: readonly InputEventRecord[]): KeyMetrics {
  const keyEvents = events.filter((event) => event.expectedKey === key);
  const correctCount = keyEvents.filter((event) => event.isCorrect).length;
  const latencies = latencyValues(keyEvents);

  return {
    accuracy: keyEvents.length > 0 ? correctCount / keyEvents.length : 0,
    averageLatencyMs: average(latencies),
    correctCount,
    fastestLatencyMs: latencies.length > 0 ? Math.min(...latencies) : null,
    inputCount: keyEvents.length,
    key,
    medianLatencyMs: median(latencies),
    mistakeCount: keyEvents.length - correctCount,
    mistakeRate: keyEvents.length > 0 ? (keyEvents.length - correctCount) / keyEvents.length : 0,
    mistakeTargets: createMistakeTargets(keyEvents),
    positionMetrics: Array.from({ length: PROMPT_LENGTH }, (_, position) =>
      createPositionMetrics(position, keyEvents),
    ),
    slowestLatencyMs: latencies.length > 0 ? Math.max(...latencies) : null,
    trend: createKeyTrend(key, events),
  };
}

function createKeyTrend(key: string, events: readonly InputEventRecord[]): TrendPoint[] {
  const records = new Map<string, InputEventRecord[]>();

  for (const event of events) {
    const recordEvents = records.get(event.expectedKey) ?? [];

    recordEvents.push(event);
    records.set(event.expectedKey, recordEvents);
  }

  return [...(records.get(key) ?? [])].map((event, index) => ({
    accuracy: event.isCorrect ? 1 : 0,
    averageLatencyMs: event.intervalMs,
    completedAt: event.timestampMs,
    durationMs: event.intervalMs ?? 0,
    grossWpm: 0,
    id: `${key}-${event.timestampMs}-${index}`,
    inputCount: 1,
    netWpm: event.isCorrect ? 1 : 0,
  }));
}

function createRecordTrend(record: PlayRecord): TrendPoint {
  const summary = calculateSummary(record.startedAt, record.completedAt, record.events);
  const latencies = latencyValues(record.events);

  return {
    accuracy: summary.accuracy,
    averageLatencyMs: average(latencies),
    completedAt: record.completedAt,
    durationMs: summary.durationMs,
    grossWpm: summary.grossWpm,
    id: record.id,
    netWpm: summary.netWpm,
  };
}

export function deriveAnalytics(records: readonly PlayRecord[]): AnalyticsSnapshot {
  const sortedRecords = [...records].sort(
    (left, right) => left.completedAt - right.completedAt || left.id.localeCompare(right.id),
  );
  const summaries = sortedRecords.map((record) =>
    calculateSummary(record.startedAt, record.completedAt, record.events),
  );
  const events = sortedRecords.flatMap((record) => record.events);
  const positions = Array.from({ length: PROMPT_LENGTH }, (_, position) =>
    createPositionMetrics(position, events),
  );
  const keys = ALPHABET.split("").map((key) => createKeyMetrics(key, events));

  return {
    keys,
    overview: {
      averageAccuracy: average(summaries.map((summary) => summary.accuracy)) ?? 0,
      averageDurationMs: average(summaries.map((summary) => summary.durationMs)) ?? 0,
      averageGrossCpm: average(summaries.map((summary) => summary.grossCpm)) ?? 0,
      averageGrossWpm: average(summaries.map((summary) => summary.grossWpm)) ?? 0,
      averageNetCpm: average(summaries.map((summary) => summary.netCpm)) ?? 0,
      averageNetWpm: average(summaries.map((summary) => summary.netWpm)) ?? 0,
      fastestDurationMs:
        summaries.length > 0 ? Math.min(...summaries.map((summary) => summary.durationMs)) : null,
      totalMistakes: summaries.reduce((sum, summary) => sum + summary.mistakeCount, 0),
      totalPlays: records.length,
      totalResets: summaries.reduce((sum, summary) => sum + summary.resetCount, 0),
    },
    positions,
    trends: sortedRecords.slice(-TREND_LIMIT).map(createRecordTrend),
  };
}
