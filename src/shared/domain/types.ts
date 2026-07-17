export const PROMPT_LENGTH = 10;
export const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export type PlayStatus = "idle" | "active";

export interface PlaySummary {
  readonly totalInputs: number;
  readonly correctInputs: number;
  readonly mistakeCount: number;
  readonly resetCount: number;
  readonly accuracy: number;
  readonly grossCpm: number;
  readonly grossWpm: number;
  readonly netCpm: number;
  readonly netWpm: number;
}

export interface InputEventRecord {
  readonly sequence: number;
  readonly timestampMs: number;
  readonly intervalMs: number | null;
  readonly positionBefore: number;
  readonly positionAfter: number;
  readonly expectedKey: string;
  readonly actualKey: string;
  readonly physicalCode: string;
  readonly isCorrect: boolean;
  readonly resetCount: number;
}

export interface PlayRecord {
  readonly id: string;
  readonly prompt: string;
  readonly startedAt: number;
  readonly completedAt: number;
  readonly durationMs: number;
  readonly summary: PlaySummary;
  readonly events: readonly InputEventRecord[];
}

export interface PlaySessionState {
  readonly status: PlayStatus;
  readonly prompt: string;
  readonly cursor: number;
  readonly startedAt: number | null;
  readonly totalInputs: number;
  readonly mistakeCount: number;
  readonly resetCount: number;
  readonly events: readonly InputEventRecord[];
}

export type PlaySessionAction =
  | {
      readonly type: "input";
      readonly key: string;
      readonly physicalCode: string;
      readonly timestampMs: number;
    }
  | { readonly type: "cancel" };

export interface PositionMetrics {
  readonly position: number;
  readonly inputCount: number;
  readonly correctCount: number;
  readonly mistakeCount: number;
  readonly accuracy: number;
  readonly averageLatencyMs: number | null;
  readonly medianLatencyMs: number | null;
}

export interface MistakeTarget {
  readonly key: string;
  readonly count: number;
  readonly percentage: number;
}

export interface KeyMetrics {
  readonly key: string;
  readonly inputCount: number;
  readonly correctCount: number;
  readonly mistakeCount: number;
  readonly accuracy: number;
  readonly mistakeRate: number;
  readonly averageLatencyMs: number | null;
  readonly medianLatencyMs: number | null;
  readonly fastestLatencyMs: number | null;
  readonly slowestLatencyMs: number | null;
  readonly positionMetrics: readonly PositionMetrics[];
  readonly mistakeTargets: readonly MistakeTarget[];
  readonly trend: readonly TrendPoint[];
}

export interface TrendPoint {
  readonly id: string;
  readonly completedAt: number;
  readonly durationMs: number;
  readonly accuracy: number;
  readonly netWpm: number;
  readonly grossWpm: number;
  readonly averageLatencyMs: number | null;
  readonly inputCount?: number;
}

export interface OverviewMetrics {
  readonly totalPlays: number;
  readonly averageInputTimeMs: number | null;
  readonly fastestInputTimeMs: number | null;
  readonly fastestDurationMs: number | null;
  readonly averageAccuracy: number;
  readonly averageGrossCpm: number;
  readonly averageGrossWpm: number;
  readonly averageNetCpm: number;
  readonly averageNetWpm: number;
  readonly totalMistakes: number;
  readonly totalResets: number;
}

export interface AnalyticsSnapshot {
  readonly overview: OverviewMetrics;
  readonly trends: readonly TrendPoint[];
  readonly positions: readonly PositionMetrics[];
  readonly keys: readonly KeyMetrics[];
}
