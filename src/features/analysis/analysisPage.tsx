import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { deriveAnalytics } from "../../shared/domain/analytics.ts";
import { useRecords } from "../../shared/storage/recordsContext.tsx";
import {
  EmptyState,
  LoadingState,
  MetricCard,
  PageIntro,
  SectionHeading,
} from "../../shared/ui/components.tsx";
import { formatDuration, formatPercentage, formatSpeed } from "../../shared/ui/formatters.ts";

export function AnalysisPage() {
  const { deleteAll, isLoading, records } = useRecords();
  const analytics = useMemo(() => deriveAnalytics(records), [records]);

  if (isLoading) {
    return <LoadingState />;
  }

  const { overview } = analytics;

  return (
    <div className="page page-analysis">
      <PageIntro
        description="これまでの入力から、速度・正確性・苦手な位置を振り返ります。"
        eyebrow="概要"
        title="分析"
      />

      {records.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section className="metric-grid metric-grid-seven" aria-label="全体指標">
            <MetricCard label="総プレイ数" value={`${overview.totalPlays}`} />
            <MetricCard
              detail={`最速 ${overview.fastestDurationMs === null ? "—" : formatDuration(overview.fastestDurationMs)}`}
              label="平均時間"
              value={formatDuration(overview.averageDurationMs)}
            />
            <MetricCard label="平均正答率" value={formatPercentage(overview.averageAccuracy)} />
            <MetricCard
              detail={`Gross ${formatSpeed(overview.averageGrossWpm)}`}
              label="平均 Net WPM"
              value={formatSpeed(overview.averageNetWpm)}
            />
            <MetricCard label="総ミス数" value={`${overview.totalMistakes}`} />
            <MetricCard label="平均 Gross WPM" value={formatSpeed(overview.averageGrossWpm)} />
            <MetricCard
              detail={`Gross ${formatSpeed(overview.averageGrossCpm)}`}
              label="平均 Net CPM"
              value={formatSpeed(overview.averageNetCpm)}
            />
          </section>

          <section className="chart-grid" aria-label="推移">
            <TrendChart
              data={analytics.trends.map((point, index) => ({
                ...point,
                label: `${index + 1}`,
              }))}
              dataKey="durationMs"
              formatter={(value) => formatDuration(Number(value))}
              title="完了時間の推移"
              unit="秒"
            />
            <TrendChart
              data={analytics.trends.map((point, index) => ({
                ...point,
                accuracyPercentage: point.accuracy * 100,
                label: `${index + 1}`,
              }))}
              dataKey="accuracyPercentage"
              formatter={(value) => `${Number(value).toFixed(1)}%`}
              title="正答率の推移"
              unit="%"
            />
            <TrendChart
              data={analytics.trends.map((point, index) => ({
                ...point,
                label: `${index + 1}`,
              }))}
              dataKey="netWpm"
              formatter={(value) => formatSpeed(Number(value))}
              title="Net WPMの推移"
              unit="WPM"
            />
          </section>

          <section className="panel">
            <SectionHeading
              action={
                <Link className="text-link" to="/keys">
                  キー別に見る →
                </Link>
              }
              title="文字位置ごとの分析"
            />
            <div className="position-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>位置</th>
                    <th>入力回数</th>
                    <th>正答率</th>
                    <th>ミス数</th>
                    <th>平均latency</th>
                    <th>中央値latency</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.positions.map((position) => (
                    <tr key={position.position}>
                      <td>{position.position}</td>
                      <td>{position.inputCount || "—"}</td>
                      <td>{position.inputCount ? formatPercentage(position.accuracy) : "—"}</td>
                      <td>{position.inputCount ? position.mistakeCount : "—"}</td>
                      <td>
                        {position.averageLatencyMs === null
                          ? "—"
                          : `${Math.round(position.averageLatencyMs)}ms`}
                      </td>
                      <td>
                        {position.medianLatencyMs === null
                          ? "—"
                          : `${Math.round(position.medianLatencyMs)}ms`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="danger-zone">
            <div>
              <h2>ローカル履歴を削除</h2>
              <p>このブラウザに保存されている完了済みplayをすべて削除します。</p>
            </div>
            <button
              className="button button-danger"
              type="button"
              onClick={() => {
                if (
                  window.confirm("保存したすべてのplayを削除しますか？この操作は元に戻せません。")
                ) {
                  void deleteAll();
                }
              }}
            >
              すべて削除
            </button>
          </section>
        </>
      )}
    </div>
  );
}

function TrendChart({
  data,
  dataKey,
  formatter,
  title,
  unit,
}: {
  readonly data: readonly Record<string, string | number | null | undefined>[];
  readonly dataKey: string;
  readonly formatter: (value: unknown) => string;
  readonly title: string;
  readonly unit: string;
}) {
  return (
    <article className="chart-card">
      <div className="chart-card-header">
        <h2>{title}</h2>
        <span>{unit}</span>
      </div>
      <div className="chart-container">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data} margin={{ bottom: 4, left: -26, right: 12, top: 8 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              tick={{ fill: "var(--text-subtle)", fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "var(--text-subtle)", fontSize: 11 }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface-strong)",
                border: "1px solid var(--border-strong)",
                borderRadius: "10px",
                color: "var(--text)",
              }}
              formatter={(value) => formatter(value)}
              labelFormatter={(label) => `Play ${label}`}
            />
            <Line
              activeDot={{ r: 4 }}
              dataKey={dataKey}
              dot={false}
              stroke="var(--text)"
              strokeWidth={2.2}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
