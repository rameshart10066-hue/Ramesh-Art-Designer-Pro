import type { BaseObjectData } from "@/types/objects";

/**
 * Command Pattern History Service
 * Implements unlimited undo/redo with command batching
 */

export interface Command {
  type: string;
  execute: (objects: BaseObjectData[]) => BaseObjectData[];
  undo: (objects: BaseObjectData[]) => BaseObjectData[];
  description: string;
}

export interface CommandHistory {
  past: Command[];
  future: Command[];
  batchMode: boolean;
  batchCommands: Command[];
}

export function createCommandHistory(): CommandHistory {
  return {
    past: [],
    future: [],
    batchMode: false,
    batchCommands: [],
  };
}

// Start batching commands (for drag operations)
export function startBatch(history: CommandHistory): CommandHistory {
  return {
    ...history,
    batchMode: true,
    batchCommands: [],
  };
}

// End batching and create single history entry
export function endBatch(history: CommandHistory, description: string = "Batch operation"): CommandHistory {
  if (!history.batchMode || history.batchCommands.length === 0) {
    return { ...history, batchMode: false, batchCommands: [] };
  }

  const batchCommand: Command = {
    type: "batch",
    description,
    execute: (objects) => {
      let result = objects;
      for (const cmd of history.batchCommands) {
        result = cmd.execute(result);
      }
      return result;
    },
    undo: (objects) => {
      let result = objects;
      // Undo in reverse order
      for (let i = history.batchCommands.length - 1; i >= 0; i--) {
        result = history.batchCommands[i]!.undo(result);
      }
      return result;
    },
  };

  return {
    past: [...history.past, batchCommand],
    future: [],
    batchMode: false,
    batchCommands: [],
  };
}

// Add command to history
export function addCommand(history: CommandHistory, command: Command): CommandHistory {
  if (history.batchMode) {
    return {
      ...history,
      batchCommands: [...history.batchCommands, command],
    };
  }

  return {
    ...history,
    past: [...history.past, command],
    future: [],
    batchMode: false,
    batchCommands: [],
  };
}

// Execute and add command
export function executeCommand(
  history: CommandHistory,
  objects: BaseObjectData[],
  command: Command
): { history: CommandHistory; objects: BaseObjectData[] } {
  const newObjects = command.execute(objects);
  const newHistory = addCommand(history, command);
  return { history: newHistory, objects: newObjects };
}

// Undo last command
export function undo(
  history: CommandHistory,
  objects: BaseObjectData[]
): { history: CommandHistory; objects: BaseObjectData[] } | null {
  if (history.past.length === 0) return null;

  const command = history.past[history.past.length - 1];
  if (!command) return null;

  const newObjects = command.undo(objects);

  return {
    history: {
      ...history,
      past: history.past.slice(0, -1),
      future: [command, ...history.future],
    },
    objects: newObjects,
  };
}

// Redo last undone command
export function redo(
  history: CommandHistory,
  objects: BaseObjectData[]
): { history: CommandHistory; objects: BaseObjectData[] } | null {
  if (history.future.length === 0) return null;

  const command = history.future[0];
  if (!command) return null;

  const newObjects = command.execute(objects);

  return {
    history: {
      ...history,
      past: [...history.past, command],
      future: history.future.slice(1),
    },
    objects: newObjects,
  };
}

export function canUndo(history: CommandHistory): boolean {
  return history.past.length > 0;
}

export function canRedo(history: CommandHistory): boolean {
  return history.future.length > 0;
}

export function clearHistory(): CommandHistory {
  return createCommandHistory();
}

// Command factories for common operations

export function createMoveCommand(
  objectId: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): Command {
  return {
    type: "move",
    description: `Move object ${objectId}`,
    execute: (objects) =>
      objects.map((obj) => (obj.id === objectId ? { ...obj, x: toX, y: toY } : obj)),
    undo: (objects) =>
      objects.map((obj) => (obj.id === objectId ? { ...obj, x: fromX, y: fromY } : obj)),
  };
}

export function createResizeCommand(
  objectId: number,
  fromSize: { x: number; y: number; width: number; height: number },
  toSize: { x: number; y: number; width: number; height: number }
): Command {
  return {
    type: "resize",
    description: `Resize object ${objectId}`,
    execute: (objects) =>
      objects.map((obj) =>
        obj.id === objectId
          ? { ...obj, x: toSize.x, y: toSize.y, width: toSize.width, height: toSize.height }
          : obj
      ),
    undo: (objects) =>
      objects.map((obj) =>
        obj.id === objectId
          ? { ...obj, x: fromSize.x, y: fromSize.y, width: fromSize.width, height: fromSize.height }
          : obj
      ),
  };
}

export function createRotateCommand(
  objectId: number,
  fromRotation: number,
  toRotation: number
): Command {
  return {
    type: "rotate",
    description: `Rotate object ${objectId}`,
    execute: (objects) =>
      objects.map((obj) => (obj.id === objectId ? { ...obj, rotation: toRotation } : obj)),
    undo: (objects) =>
      objects.map((obj) => (obj.id === objectId ? { ...obj, rotation: fromRotation } : obj)),
  };
}

export function createDeleteCommand(deletedObject: BaseObjectData): Command {
  return {
    type: "delete",
    description: `Delete ${deletedObject.name}`,
    execute: (objects) => objects.filter((obj) => obj.id !== deletedObject.id),
    undo: (objects) => [...objects, deletedObject],
  };
}

export function createAddCommand(newObject: BaseObjectData): Command {
  return {
    type: "add",
    description: `Add ${newObject.name}`,
    execute: (objects) => [...objects, newObject],
    undo: (objects) => objects.filter((obj) => obj.id !== newObject.id),
  };
}

export function createDuplicateCommand(original: BaseObjectData, duplicate: BaseObjectData): Command {
  return {
    type: "duplicate",
    description: `Duplicate ${original.name}`,
    execute: (objects) => [...objects, duplicate],
    undo: (objects) => objects.filter((obj) => obj.id !== duplicate.id),
  };
}

export function createZIndexCommand(
  objectId: number,
  fromZIndex: number,
  toZIndex: number,
  affectedObjects: { id: number; fromZIndex: number; toZIndex: number }[]
): Command {
  return {
    type: "zindex",
    description: `Reorder object ${objectId}`,
    execute: (objects) =>
      objects.map((obj) => {
        const affected = affectedObjects.find((a) => a.id === obj.id);
        if (affected) {
          return { ...obj, zIndex: affected.toZIndex };
        }
        if (obj.id === objectId) {
          return { ...obj, zIndex: toZIndex };
        }
        return obj;
      }),
    undo: (objects) =>
      objects.map((obj) => {
        const affected = affectedObjects.find((a) => a.id === obj.id);
        if (affected) {
          return { ...obj, zIndex: affected.fromZIndex };
        }
        if (obj.id === objectId) {
          return { ...obj, zIndex: fromZIndex };
        }
        return obj;
      }),
  };
}

export function createPropertyCommand<K extends keyof BaseObjectData>(
  objectId: number,
  property: K,
  fromValue: BaseObjectData[K],
  toValue: BaseObjectData[K]
): Command {
  return {
    type: "property",
    description: `Change ${String(property)} of object ${objectId}`,
    execute: (objects) =>
      objects.map((obj) => (obj.id === objectId ? { ...obj, [property]: toValue } : obj)),
    undo: (objects) =>
      objects.map((obj) => (obj.id === objectId ? { ...obj, [property]: fromValue } : obj)),
  };
}
