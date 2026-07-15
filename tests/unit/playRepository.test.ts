import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

import {
  playRepository,
  resetDatabaseConnectionForTests,
} from "../../src/shared/storage/playRepository.ts";

import type { PlayRecord } from "../../src/shared/domain/types.ts";

const record: PlayRecord = {
  completedAt: 2_000,
  durationMs: 1_000,
  events: [],
  id: "test-record",
  prompt: "abcdefghij",
  startedAt: 1_000,
  summary: {
    accuracy: 0,
    correctInputs: 0,
    grossCpm: 0,
    grossWpm: 0,
    mistakeCount: 0,
    netCpm: 0,
    netWpm: 0,
    resetCount: 0,
    totalInputs: 1,
  },
};

describe("play repository", () => {
  beforeEach(async () => {
    resetDatabaseConnectionForTests();
    await playRepository.deleteAll();
  });

  it("saves and loads a complete play from the runs store", async () => {
    await playRepository.save(record);

    await expect(playRepository.getById(record.id)).resolves.toEqual(record);
    await expect(playRepository.getAll()).resolves.toEqual([record]);
  });

  it("deletes all saved plays", async () => {
    await playRepository.save(record);
    await playRepository.deleteAll();

    await expect(playRepository.getAll()).resolves.toEqual([]);
  });
});
