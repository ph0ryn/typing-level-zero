import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import { calculateSummary } from "../../shared/domain/metrics.ts";
import { useRecords } from "../../shared/storage/recordsContext.tsx";
import { MetricCard, PageIntro, SectionHeading } from "../../shared/ui/components.tsx";
import {
  formatDate,
  formatDuration,
  formatLatency,
  formatPercentage,
  formatSpeed,
} from "../../shared/ui/formatters.ts";

export function HistoryDetailPage() {
  const { playId } = useParams();
  const { isLoading, records } = useRecords();
  const record = records.find((item) => item.id === playId);

  if (isLoading) {
    return <div className="loading-state">読み込み中…</div>;
  }

  if (!record) {
    return <Navigate replace to="/history" />;
  }

  const summary = calculateSummary(record.startedAt, record.completedAt, record.events);

  return (
    <div className="page page-history-detail">
      <Link className="back-link" to="/history">
        <ArrowLeft size={16} /> 履歴一覧に戻る
      </Link>
      <PageIntro
        description={`${formatDate(record.completedAt)} · ${record.prompt}`}
        eyebrow="プレイ詳細"
        title="プレイ詳細"
      />

      <section className="metric-grid metric-grid-five">
        <MetricCard label="Prompt" value={record.prompt} />
        <MetricCard label="完了時間" value={formatDuration(record.durationMs)} />
        <MetricCard label="正答率" value={formatPercentage(summary.accuracy)} />
        <MetricCard label="Net WPM" value={formatSpeed(summary.netWpm)} />
        <MetricCard label="ミス数" value={`${summary.mistakeCount}`} />
      </section>

      <section className="panel">
        <SectionHeading title="入力イベント" />
        <div className="history-table-wrapper">
          <table className="data-table event-table">
            <thead>
              <tr>
                <th>#</th>
                <th>位置</th>
                <th>期待</th>
                <th>入力</th>
                <th>判定</th>
                <th>physical code</th>
                <th>latency</th>
              </tr>
            </thead>
            <tbody>
              {record.events.map((event) => (
                <tr key={event.sequence}>
                  <td>{event.sequence}</td>
                  <td>{event.positionBefore + 1}</td>
                  <td>{event.expectedKey.toUpperCase()}</td>
                  <td>{event.actualKey.toUpperCase()}</td>
                  <td>
                    <span
                      className={
                        event.isCorrect ? "result-badge correct" : "result-badge incorrect"
                      }
                    >
                      {event.isCorrect ? "正解" : "ミス"}
                    </span>
                  </td>
                  <td>{event.physicalCode || "—"}</td>
                  <td>{formatLatency(event.intervalMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="table-note">
          最初のアルファベット入力は開始入力として扱うため、イベント一覧には含まれません。
        </p>
      </section>
    </div>
  );
}
