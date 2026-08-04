"use client";

import { cloneElement, useEffect, useRef, useState, type ReactElement, type UIEvent } from "react";
import { computeVirtualRange } from "../catalogService";
import { useContainerWidth } from "../hooks/useContainerWidth";

const MIN_CARD_WIDTH = 240;
const MAX_COLUMNS = 6;

interface VirtualCatalogGridProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => ReactElement;
  /**
   * Stable, unique key for each item (e.g. `item.id` / `templateId`).
   * The grid applies it to the rendered card so React can reconcile the
   * virtualized list — never fall back to the array index.
   */
  getItemKey: (item: T, index: number) => string | number;
  cardHeight: number;
  gap?: number;
  overscan?: number;
  minCardWidth?: number;
}

/**
 * Lightweight virtualized grid — only the rows inside the viewport (plus a
 * small overscan) are mounted, so the catalog can hold 100+ designs without
 * paying the DOM cost of rendering them all.
 */
export function VirtualCatalogGrid<T>({
  items,
  renderCard,
  getItemKey,
  cardHeight,
  gap = 16,
  overscan = 2,
  minCardWidth = MIN_CARD_WIDTH,
}: VirtualCatalogGridProps<T>) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { ref: widthRef, width } = useContainerWidth<HTMLDivElement>();
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Reset scroll when the result set changes identity (e.g. a filter toggles).
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 });
    setScrollTop(0);
  }, [items]);

  const columns = Math.max(1, Math.min(MAX_COLUMNS, Math.floor((width || 320) / (minCardWidth + gap))));
  const rowHeight = cardHeight + gap;
  const totalHeight = Math.max(0, Math.ceil(items.length / columns) * rowHeight - gap);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setScrollTop(el.scrollTop);
    setViewportHeight(el.clientHeight);
  };

  const { startIndex, endIndex } = computeVirtualRange({
    scrollTop,
    viewportHeight,
    rowHeight,
    columns,
    totalItems: items.length,
    overscan,
  });

  const visibleItems = items.slice(startIndex, endIndex);
  const translateY = Math.floor(startIndex / columns) * rowHeight;

  return (
    <div
      ref={scrollerRef}
      onScroll={handleScroll}
      style={{ flex: 1, overflowY: "auto", position: "relative", height: "100%" }}
    >
      <div ref={widthRef} style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${translateY}px)`,
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridAutoRows: cardHeight,
            gap,
          }}
        >
          {visibleItems.map((item, i) => {
            const index = startIndex + i;
            // Apply the caller's stable key (item.id, templateId, …) to the
            // rendered card so React can reconcile the virtualized slice.
            return cloneElement(renderCard(item, index), { key: getItemKey(item, index) });
          })}
        </div>
      </div>
    </div>
  );
}
