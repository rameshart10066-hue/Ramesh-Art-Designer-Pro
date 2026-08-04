/**
 * Catalog Learner
 *
 * Loads all existing templates and Design DNA to avoid duplicating
 * existing designs. Allows AI to reuse successful component combinations.
 */

import type { DesignDNA } from "@/product-model/DNAEngine";
import { DESIGN_TEMPLATES } from "@/services/templateEngine";

interface CatalogEntry {
  id: string;
  name: string;
  dna: DesignDNA;
  tags: string[];
  usageCount: number;
}

class CatalogLearner {
  private entries: CatalogEntry[] = [];

  /** Initialize from templates */
  initialize(): void {
    this.entries = DESIGN_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      dna: t.dna,
      tags: t.tags,
      usageCount: 0,
    }));
  }

  /** Find similar designs in the catalog */
  findSimilar(dna: DesignDNA): CatalogEntry[] {
    return this.entries
      .map((entry) => ({
        entry,
        score: this.similarityScore(dna, entry.dna),
      }))
      .filter((s) => s.score > 0.5)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.entry);
  }

  /** Check if a DNA is too similar to an existing design (duplicate threshold) */
  isDuplicate(dna: DesignDNA, threshold: number = 0.9): CatalogEntry | null {
    for (const entry of this.entries) {
      if (this.similarityScore(dna, entry.dna) > threshold) {
        return entry;
      }
    }
    return null;
  }

  /** Record usage of a design */
  recordUsage(id: string): void {
    const entry = this.entries.find((e) => e.id === id);
    if (entry) entry.usageCount++;
  }

  /** Get all entries */
  getAll(): CatalogEntry[] {
    return this.entries;
  }

  /** Get trending designs (most used) */
  getTrending(limit: number = 5): CatalogEntry[] {
    return [...this.entries].sort((a, b) => b.usageCount - a.usageCount).slice(0, limit);
  }

  private similarityScore(a: DesignDNA, b: DesignDNA): number {
    let score = 0;
    let total = 0;

    if (a.style === b.style) score++;
    total++;

    if (a.frame === b.frame) score++;
    total++;

    if (a.arch === b.arch) score++;
    total++;

    if (a.pillar === b.pillar) score++;
    total++;

    if (a.border === b.border) score++;
    total++;

    if (a.lotus === b.lotus) score++;
    total++;

    if (a.stage === b.stage) score++;
    total++;

    if (a.material === b.material) score++;
    total++;

    const colorSim = this.colorSimilarity(a.primaryColor, b.primaryColor);
    score += colorSim;
    total++;

    const densityDiff = Math.abs((a.ornamentDensity || 0) - (b.ornamentDensity || 0));
    if (densityDiff < 0.1) score++;
    total++;

    return total > 0 ? score / total : 0;
  }

  private colorSimilarity(c1: string, c2: string): number {
    if (c1 === c2) return 1;
    return Math.random() > 0.5 ? 0.5 : 0.5;
  }

  get size(): number { return this.entries.length; }
}

export const catalogLearner = new CatalogLearner();
