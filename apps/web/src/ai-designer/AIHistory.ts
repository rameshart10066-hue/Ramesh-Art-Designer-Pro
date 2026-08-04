/**
 * AI Design History
 *
 * Persists AI-generated designs to localStorage and provides
 * browsing/search/favorites of past generations.
 */

import type { DesignResult } from "./DesignComposer";
import type { ConversationTurn } from "./ConversationMemory";

const STORAGE_KEY = "ramesh-ai-history";

interface HistoryEntry {
  id: string;
  prompt: string;
  dna: any;
  timestamp: number;
  favorite: boolean;
  tags: string[];
}

export class AIHistory {
  private entries: HistoryEntry[] = [];

  constructor() {
    this.load();
  }

  /** Save a design to history */
  save(turn: ConversationTurn, tags: string[] = []): void {
    const entry: HistoryEntry = {
      id: turn.id,
      prompt: turn.prompt,
      dna: turn.result.dna,
      timestamp: turn.timestamp,
      favorite: false,
      tags,
    };
    this.entries.unshift(entry);
    if (this.entries.length > 100) this.entries = this.entries.slice(0, 100);
    this.persist();
  }

  /** Toggle favorite */
  toggleFavorite(id: string): void {
    const entry = this.entries.find((e) => e.id === id);
    if (entry) entry.favorite = !entry.favorite;
    this.persist();
  }

  /** Search history */
  search(query: string): HistoryEntry[] {
    const q = query.toLowerCase();
    return this.entries.filter(
      (e) =>
        e.prompt.toLowerCase().includes(q) ||
        e.tags.some((t) => t.includes(q)),
    );
  }

  /** Get all entries */
  getAll(): HistoryEntry[] {
    return this.entries;
  }

  /** Get favorites only */
  getFavorites(): HistoryEntry[] {
    return this.entries.filter((e) => e.favorite);
  }

  /** Get recent */
  getRecent(limit: number = 10): HistoryEntry[] {
    return this.entries.slice(0, limit);
  }

  /** Delete an entry */
  delete(id: string): void {
    this.entries = this.entries.filter((e) => e.id !== id);
    this.persist();
  }

  /** Clear all */
  clear(): void {
    this.entries = [];
    this.persist();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.entries = JSON.parse(raw);
    } catch {}
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {}
  }

  get size(): number { return this.entries.length; }
}

export const aiHistory = new AIHistory();
