import { useEffect, useState } from "react";

/**
 * Returns `value`, but delayed by `delayMs` after the last change —
 * standard debounce for search inputs. Kept inside the catalog module
 * (not the shared src/hooks/) since nothing else uses it yet; promote it
 * to src/hooks/ if a second module needs the same behavior.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
