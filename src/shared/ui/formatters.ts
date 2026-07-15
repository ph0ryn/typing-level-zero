export function formatDuration(durationMs: number): string {
  return `${(durationMs / 1_000).toFixed(2)}秒`;
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatSpeed(value: number): string {
  return value.toFixed(1);
}

export function formatLatency(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}ms`;
}

export function formatDate(timestampMs: number): string {
  return new Intl.DateTimeFormat("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    year: "numeric",
  }).format(timestampMs);
}
