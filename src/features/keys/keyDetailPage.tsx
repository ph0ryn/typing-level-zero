import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
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
  AnalyticsScopeSelect,
  filterRecordsByAnalyticsScope,
  useAnalyticsScope,
} from "../../shared/ui/analyticsScopeContext.tsx";
import {
  EmptyState,
  LoadingState,
  MetricCard,
  PageIntro,
  SectionHeading,
} from "../../shared/ui/components.tsx";
import { formatLatency, formatPercentage, formatSpeed } from "../../shared/ui/formatters.ts";

export function KeyDetailPage() {
  const { key: routeKey } = useParams();
  const { isLoading, records } = useRecords();
  const { scope } = useAnalyticsScope();
  const key = routeKey?.toLowerCase() ?? "";
  const filteredRecords = useMemo(
    () => filterRecordsByAnalyticsScope(records, scope),
    [records, scope],
  );
  const analytics = useMemo(() => deriveAnalytics(filteredRecords), [filteredRecords]);

  if (!/^[a-z]$/.test(key)) {
    return <Navigate replace to="/keys" />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  const metrics = analytics.keys.find((item) => item.key === key);

  if (!metrics) {
    return <Navigate replace to="/keys" />;
  }

  return (
    <div className="page page-key-detail">
      <Link className="back-link" to="/keys">
        <ArrowLeft size={16} /> キー一覧に戻る
      </Link>
      <PageIntro
        action={<AnalyticsScopeSelect />}
        eyebrow="キー詳細"
        title={`${key.toUpperCase()} の詳細`}
      />

      {filteredRecords.length === 0 ? (
        <EmptyState
          description="分析対象を変更するか、プレイを完了してください。"
          title="対象となる記録がありません"
        />
      ) : (
        <>
          <section className="metric-grid metric-grid-five" aria-label={`${key}の主要指標`}>
            <MetricCard label="入力回数" value={`${metrics.inputCount}`} />
            <MetricCard label="正解数" value={`${metrics.correctCount}`} />
            <MetricCard label="ミス数" value={`${metrics.mistakeCount}`} />
            <MetricCard label="正答率" value={formatPercentage(metrics.accuracy)} />
            <MetricCard label="ミス率" value={formatPercentage(metrics.mistakeRate)} />
          </section>

          <section className="metric-grid metric-grid-four">
            <MetricCard label="平均入力時間" value={formatLatency(metrics.averageLatencyMs)} />
            <MetricCard label="中央値入力時間" value={formatLatency(metrics.medianLatencyMs)} />
            <MetricCard label="最速入力時間" value={formatLatency(metrics.fastestLatencyMs)} />
            <MetricCard label="最遅入力時間" value={formatLatency(metrics.slowestLatencyMs)} />
          </section>

          <section className="detail-grid">
            <article className="panel">
              <SectionHeading title="誤入力先ランキング" />
              {metrics.mistakeTargets.length === 0 ? (
                <p className="muted">このキーの誤入力はありません。</p>
              ) : (
                <ol className="target-list">
                  {metrics.mistakeTargets.map((target) => (
                    <li key={target.key}>
                      <Link to={`/keys/${target.key}`}>{target.key.toUpperCase()}</Link>
                      <span>{target.count}回</span>
                      <small>{formatPercentage(target.percentage)}</small>
                    </li>
                  ))}
                </ol>
              )}
            </article>
            <article className="panel">
              <SectionHeading title="文字位置ごとの成績" />
              <div className="compact-table-wrapper">
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>位置</th>
                      <th>回数</th>
                      <th>正答率</th>
                      <th>入力時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.positionMetrics.map((position) => (
                      <tr key={position.position}>
                        <td>{position.position}</td>
                        <td>{position.inputCount || "—"}</td>
                        <td>{position.inputCount ? formatPercentage(position.accuracy) : "—"}</td>
                        <td>{formatLatency(position.averageLatencyMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="panel">
            <SectionHeading title="成績推移" />
            <div className="chart-container chart-container-large">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart
                  data={metrics.trend}
                  margin={{ bottom: 4, left: -25, right: 12, top: 8 }}
                >
                  <CartesianGrid
                    stroke="var(--chart-grid)"
                    strokeDasharray="2 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="completedAt"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("ja-JP", {
                        day: "numeric",
                        month: "numeric",
                      })
                    }
                    tick={{ fill: "var(--text-subtle)", fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 1]}
                    tickFormatter={(value) => `${Math.round(Number(value) * 100)}%`}
                    tick={{ fill: "var(--text-subtle)", fontSize: 11 }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface-strong)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "10px",
                    }}
                    formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
                  />
                  <Line
                    dataKey="accuracy"
                    dot={false}
                    stroke="var(--text)"
                    strokeWidth={2.2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="chart-note">入力1件ごとの正誤を時系列で表示しています。</p>
          </section>

          <section className="panel detail-summary-panel">
            <SectionHeading title="このキーのまとめ" />
            <p>
              {key.toUpperCase()}は{formatPercentage(metrics.accuracy)}の正答率で、平均入力速度は
              {formatLatency(metrics.averageLatencyMs)}です。Net WPMはプレイ全体の指標として
              {formatSpeed(analytics.overview.averageNetWpm)}です。
            </p>
          </section>
        </>
      )}
    </div>
  );
}
