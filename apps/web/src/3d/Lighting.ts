/**
 * 3D Lighting
 *
 * Ambient + directional lighting with shadow support.
 */

import * as THREE from "three";

export interface LightingSetup {
  ambient: THREE.AmbientLight;
  directional: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  hemisphere: THREE.HemisphereLight;
}

export function createLighting(): LightingSetup {
  // Ambient light
  const ambient = new THREE.AmbientLight(0x404060, 0.4);

  // Main directional light (shadows)
  const directional = new THREE.DirectionalLight(0xffeedd, 1.2);
  directional.position.set(500, 800, 400);
  directional.castShadow = true;
  directional.shadow.mapSize.width = 2048;
  directional.shadow.mapSize.height = 2048;
  directional.shadow.camera.near = 1;
  directional.shadow.camera.far = 2000;
  directional.shadow.camera.left = -1000;
  directional.shadow.camera.right = 1000;
  directional.shadow.camera.top = 1000;
  directional.shadow.camera.bottom = -1000;
  directional.shadow.bias = -0.001;

  // Fill light
  const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
  fill.position.set(-300, 400, -200);

  // Hemisphere light
  const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x362d1a, 0.5);

  return { ambient, directional, fill, hemisphere };
}

export function addLightingToScene(scene: THREE.Scene, lighting: LightingSetup): void {
  scene.add(lighting.ambient);
  scene.add(lighting.directional);
  scene.add(lighting.fill);
  scene.add(lighting.hemisphere);
}
