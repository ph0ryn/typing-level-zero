import { calculateSummary } from "./metrics.ts";
import { generatePrompt, isAlphabetKey, normalizeAlphabetKey } from "./prompt.ts";

import type { InputEventRecord, PlayRecord, PlaySessionAction, PlaySessionState } from "./types.ts";

export function createIdleSession(prompt: string = generatePrompt()): PlaySessionState {
  return {
    cursor: 0,
    events: [],
    mistakeCount: 0,
    prompt,
    resetCount: 0,
    startedAt: null,
    status: "idle",
    totalInputs: 0,
  };
}

export interface SessionTransition {
  readonly state: PlaySessionState;
  readonly completedRecord: PlayRecord | null;
}

function createCompletedRecord(
  state: PlaySessionState,
  events: readonly InputEventRecord[],
  completedAt: number,
): PlayRecord {
  const startedAt = state.startedAt ?? completedAt;
  const summary = calculateSummary(startedAt, completedAt, events);

  return {
    completedAt,
    durationMs: summary.durationMs,
    events,
    id: `${completedAt}-${Math.random().toString(36).slice(2, 10)}`,
    prompt: state.prompt,
    startedAt,
    summary,
  };
}

export function applySessionAction(
  state: PlaySessionState,
  action: PlaySessionAction,
  nextPrompt: () => string = generatePrompt,
): SessionTransition {
  if (action.type === "cancel") {
    return {
      completedRecord: null,
      state: state.status === "active" ? createIdleSession(nextPrompt()) : state,
    };
  }

  if (!isAlphabetKey(action.key)) {
    return { completedRecord: null, state };
  }

  const actualKey = normalizeAlphabetKey(action.key);

  if (state.status === "idle") {
    const isCorrect = actualKey === state.prompt[0];

    return {
      completedRecord: null,
      state: {
        ...state,
        cursor: isCorrect ? 1 : 0,
        startedAt: action.timestampMs,
        status: "active",
        totalInputs: 1,
      },
    };
  }

  const positionBefore = state.cursor;
  const expectedKey = state.prompt[positionBefore] ?? "";
  const isCorrect = actualKey === expectedKey;
  const positionAfter = isCorrect ? positionBefore + 1 : 0;
  const resetCount = state.resetCount + (isCorrect ? 0 : 1);
  const previousEvent = state.events.at(-1);
  const intervalMs = previousEvent
    ? Math.max(0, action.timestampMs - previousEvent.timestampMs)
    : null;
  const event: InputEventRecord = {
    actualKey,
    expectedKey,
    intervalMs,
    isCorrect,
    physicalCode: action.physicalCode,
    positionAfter,
    positionBefore,
    resetCount,
    sequence: state.events.length + 1,
    timestampMs: action.timestampMs,
  };
  const events = [...state.events, event];
  const nextState: PlaySessionState = {
    ...state,
    cursor: positionAfter,
    events,
    mistakeCount: state.mistakeCount + (isCorrect ? 0 : 1),
    resetCount,
    startedAt: isCorrect ? state.startedAt : action.timestampMs,
    totalInputs: state.totalInputs + 1,
  };

  if (positionAfter < state.prompt.length) {
    return { completedRecord: null, state: nextState };
  }

  return {
    completedRecord: createCompletedRecord(state, events, action.timestampMs),
    state: createIdleSession(nextPrompt()),
  };
}
