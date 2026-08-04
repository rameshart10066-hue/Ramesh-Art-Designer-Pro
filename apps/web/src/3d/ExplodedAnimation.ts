/**
 * Exploded View Animation
 *
 * Smoothly animates components between assembled and exploded positions.
 * Uses requestAnimationFrame for 60 FPS transitions.
 */

import * as THREE from "three";
import type { ExplodedPosition } from "@/product-model/ExplodedView";

export class ExplodedAnimation {
  private meshes: Map<number, THREE.Mesh> = new Map();
  private positions: ExplodedPosition[] = [];
  private progress: number = 0; // 0 = assembled, 1 = exploded
  private targetProgress: number = 0;
  private animationId: number | null = null;

  /** Register meshes with their exploded positions */
  setMeshes(meshes: Map<number, THREE.Mesh>, positions: ExplodedPosition[]): void {
    this.meshes = meshes;
    this.positions = positions;
  }

  /** Start animation to target state */
  animateTo(target: number, duration: number = 800): void {
    this.targetProgress = Math.max(0, Math.min(1, target));
    const startProgress = this.progress;
    const delta = this.targetProgress - startProgress;
    const startTime = performance.now();

    if (this.animationId) cancelAnimationFrame(this.animationId);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(1, elapsed / duration);
      // Ease in-out
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      this.progress = startProgress + delta * eased;
      this.updatePositions();

      if (t < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.progress = this.targetProgress;
        this.updatePositions();
        this.animationId = null;
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /** Toggle between assembled and exploded */
  toggle(duration: number = 800): void {
    this.animateTo(this.progress < 0.5 ? 1 : 0, duration);
  }

  /** Instantly set to a specific progress */
  setProgress(p: number): void {
    this.progress = Math.max(0, Math.min(1, p));
    this.updatePositions();
  }

  /** Get current progress */
  getProgress(): number {
    return this.progress;
  }

  /** Update mesh positions based on current progress */
  private updatePositions(): void {
    for (const pos of this.positions) {
      const mesh = this.meshes.get(pos.nodeId);
      if (!mesh) continue;

      const x = pos.originalX + (pos.explodedX - pos.originalX) * this.progress;
      const y = pos.originalY + (pos.explodedY - pos.originalY) * this.progress;
      const z = pos.originalZ + (pos.explodedZ - pos.originalZ) * this.progress;

      mesh.position.set(x, y, z);
    }
  }

  /** Clean up */
  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.meshes.clear();
    this.positions = [];
  }
}
