import { openDB } from "idb";

import type { PlayRecord } from "../domain/types.ts";

const DATABASE_NAME = "typing-level-zero";
const DATABASE_VERSION = 1;
const STORE_NAME = "runs";

interface TypingDatabase {
  runs: {
    key: string;
    value: PlayRecord;
  };
}

export class StorageError extends Error {
  constructor(message: string, options?: { readonly cause?: unknown }) {
    super(message, options);
    this.name = "StorageError";
  }
}

let databasePromise: ReturnType<typeof openDB<TypingDatabase>> | null = null;

function getDatabase() {
  if (typeof indexedDB === "undefined") {
    throw new StorageError("IndexedDB is unavailable. Enable browser storage and reload the page.");
  }

  databasePromise ??= openDB<TypingDatabase>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });

  void databasePromise.catch(() => {
    databasePromise = null;
  });

  return databasePromise;
}

export interface PlayRepository {
  readonly save: (record: PlayRecord) => Promise<void>;
  readonly getAll: () => Promise<PlayRecord[]>;
  readonly getById: (id: string) => Promise<PlayRecord | undefined>;
  readonly deleteAll: () => Promise<void>;
}

async function withStorageError<T>(operation: () => Promise<T>, action: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    throw new StorageError(`Unable to ${action}. Check browser storage permissions and retry.`, {
      cause: error,
    });
  }
}

export const playRepository: PlayRepository = {
  async deleteAll() {
    await withStorageError(async () => {
      const database = await getDatabase();
      const transaction = database.transaction(STORE_NAME, "readwrite");

      await transaction.objectStore(STORE_NAME).clear();
      await transaction.done;
    }, "delete saved plays");
  },

  async getAll() {
    return withStorageError(async () => {
      const database = await getDatabase();
      const records = await database.getAll(STORE_NAME);

      return records.sort(
        (left, right) => right.completedAt - left.completedAt || right.id.localeCompare(left.id),
      );
    }, "load saved plays");
  },

  async getById(id) {
    return withStorageError(async () => {
      const database = await getDatabase();

      return database.get(STORE_NAME, id);
    }, "load the selected play");
  },

  async save(record) {
    await withStorageError(async () => {
      const database = await getDatabase();
      const transaction = database.transaction(STORE_NAME, "readwrite");

      await transaction.objectStore(STORE_NAME).put(record);
      await transaction.done;
    }, "save the completed play");
  },
};

export function resetDatabaseConnectionForTests(): void {
  databasePromise = null;
}
