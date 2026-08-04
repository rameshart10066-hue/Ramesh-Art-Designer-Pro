/**
 * Conversation Memory
 *
 * Maintains conversation history with full undo/redo support.
 * Each turn stores the prompt, DNA, components, and validation.
 */

import type { DesignResult } from "./DesignComposer";
import type { DesignDNA } from "@/product-model/DNAEngine";

export interface ConversationTurn {
  id: string;
  prompt: string;
  result: DesignResult;
  timestamp: number;
}

export class ConversationMemory {
  private history: ConversationTurn[] = [];
  private future: ConversationTurn[] = [];
  private turnId = 1;

  /** Add a new turn */
  addTurn(prompt: string, result: DesignResult): ConversationTurn {
    const turn: ConversationTurn = {
      id: `turn-${this.turnId++}`,
      prompt,
      result,
      timestamp: Date.now(),
    };
    this.history.push(turn);
    this.future = []; // Clear redo stack
    return turn;
  }

  /** Undo last turn */
  undo(): ConversationTurn | null {
    if (this.history.length === 0) return null;
    const turn = this.history.pop()!;
    this.future.push(turn);
    return this.history.length > 0 ? this.history[this.history.length - 1]! : null;
  }

  /** Redo last undone turn */
  redo(): ConversationTurn | null {
    if (this.future.length === 0) return null;
    const turn = this.future.pop()!;
    this.history.push(turn);
    return turn;
  }

  /** Get current/latest turn */
  getCurrent(): ConversationTurn | null {
    return this.history.length > 0 ? this.history[this.history.length - 1]! : null;
  }

  /** Get current DNA for modification */
  getCurrentDNA(): DesignDNA | null {
    return this.getCurrent()?.result.dna ?? null;
  }

  /** Get all history */
  getAll(): ConversationTurn[] {
    return [...this.history];
  }

  /** Clear all */
  clear(): void {
    this.history = [];
    this.future = [];
    this.turnId = 1;
  }

  /** Can undo? */
  get canUndo(): boolean { return this.history.length > 0; }

  /** Can redo? */
  get canRedo(): boolean { return this.future.length > 0; }

  /** Total turns */
  get length(): number { return this.history.length; }
}

export const conversationMemory = new ConversationMemory();
