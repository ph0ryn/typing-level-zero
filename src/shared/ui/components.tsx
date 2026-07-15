import type { StorageError } from "../storage/playRepository.ts";
import type { ReactNode } from "react";

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  readonly eyebrow?: string;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ? <div className="page-intro-action">{action}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
}: {
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
}) {
  return (
    <article className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      {detail ? <p className="metric-detail">{detail}</p> : null}
    </article>
  );
}

export function EmptyState({
  title = "まだ記録がありません",
  description = "プレイを完了すると、ここに分析結果が表示されます。",
}: {
  readonly title?: string;
  readonly description?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-mark" aria-hidden="true">
        ∅
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="loading-state" role="status">
      読み込み中…
    </div>
  );
}

export function StorageErrorPanel({
  error,
  onRetry,
}: {
  readonly error: StorageError | null;
  readonly onRetry: () => void;
}) {
  if (!error) {
    return null;
  }

  return (
    <div className="storage-error" role="alert">
      <div>
        <strong>ローカルデータを利用できません</strong>
        <p>{error.message}</p>
      </div>
      <button className="button button-quiet" type="button" onClick={onRetry}>
        再試行
      </button>
    </div>
  );
}

export function SectionHeading({
  title,
  action,
}: {
  readonly title: string;
  readonly action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
