import type { BaseObjectData } from "@/types/objects";

/**
 * Selection Service
 * Manages object selection logic
 */

export function selectSingle(objectId: number): number[] {
  return [objectId];
}

export function toggleSelection(currentIds: number[], objectId: number): number[] {
  if (currentIds.includes(objectId)) {
    return currentIds.filter((id) => id !== objectId);
  }
  return [...currentIds, objectId];
}

export function selectMultiple(currentIds: number[], objectId: number, isMultiSelect: boolean): number[] {
  if (isMultiSelect) {
    return toggleSelection(currentIds, objectId);
  }
  return selectSingle(objectId);
}

export function selectAll(objects: BaseObjectData[]): number[] {
  return objects.map((obj) => obj.id);
}

export function clearSelection(): number[] {
  return [];
}

export function getSelectedObjects(objects: BaseObjectData[], selectedIds: number[]): BaseObjectData[] {
  return objects.filter((obj) => selectedIds.includes(obj.id));
}

export function isSelected(objectId: number, selectedIds: number[]): boolean {
  return selectedIds.includes(objectId);
}

export function hasSelection(selectedIds: number[]): boolean {
  return selectedIds.length > 0;
}

export function isSingleSelection(selectedIds: number[]): boolean {
  return selectedIds.length === 1;
}

export function isMultiSelection(selectedIds: number[]): boolean {
  return selectedIds.length > 1;
}
