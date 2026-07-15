import { describe, expect, it } from "vitest";

import { applySessionAction, createIdleSession } from "../../src/shared/domain/playSession.ts";

function input(key: string, timestampMs: number, physicalCode = `Key${key.toUpperCase()}`) {
  return {
    key,
    physicalCode,
    timestampMs,
    type: "input" as const,
  };
}

describe("play session", () => {
  it("starts on the first alphabet input without recording an event", () => {
    const transition = applySessionAction(createIdleSession("abcdefghij"), input("A", 1_000));

    expect(transition.state.status).toBe("active");
    expect(transition.state.cursor).toBe(1);
    expect(transition.state.totalInputs).toBe(1);
    expect(transition.state.events).toHaveLength(0);
  });

  it("does not count a wrong first input as a mistake or reset", () => {
    const first = applySessionAction(createIdleSession("abcdefghij"), input("z", 1_000));
    const second = applySessionAction(first.state, input("a", 1_100));
    const event = second.state.events[0];

    expect(first.state.cursor).toBe(0);
    expect(first.state.mistakeCount).toBe(0);
    expect(first.state.resetCount).toBe(0);
    expect(second.state.totalInputs).toBe(2);
    expect(event?.intervalMs).toBeNull();
    expect(event?.isCorrect).toBe(true);
  });

  it("records a later mistake and resets the cursor", () => {
    const first = applySessionAction(createIdleSession("abcdefghij"), input("a", 1_000));
    const second = applySessionAction(first.state, input("b", 1_100));
    const third = applySessionAction(second.state, input("x", 1_250));
    const event = third.state.events.at(-1);

    expect(third.state.cursor).toBe(0);
    expect(third.state.mistakeCount).toBe(1);
    expect(third.state.resetCount).toBe(1);
    expect(event?.positionBefore).toBe(2);
    expect(event?.positionAfter).toBe(0);
    expect(event?.intervalMs).toBe(150);
  });

  it("completes a play and stores the first input only in the summary total", () => {
    let state = createIdleSession("abcdefghij");
    let completedRecord = null;

    for (const [index, key] of "abcdefghij".split("").entries()) {
      const transition = applySessionAction(
        state,
        input(key, 1_000 + index * 100),
        () => "klmnopqrst",
      );

      state = transition.state;
      completedRecord = transition.completedRecord ?? completedRecord;
    }

    expect(completedRecord).not.toBeNull();
    expect(completedRecord?.events).toHaveLength(9);
    expect(completedRecord?.summary.totalInputs).toBe(10);
    expect(completedRecord?.summary.correctInputs).toBe(9);
    expect(completedRecord?.summary.accuracy).toBe(1);
    expect(completedRecord?.durationMs).toBe(900);
    expect(state.prompt).toBe("klmnopqrst");
    expect(state.status).toBe("idle");
  });

  it("ignores non-alphabet input and cancels an active play with Escape action", () => {
    const idle = createIdleSession("abcdefghij");
    const ignored = applySessionAction(idle, input("1", 1_000));
    const active = applySessionAction(ignored.state, input("a", 1_100));
    const cancelled = applySessionAction(active.state, { type: "cancel" }, () => "klmnopqrst");

    expect(ignored.state).toEqual(idle);
    expect(cancelled.completedRecord).toBeNull();
    expect(cancelled.state.status).toBe("idle");
    expect(cancelled.state.prompt).toBe("klmnopqrst");
  });
});
