/**
 * 3D Selection
 *
 * Raycaster-based object selection in the 3D viewport.
 */

import * as THREE from "three";

export class Selection3D {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private selected: THREE.Mesh | null = null;
  private highlightMaterial: THREE.MeshStandardMaterial | null = null;
  private originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

  /** Cast a ray and select the first intersected object */
  select(
    event: MouseEvent,
    camera: THREE.PerspectiveCamera,
    container: HTMLElement,
    meshes: THREE.Mesh[],
  ): THREE.Mesh | null {
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(meshes);

    this.clearSelection();

    if (intersects.length > 0) {
      const hit = intersects[0]!.object as THREE.Mesh;
      if (hit) {
        this.selected = hit;
        this.originalMaterials.set(hit, hit.material);
        const highlightMat = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          emissive: 0x1e40af,
          emissiveIntensity: 0.3,
          roughness: 0.3,
          metalness: 0.1,
        });
        hit.material = highlightMat;
        this.highlightMaterial = highlightMat;
      }
    }

    return this.selected;
  }

  /** Get currently selected mesh */
  getSelected(): THREE.Mesh | null {
    return this.selected;
  }

  /** Get the ID of the selected object (stored in userData) */
  getSelectedId(): number | null {
    return this.selected?.userData?.objectId ?? null;
  }

  /** Clear selection and restore original materials */
  clearSelection(): void {
    if (this.selected) {
      const original = this.originalMaterials.get(this.selected);
      if (original) this.selected.material = original;
      this.originalMaterials.delete(this.selected);
    }
    this.selected = null;
    this.highlightMaterial = null;
  }

  /** Dispose resources */
  dispose(): void {
    this.clearSelection();
    this.originalMaterials.clear();
  }
}
