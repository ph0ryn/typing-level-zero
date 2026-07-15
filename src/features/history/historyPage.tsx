import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { calculateSummary } from "../../shared/domain/metrics.ts";
import { useRecords } from "../../shared/storage/recordsContext.tsx";
import { EmptyState, LoadingState, PageIntro } from "../../shared/ui/components.tsx";
import {
  formatDate,
  formatDuration,
  formatPercentage,
  formatSpeed,
} from "../../shared/ui/formatters.ts";

export function HistoryPage() {
  const { isLoading, records } = useRecords();
  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (left, right) => right.completedAt - left.completedAt || right.id.localeCompare(left.id),
      ),
    [records],
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="page page-history">
      <PageIntro
        description="完了したplayを新しい順に確認できます。"
        eyebrow="履歴"
        title="プレイ履歴"
      />
      {sortedRecords.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="panel history-panel">
          <div className="history-table-wrapper">
            <table className="data-table history-table">
              <thead>
                <tr>
                  <th>日時</th>
                  <th>Prompt</th>
                  <th>時間</th>
                  <th>Net WPM</th>
                  <th>正答率</th>
                  <th>ミス</th>
                  <th aria-label="詳細" />
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((record) => {
                  const summary = calculateSummary(
                    record.startedAt,
                    record.completedAt,
                    record.events,
                  );

                  return (
                    <tr key={record.id}>
                      <td>{formatDate(record.completedAt)}</td>
                      <td className="prompt-cell">{record.prompt}</td>
                      <td>{formatDuration(record.durationMs)}</td>
                      <td>{formatSpeed(summary.netWpm)}</td>
                      <td>{formatPercentage(summary.accuracy)}</td>
                      <td>{summary.mistakeCount}</td>
                      <td>
                        <Link
                          aria-label={`${record.prompt}の詳細`}
                          className="row-link"
                          to={`/history/${record.id}`}
                        >
                          <ChevronRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
