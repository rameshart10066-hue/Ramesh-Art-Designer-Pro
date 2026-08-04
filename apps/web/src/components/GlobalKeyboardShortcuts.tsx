"use client";

import { useEffect, useRef } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";

/**
 * Canva-Style Global Keyboard Shortcuts
 * Complete keyboard and mouse interaction support
 *
 * Performance note: all dynamic store values (objects, selection, zoom, pan)
 * are read through `useEditorStoreV2.getState()` inside the event handlers,
 * and the local panning flag lives in a ref. The effect therefore registers
 * its window listeners exactly once instead of tearing down/re-adding them on
 * every object move, selection change, or zoom tick.
 */

export function GlobalKeyboardShortcuts() {
  const isPanningRef = useRef(false);

  const undo = useEditorStoreV2((state) => state.undo);
  const redo = useEditorStoreV2((state) => state.redo);
  const canUndo = useEditorStoreV2((state) => state.canUndo);
  const canRedo = useEditorStoreV2((state) => state.canRedo);
  const copy = useEditorStoreV2((state) => state.copy);
  const cut = useEditorStoreV2((state) => state.cut);
  const paste = useEditorStoreV2((state) => state.paste);
  const selectAll = useEditorStoreV2((state) => state.selectAll);
  const removeObject = useEditorStoreV2((state) => state.removeObject);
  const duplicateObject = useEditorStoreV2((state) => state.duplicateObject);
  const clearSelection = useEditorStoreV2((state) => state.clearSelection);
  const updateObject = useEditorStoreV2((state) => state.updateObject);
  const startBatch = useEditorStoreV2((state) => state.startBatch);
  const endBatch = useEditorStoreV2((state) => state.endBatch);
  const setZoom = useEditorStoreV2((state) => state.setZoom);
  const setPan = useEditorStoreV2((state) => state.setPan);

  useEffect(() => {
    function isInputElement(target: HTMLElement): boolean {
      return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );
    }

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (isInputElement(target)) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Z = Undo
      if (modifier && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
        return;
      }

      // Ctrl/Cmd + Shift + Z = Redo
      if (modifier && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        if (canRedo()) redo();
        return;
      }

      // Ctrl/Cmd + Y = Redo (alternative)
      if (modifier && e.key === "y") {
        e.preventDefault();
        if (canRedo()) redo();
        return;
      }

      // Ctrl/Cmd + C = Copy
      if (modifier && e.key === "c") {
        e.preventDefault();
        copy();
        return;
      }

      // Ctrl/Cmd + X = Cut
      if (modifier && e.key === "x") {
        e.preventDefault();
        cut();
        return;
      }

      // Ctrl/Cmd + V = Paste
      if (modifier && e.key === "v") {
        e.preventDefault();
        paste();
        return;
      }

      // Ctrl/Cmd + A = Select All
      if (modifier && e.key === "a") {
        e.preventDefault();
        selectAll();
        return;
      }

      // Ctrl/Cmd + D = Duplicate
      if (modifier && e.key === "d") {
        e.preventDefault();
        const { selectedIds } = useEditorStoreV2.getState();
        if (selectedIds.length === 1) {
          duplicateObject(selectedIds[0]!);
        }
        return;
      }

      // Delete or Backspace = Delete selected
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const { selectedIds } = useEditorStoreV2.getState();
        for (const id of selectedIds) {
          removeObject(id);
        }
        return;
      }

      // Esc = Clear selection
      if (e.key === "Escape") {
        e.preventDefault();
        clearSelection();
        return;
      }

      // Space = Enable pan mode
      if (e.key === " " && !isPanningRef.current) {
        e.preventDefault();
        isPanningRef.current = true;
        document.body.style.cursor = "grab";
        return;
      }

      // Arrow Keys = Move selected objects
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const { selectedIds, objects } = useEditorStoreV2.getState();
        if (selectedIds.length === 0) return;

        const step = e.shiftKey ? 10 : 1; // Shift = move 10px
        let dx = 0,
          dy = 0;

        if (e.key === "ArrowUp") dy = -step;
        if (e.key === "ArrowDown") dy = step;
        if (e.key === "ArrowLeft") dx = -step;
        if (e.key === "ArrowRight") dx = step;

        startBatch();
        for (const id of selectedIds) {
          const obj = objects.find((o) => o.id === id);
          if (obj) {
            updateObject(id, { x: obj.x + dx, y: obj.y + dy });
          }
        }
        endBatch("Move with arrow keys");
        return;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      // Space released = Disable pan mode
      if (e.key === " " && isPanningRef.current) {
        e.preventDefault();
        isPanningRef.current = false;
        document.body.style.cursor = "";
        return;
      }
    }

    function handleWheel(e: WheelEvent) {
      const target = e.target as HTMLElement;
      if (isInputElement(target)) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + MouseWheel = Zoom
      if (modifier) {
        e.preventDefault();
        const { zoom } = useEditorStoreV2.getState();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.1, Math.min(5, zoom + delta));
        setZoom(newZoom);
        return;
      }
    }

    let panStartX = 0;
    let panStartY = 0;
    let panInitialX = 0;
    let panInitialY = 0;

    function handleMouseDown(e: MouseEvent) {
      if (isPanningRef.current && e.button === 0) {
        const { panX, panY } = useEditorStoreV2.getState();
        panStartX = e.clientX;
        panStartY = e.clientY;
        panInitialX = panX;
        panInitialY = panY;
        document.body.style.cursor = "grabbing";
      }
    }

    function handleMouseMove(e: MouseEvent) {
      if (isPanningRef.current && e.buttons === 1) {
        const dx = e.clientX - panStartX;
        const dy = e.clientY - panStartY;
        setPan(panInitialX + dx, panInitialY + dy);
      }
    }

    function handleMouseUp() {
      if (isPanningRef.current) {
        document.body.style.cursor = "grab";
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      isPanningRef.current = false;
    };
  }, [
    undo,
    redo,
    canUndo,
    canRedo,
    copy,
    cut,
    paste,
    selectAll,
    removeObject,
    duplicateObject,
    clearSelection,
    updateObject,
    startBatch,
    endBatch,
    setZoom,
    setPan,
  ]);

  return null;
}
