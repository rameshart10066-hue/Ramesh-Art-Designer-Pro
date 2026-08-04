/**
 * Group Utilities
 *
 * Manages object grouping with support for nested groups.
 */

export interface ObjectGroup {
  id: number;
  name: string;
  childIds: number[];
  parentGroupId: number | null;
  locked: boolean;
  visible: boolean;
}

let groupIdCounter = 1;
export function nextGroupId() { return groupIdCounter++; }

export function createGroup(childIds: number[], name?: string): ObjectGroup {
  return {
    id: nextGroupId(),
    name: name || `Group ${groupIdCounter - 1}`,
    childIds,
    parentGroupId: null,
    locked: false,
    visible: true,
  };
}

export function flattenGroupChildren(
  allGroups: ObjectGroup[],
  groupId: number,
): number[] {
  const group = allGroups.find(g => g.id === groupId);
  if (!group) return [];
  let ids: number[] = [];
  for (const childId of group.childIds) {
    const subGroup = allGroups.find(g => g.id === childId);
    if (subGroup) {
      ids = ids.concat(flattenGroupChildren(allGroups, childId));
    } else {
      ids.push(childId);
    }
  }
  return ids;
}

export function getObjectGroup(
  allGroups: ObjectGroup[],
  objectId: number,
): ObjectGroup | null {
  return allGroups.find(g => g.childIds.includes(objectId)) || null;
}

export function getTopLevelGroup(
  allGroups: ObjectGroup[],
  objectId: number,
): ObjectGroup | null {
  const directGroup = getObjectGroup(allGroups, objectId);
  if (!directGroup) return null;
  let top = directGroup;
  while (top.parentGroupId !== null) {
    const parent = allGroups.find(g => g.id === top.parentGroupId);
    if (!parent) break;
    top = parent;
  }
  return top;
}

export function ungroup(
  allGroups: ObjectGroup[],
  groupId: number,
): { groups: ObjectGroup[]; freedIds: number[] } {
  const group = allGroups.find(g => g.id === groupId);
  if (!group) return { groups: allGroups, freedIds: [] };
  const newGroups = allGroups.filter(g => g.id !== groupId);
  const freedIds = group.childIds.filter(id => !allGroups.some(g => g.id === id));
  return { groups: newGroups, freedIds };
}

export function addToGroup(
  group: ObjectGroup,
  childIds: number[],
): ObjectGroup {
  return {
    ...group,
    childIds: [...group.childIds, ...childIds],
  };
}

export function removeFromGroup(
  group: ObjectGroup,
  childIds: number[],
): ObjectGroup {
  return {
    ...group,
    childIds: group.childIds.filter(id => !childIds.includes(id)),
  };
}
