import { useCallback, useEffect, useRef, useState } from "preact/hooks";

/**
 * Create a origin wide lock on a given key. The function returns a tuple: a
 * boolean indicating whether the lock is currently held by this hook, and a
 * function that can be used to steal the lock from another hook (even on a
 * different tab).
 */
export function useLock(name: string): [locked: boolean, steal: () => void] {
  if (!("locks" in navigator)) {
    return [true, () => {}]; // on browsers that lack locks, always pretend we're locked
  }

  const [locked, setLocked] = useState(false);
  const aborter = useRef<AbortController | undefined>(undefined);

  async function acquireLock(steal: boolean) {
    // If there is already a lock request, or an ongoing abort, cancel it.
    if (aborter.current) {
      aborter.current.abort();
    }

    // Create a new abort controller.
    aborter.current = new AbortController();

    // Request a new lock with the given name. If the steal flag is set, we try
    // to steal the lock.
    try {
      await navigator.locks.request(name, { steal }, async () => {
        // The lock has been granted.
        setLocked(true);
        // Now stall the promise until the aborter is aborted.
        await new Promise<void>((resolve) => {
          const signal = aborter.current.signal;
          signal.addEventListener("abort", () => resolve(), { once: true });
          // If an abort was issued between lock grant, and now, we will have
          // missed it. If so, resolve the promise immediately.
          if (signal.aborted) {
            resolve();
            return;
          }
        });
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // The lock request was aborted. We can ignore this.
      } else {
        console.error(`Failed to acquire lock '${name}'`, err);
      }
    } finally {
      // If the lock request failed, or succeeded, the lock should now be
      // released.
      setLocked(false);
    }
  }

  useEffect(() => {
    acquireLock(false);
  }, []);

  const steal = useCallback(() => {
    acquireLock(true);
  }, []);

  return [locked, steal];
}

declare global {
  interface Navigator {
    locks: LockManager;
  }

  interface LockManager {
    request<T>(
      name: string,
      callback: (lock?: Lock) => Promise<T> | T
    ): Promise<T>;
    request<T>(
      name: string,
      options: LockOptions,
      callback: (lock?: Lock) => Promise<T> | T
    ): Promise<T>;

    query(): Promise<LockManagerSnapshot>;
  }

  type LockMode = "shared" | "exclusive";

  interface LockOptions {
    mode?: LockMode;
    ifAvailable?: boolean;
    steal?: boolean;
    signal?: AbortSignal;
  }

  interface LockManagerSnapshot {
    held: LockInfo[];
    pending: LockInfo[];
  }

  interface LockInfo {
    name: string;
    mode: LockMode;
    clientId: string;
  }

  interface Lock {
    name: string;
    mode: LockMode;
  }
}
