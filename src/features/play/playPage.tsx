import { useCallback, useEffect, useRef, useState } from "react";

import { applySessionAction, createIdleSession } from "../../shared/domain/playSession.ts";
import { isAlphabetKey } from "../../shared/domain/prompt.ts";
import { StorageError } from "../../shared/storage/playRepository.ts";
import { useRecords } from "../../shared/storage/recordsContext.tsx";
import { formatDuration, formatPercentage, formatSpeed } from "../../shared/ui/formatters.ts";

import type { PlayRecord, PlaySessionState } from "../../shared/domain/types.ts";

function elapsedTime(session: PlaySessionState, now: number): number {
  return session.startedAt === null ? 0 : Math.max(0, now - session.startedAt);
}

export function PlayPage() {
  const { saveRecord } = useRecords();
  const [session, setSession] = useState<PlaySessionState>(() => createIdleSession());
  const [now, setNow] = useState(() => Date.now());
  const [lastResult, setLastResult] = useState<PlayRecord | null>(null);
  const [pendingRecord, setPendingRecord] = useState<PlayRecord | null>(null);
  const [saveError, setSaveError] = useState<StorageError | null>(null);
  const sessionRef = useRef(session);

  const persistRecord = useCallback(
    async (record: PlayRecord) => {
      setPendingRecord(record);

      try {
        await saveRecord(record);
        setPendingRecord((current) => (current?.id === record.id ? null : current));
        setSaveError(null);
      } catch (cause) {
        setSaveError(
          cause instanceof StorageError
            ? cause
            : new StorageError(
                "完了したplayを保存できませんでした。ブラウザの保存領域を確認してください。",
                {
                  cause,
                },
              ),
        );
      }
    },
    [saveRecord],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const currentSession = sessionRef.current;

      if (event.key === "Escape") {
        if (currentSession.status === "active") {
          event.preventDefault();
          const transition = applySessionAction(currentSession, { type: "cancel" });

          sessionRef.current = transition.state;
          setSession(transition.state);
          setLastResult(null);
        }

        return;
      }

      if (event.repeat || !isAlphabetKey(event.key)) {
        return;
      }

      const transition = applySessionAction(currentSession, {
        key: event.key,
        physicalCode: event.code,
        timestampMs: Date.now(),
        type: "input",
      });

      sessionRef.current = transition.state;
      setSession(transition.state);

      if (currentSession.status === "idle") {
        setLastResult(null);
      }

      if (transition.completedRecord) {
        setLastResult(transition.completedRecord);
        void persistRecord(transition.completedRecord);
      }
    },
    [persistRecord],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (session.status !== "active") {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 100);

    return () => window.clearInterval(timer);
  }, [session.status]);

  const durationMs = elapsedTime(session, now);

  return (
    <div className="play-page">
      <div className="play-stage">
        <p className="play-kicker">10文字を入力して集中する</p>
        <div className="prompt" aria-label={`入力する文字列 ${session.prompt}`}>
          {session.prompt.split("").map((character, index) => {
            let state = "pending";

            if (index < session.cursor) {
              state = "completed";
            } else if (index === session.cursor) {
              state = "current";
            }

            return (
              <span
                key={`${character}-${index}`}
                aria-current={state === "current" ? "step" : undefined}
                className={`prompt-character prompt-character-${state}`}
              >
                {character}
              </span>
            );
          })}
        </div>
        <div className="prompt-progress" aria-hidden="true">
          {session.prompt.split("").map((_, index) => (
            <span
              className={index < session.cursor ? "progress-dot filled" : "progress-dot"}
              key={index}
            />
          ))}
        </div>
        <p className="play-hint">
          {session.status === "active"
            ? "入力中 · Escでキャンセル"
            : "アルファベットキーを押すとスタート"}
        </p>
      </div>

      <div className="play-footer">
        <div className="play-stats">
          <span>
            リセット <strong>{session.resetCount}</strong>
          </span>
          <span>
            ミス <strong>{session.mistakeCount}</strong>
          </span>
        </div>
        <time className="play-timer" dateTime={`${durationMs}`}>
          {formatDuration(durationMs)}
        </time>
      </div>

      {lastResult ? (
        <section className="result-panel" aria-live="polite">
          <div>
            <p className="eyebrow">完了</p>
            <h2>{formatDuration(lastResult.durationMs)}</h2>
          </div>
          <div className="result-stat">
            <span>正答率</span>
            <strong>{formatPercentage(lastResult.summary.accuracy)}</strong>
          </div>
          <div className="result-stat">
            <span>Net WPM</span>
            <strong>{formatSpeed(lastResult.summary.netWpm)}</strong>
          </div>
          <div className="result-stat">
            <span>ミス</span>
            <strong>{lastResult.summary.mistakeCount}</strong>
          </div>
        </section>
      ) : null}

      {pendingRecord && saveError ? (
        <section className="save-retry" role="alert">
          <div>
            <strong>このplayを保存できませんでした</strong>
            <p>{saveError.message}</p>
          </div>
          <button
            className="button button-dark"
            type="button"
            onClick={() => void persistRecord(pendingRecord)}
          >
            保存を再試行
          </button>
        </section>
      ) : null}
    </div>
  );
}
