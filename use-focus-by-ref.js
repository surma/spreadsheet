import { useRef, useCallback } from "preact/hooks";

export default function useFocusByRef() {
  const ref = useCallback((arg) => {
    arg?.focus?.();
    arg?.select?.();
  }, []);
  return ref;
}
