"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Track the rendered width of an element via ResizeObserver.
 * Returns a ref to attach and the current width in px (0 before first measure).
 */
export function useContainerWidth<T extends HTMLElement>(): { ref: React.RefObject<T>; width: number } {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
