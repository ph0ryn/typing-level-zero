import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { deriveAnalytics } from "../../shared/domain/analytics.ts";
import { useRecords } from "../../shared/storage/recordsContext.tsx";
import {
  EmptyState,
  LoadingState,
  PageIntro,
  SectionHeading,
} from "../../shared/ui/components.tsx";
import { formatLatency, formatPercentage } from "../../shared/ui/formatters.ts";

import type { KeyMetrics } from "../../shared/domain/types.ts";

const keyboardRows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

type HeatmapMetric = "accuracy" | "mistakes" | "inputs" | "latency";

const metricLabels: Record<HeatmapMetric, string> = {
  accuracy: "正答率",
  inputs: "入力回数",
  latency: "平均latency",
  mistakes: "ミス数",
};

function sortWithTies(left: KeyMetrics, right: KeyMetrics): number {
  return left.key.localeCompare(right.key);
}

function metricValue(metrics: KeyMetrics, metric: HeatmapMetric): string {
  if (metrics.inputCount === 0) {
    return "—";
  }

  if (metric === "accuracy") {
    return formatPercentage(metrics.accuracy);
  }

  if (metric === "inputs") {
    return `${metrics.inputCount}`;
  }

  if (metric === "latency") {
    return formatLatency(metrics.averageLatencyMs);
  }

  return `${metrics.mistakeCount}`;
}

function heatmapClass(metrics: KeyMetrics): string {
  if (metrics.inputCount === 0) {
    return "heatmap-key no-data";
  }

  if (metrics.accuracy >= 0.9) {
    return "heatmap-key high";
  }

  if (metrics.accuracy >= 0.8) {
    return "heatmap-key medium";
  }

  return "heatmap-key low";
}

function RankingList({
  items,
  title,
  value,
}: {
  readonly items: readonly KeyMetrics[];
  readonly title: string;
  readonly value: (item: KeyMetrics) => string;
}) {
  return (
    <article className="ranking-card">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="muted">データがありません</p>
      ) : (
        <ol className="ranking-list">
          {items.map((item) => (
            <li key={item.key}>
              <Link to={`/keys/${item.key}`}>
                <span className="ranking-key">{item.key.toUpperCase()}</span>
                <strong>{value(item)}</strong>
                <small>入力 {item.inputCount}回</small>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

export function KeysPage() {
  const { isLoading, records } = useRecords();
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>("accuracy");
  const analytics = useMemo(() => deriveAnalytics(records), [records]);

  if (isLoading) {
    return <LoadingState />;
  }

  const keyMetrics = analytics.keys;
  const weakest = [...keyMetrics]
    .filter((item) => item.inputCount > 0)
    .sort(
      (left, right) =>
        left.accuracy - right.accuracy ||
        right.mistakeCount - left.mistakeCount ||
        sortWithTies(left, right),
    )
    .slice(0, 3);
  const mostMistakes = [...keyMetrics]
    .filter((item) => item.mistakeCount > 0)
    .sort((left, right) => right.mistakeCount - left.mistakeCount || sortWithTies(left, right))
    .slice(0, 3);
  const slowest = [...keyMetrics]
    .filter((item) => item.averageLatencyMs !== null)
    .sort(
      (left, right) =>
        (right.averageLatencyMs ?? 0) - (left.averageLatencyMs ?? 0) || sortWithTies(left, right),
    )
    .slice(0, 3);
  const strongest = [...keyMetrics]
    .filter((item) => item.inputCount > 0)
    .sort(
      (left, right) =>
        right.accuracy - left.accuracy ||
        (left.averageLatencyMs ?? Infinity) - (right.averageLatencyMs ?? Infinity) ||
        sortWithTies(left, right),
    )
    .slice(0, 3);

  return (
    <div className="page page-keys">
      <PageIntro
        description="期待したキーごとの正確性と入力の癖を確認します。"
        eyebrow="キー分析"
        title="キー別分析"
      />

      <section className="panel keyboard-panel">
        <SectionHeading
          action={
            <label className="select-control">
              指標
              <select
                value={heatmapMetric}
                onChange={(event) => setHeatmapMetric(event.target.value as HeatmapMetric)}
              >
                {Object.entries(metricLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          }
          title={`キーボードマップ（${metricLabels[heatmapMetric]}）`}
        />
        <div className="keyboard-map" aria-label="US QWERTYキーボードマップ">
          {keyboardRows.map((row, rowIndex) => (
            <div className={`keyboard-row keyboard-row-${rowIndex + 1}`} key={row}>
              {row.split("").map((key) => {
                const metrics = keyMetrics.find((item) => item.key === key);

                if (!metrics) {
                  return null;
                }

                return (
                  <Link className={heatmapClass(metrics)} key={key} to={`/keys/${key}`}>
                    <strong>{key.toUpperCase()}</strong>
                    <span>{metricValue(metrics, heatmapMetric)}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
        <div className="heatmap-legend" aria-label="正答率の凡例">
          <span>
            <i className="legend-swatch high" />
            90%以上
          </span>
          <span>
            <i className="legend-swatch medium" />
            80–90%
          </span>
          <span>
            <i className="legend-swatch low" />
            80%未満
          </span>
          <span>
            <i className="legend-swatch no-data" />
            データなし
          </span>
        </div>
      </section>

      {records.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="ranking-grid" aria-label="キーランキング">
          <RankingList
            items={weakest}
            title="要注意キー（正答率）"
            value={(item) => formatPercentage(item.accuracy)}
          />
          <RankingList
            items={mostMistakes}
            title="ミスが多いキー"
            value={(item) => `${item.mistakeCount}回`}
          />
          <RankingList
            items={slowest}
            title="入力が遅いキー"
            value={(item) => formatLatency(item.averageLatencyMs)}
          />
          <RankingList
            items={strongest}
            title="得意キー"
            value={(item) => formatPercentage(item.accuracy)}
          />
        </section>
      )}
    </div>
  );
}
