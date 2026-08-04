/**
 * 3D Scene
 *
 * Manages the Three.js scene, grid floor, axis helper, and object groups.
 */

import * as THREE from "three";

export interface Scene3D {
  scene: THREE.Scene;
  gridHelper: THREE.GridHelper;
  axisHelper: THREE.AxesHelper;
  objectGroup: THREE.Group;
  groundPlane: THREE.Mesh;
}

export function createScene3D(): Scene3D {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);

  // Grid
  const gridHelper = new THREE.GridHelper(3000, 30, 0x334155, 0x1e293b);
  gridHelper.position.y = -0.5;

  // Axis helper
  const axisHelper = new THREE.AxesHelper(200);

  // Object group (all parts go here)
  const objectGroup = new THREE.Group();

  // Ground plane (for shadows)
  const groundGeo = new THREE.PlaneGeometry(3000, 3000);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.3 });
  const groundPlane = new THREE.Mesh(groundGeo, groundMat);
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.position.y = -0.5;
  groundPlane.receiveShadow = true;

  scene.add(gridHelper);
  scene.add(axisHelper);
  scene.add(objectGroup);
  scene.add(groundPlane);

  return { scene, gridHelper, axisHelper, objectGroup, groundPlane };
}

export function clearObjectGroup(group: THREE.Group): void {
  while (group.children.length > 0) {
    const child = group.children[0]!;
    group.remove(child);
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  }
}
