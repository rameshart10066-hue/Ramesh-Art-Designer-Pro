/**
 * Camera Controller
 *
 * Orbit, pan, and zoom controls with smooth camera transitions.
 * Uses Three.js OrbitControls for 360° inspection.
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface CameraState {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
}

export function createCamera(container: HTMLElement): CameraState {
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
  camera.position.set(800, 600, 800);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, container);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.8;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.6;
  controls.minDistance = 50;
  controls.maxDistance = 5000;
  controls.target.set(0, 0, 0);
  controls.update();

  return { camera, controls };
}

export function updateCamera(state: CameraState): void {
  state.controls.update();
}

export function resizeCamera(camera: THREE.PerspectiveCamera, width: number, height: number): void {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

export function focusOnObject(
  camera: THREE.PerspectiveCamera,
  position: THREE.Vector3,
  target: THREE.Vector3,
): void {
  camera.position.copy(position);
  camera.lookAt(target);
}
