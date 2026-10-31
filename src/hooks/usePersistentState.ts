import { useState, useEffect, useRef } from 'react';
import { STORAGE_PREFIX, safeRead, safeWrite } from '../lib/storage';

/**
 * Hook for lazily hydrating and persisting a specific state slice in localStorage.
 * Reads initially from `${STORAGE_PREFIX}v2_${name}` via `safeRead`.
 * Writes ONLY its own slice when that slice changes (one effect per slice).
 */
export function usePersistentState<T>(
  name: string,
  initial: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = `${STORAGE_PREFIX}v2_${name}`;

  const [state, setState] = useState<T>(() => {
    return safeRead<T>(storageKey, initial);
  });

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    safeWrite(storageKey, state);
  }, [storageKey, state]);

  return [state, setState];
}
