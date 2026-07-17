import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { PlayRecord } from "../domain/types.ts";

export type AnalyticsScope = "last10" | "last50" | "today" | "last3Days" | "last30Days" | "all";

const ANALYTICS_SCOPE_STORAGE_KEY = "typing-level-zero:analytics-scope";

export const analyticsScopeOptions: readonly {
  readonly label: string;
  readonly value: AnalyticsScope;
}[] = [
  { label: "10回", value: "last10" },
  { label: "50回", value: "last50" },
  { label: "今日", value: "today" },
  { label: "3日", value: "last3Days" },
  { label: "30日", value: "last30Days" },
  { label: "全期間", value: "all" },
];

interface AnalyticsScopeContextValue {
  readonly scope: AnalyticsScope;
  readonly setScope: (scope: AnalyticsScope) => void;
}

const AnalyticsScopeContext = createContext<AnalyticsScopeContextValue | null>(null);

function isAnalyticsScope(value: string | null): value is AnalyticsScope {
  return analyticsScopeOptions.some((option) => option.value === value);
}

function initialScope(): AnalyticsScope {
  const savedScope = window.localStorage.getItem(ANALYTICS_SCOPE_STORAGE_KEY);

  return isAnalyticsScope(savedScope) ? savedScope : "last10";
}

export function AnalyticsScopeProvider({ children }: { readonly children: ReactNode }) {
  const [scope, setScopeState] = useState<AnalyticsScope>(initialScope);
  const value = useMemo<AnalyticsScopeContextValue>(
    () => ({
      scope,
      setScope: (nextScope) => {
        window.localStorage.setItem(ANALYTICS_SCOPE_STORAGE_KEY, nextScope);
        setScopeState(nextScope);
      },
    }),
    [scope],
  );

  return <AnalyticsScopeContext.Provider value={value}>{children}</AnalyticsScopeContext.Provider>;
}

export function useAnalyticsScope(): AnalyticsScopeContextValue {
  const context = useContext(AnalyticsScopeContext);

  if (!context) {
    throw new Error("useAnalyticsScope must be used inside AnalyticsScopeProvider");
  }

  return context;
}

export function filterRecordsByAnalyticsScope(
  records: readonly PlayRecord[],
  scope: AnalyticsScope,
  now: number = Date.now(),
): PlayRecord[] {
  const newestFirst = [...records].sort(
    (left, right) => right.completedAt - left.completedAt || right.id.localeCompare(left.id),
  );

  if (scope === "last10" || scope === "last50") {
    return newestFirst.slice(0, scope === "last10" ? 10 : 50);
  }

  if (scope === "all") {
    return newestFirst;
  }

  const today = new Date(now);
  let daysToSubtract = 29;

  if (scope === "today") {
    daysToSubtract = 0;
  } else if (scope === "last3Days") {
    daysToSubtract = 2;
  }

  const startTime = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - daysToSubtract,
  ).getTime();

  return newestFirst.filter(
    (record) => record.completedAt >= startTime && record.completedAt <= now,
  );
}

export function AnalyticsScopeSelect() {
  const { scope, setScope } = useAnalyticsScope();

  return (
    <label className="select-control">
      分析対象
      <select
        aria-label="分析対象"
        value={scope}
        onChange={(event) => setScope(event.target.value as AnalyticsScope)}
      >
        {analyticsScopeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
