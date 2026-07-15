import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { playRepository, StorageError } from "./playRepository.ts";

import type { PlayRecord } from "../domain/types.ts";

interface RecordsContextValue {
  readonly records: readonly PlayRecord[];
  readonly isLoading: boolean;
  readonly error: StorageError | null;
  readonly saveRecord: (record: PlayRecord) => Promise<void>;
  readonly deleteAll: () => Promise<void>;
  readonly reload: () => Promise<void>;
  readonly clearError: () => void;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

function sortRecords(records: readonly PlayRecord[]): PlayRecord[] {
  return [...records].sort(
    (left, right) => right.completedAt - left.completedAt || right.id.localeCompare(left.id),
  );
}

export function RecordsProvider({ children }: { readonly children: ReactNode }) {
  const [records, setRecords] = useState<PlayRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<StorageError | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);

    try {
      setRecords(await playRepository.getAll());
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof StorageError
          ? cause
          : new StorageError("Unable to load saved plays. Retry after enabling browser storage.", {
              cause,
            }),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveRecord = useCallback(async (record: PlayRecord) => {
    try {
      await playRepository.save(record);

      setRecords((current) =>
        sortRecords([...current.filter((item) => item.id !== record.id), record]),
      );

      setError(null);
    } catch (cause) {
      const storageError =
        cause instanceof StorageError
          ? cause
          : new StorageError(
              "Unable to save the completed play. Retry after enabling browser storage.",
              {
                cause,
              },
            );

      setError(storageError);

      throw storageError;
    }
  }, []);

  const deleteAll = useCallback(async () => {
    try {
      await playRepository.deleteAll();
      setRecords([]);
      setError(null);
    } catch (cause) {
      const storageError =
        cause instanceof StorageError
          ? cause
          : new StorageError(
              "Unable to delete saved plays. Retry after enabling browser storage.",
              {
                cause,
              },
            );

      setError(storageError);

      throw storageError;
    }
  }, []);

  const value = useMemo<RecordsContextValue>(
    () => ({
      clearError: () => setError(null),
      deleteAll,
      error,
      isLoading,
      records,
      reload,
      saveRecord,
    }),
    [deleteAll, error, isLoading, records, reload, saveRecord],
  );

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords(): RecordsContextValue {
  const context = useContext(RecordsContext);

  if (!context) {
    throw new Error("useRecords must be used inside RecordsProvider");
  }

  return context;
}
