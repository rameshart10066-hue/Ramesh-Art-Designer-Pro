"use client";

/**
 * 3D Viewport — Three.js integration for the design workspace
 *
 * Renders parametric objects as 3D meshes with material thickness,
 * orbit controls, lighting, grid, and selection synced with 2D canvas.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { generateMesh } from "@/product-model/MeshGenerator";
import { buildMesh, disposeMesh } from "@/3d/MeshBuilder";
import { createLighting, addLightingToScene } from "@/3d/Lighting";
import type { GeneratedGeometry } from "@/parametric/GeometryGenerator";

interface Viewport3DProps {
  /** Called when user selects an object in 3D view */
  onSelect?: (id: number | null) => void;
}

export function Viewport3D({ onSelect }: Viewport3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshMapRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const animFrameRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);

  const objects = useEditorStoreV2((s) => s.objects);
  const selectedIds = useEditorStoreV2((s) => s.selectedIds);
  const selectObject = useEditorStoreV2((s) => s.selectObject);
  const clearSelection = useEditorStoreV2((s) => s.clearSelection);

  // ── Initialize Three.js ─────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
    camera.position.set(800, 600, 800);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.6;
    controls.minDistance = 50;
    controls.maxDistance = 5000;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // Grid
    const grid = new THREE.GridHelper(3000, 30, 0x334155, 0x1e293b);
    grid.position.y = -0.5;
    scene.add(grid);

    // Axes
    const axes = new THREE.AxesHelper(200);
    scene.add(axes);

    // Ground plane for shadows
    const groundGeo = new THREE.PlaneGeometry(3000, 3000);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lighting
    const ambient = new THREE.AmbientLight(0x404060, 0.4);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffeedd, 1.2);
    directional.position.set(500, 800, 400);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    scene.add(directional);

    const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    fill.position.set(-300, 400, -200);
    scene.add(fill);

    const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x362d1a, 0.5);
    scene.add(hemisphere);

    // Render loop
    function animate() {
      controls.update();
      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    }
    animate();
    setIsReady(true);

    // Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // ── Sync objects → meshes ───────────────────────────────────

  useEffect(() => {
    if (!sceneRef.current || !isReady) return;
    const scene = sceneRef.current;
    const meshMap = meshMapRef.current;

    // Remove stale meshes
    const currentIds = new Set(objects.map((o) => o.id));
    for (const [id, mesh] of meshMap) {
      if (!currentIds.has(id)) {
        scene.remove(mesh);
        disposeMesh(mesh);
        meshMap.delete(id);
      }
    }

    // Add / update meshes
    const objectGroup = new THREE.Group();
    for (const obj of objects) {
      if (!obj.visible) continue;

      let mesh = meshMap.get(obj.id);
      if (!mesh) {
        const geometry: GeneratedGeometry = {
          x: obj.x - 0, y: obj.y - 0, width: obj.width, height: obj.height,
          rotation: obj.rotation, fill: obj.fill, stroke: obj.stroke,
          strokeWidth: obj.strokeWidth, opacity: obj.opacity,
          scaleX: obj.scaleX, scaleY: obj.scaleY,
          flipX: obj.flipX, flipY: obj.flipY,
          metadata: obj.metadata || {},
        };
        const depth = (obj as any).thickness || 25;
        const meshData = generateMesh(geometry, depth);
        mesh = buildMesh(meshData, "thermocol", obj.fill);
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, (obj.rotation || 0) * Math.PI / 180);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.objectId = obj.id;
        meshMap.set(obj.id, mesh);
      }
      objectGroup.add(mesh);
    }

    // Remove old object group and add new one
    const oldGroup = scene.getObjectByName("objectGroup");
    if (oldGroup) scene.remove(oldGroup);
    objectGroup.name = "objectGroup";
    scene.add(objectGroup);
  }, [objects, isReady]);

  // ── Selection highlight ─────────────────────────────────────

  useEffect(() => {
    const meshMap = meshMapRef.current;
    // Reset all materials
    for (const [id, mesh] of meshMap) {
      const isSelected = selectedIds.includes(id);
      if (isSelected) {
        (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x1e40af);
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
      } else {
        (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x000000);
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
      }
    }
  }, [selectedIds]);

  // ── Click to select ─────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !cameraRef.current || !sceneRef.current) return;

    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = raycasterRef.current;
    raycaster.setFromCamera(mouseRef.current, cameraRef.current);

    const meshes = Array.from(meshMapRef.current.values());
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hit = intersects[0]!.object as THREE.Mesh;
      const id = hit.userData.objectId as number;
      if (id != null) {
        selectObject(id, e.shiftKey);
        onSelect?.(id);
        return;
      }
    }

    if (!e.shiftKey) {
      clearSelection();
      onSelect?.(null);
    }
  }, [selectObject, clearSelection, onSelect]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      style={{ width: "100%", height: "100%", position: "relative", cursor: "default", touchAction: "none" }}
    >
      {!isReady && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#64748b", fontSize: 14, background: "#0f172a",
        }}>
          Loading 3D...
        </div>
      )}
    </div>
  );
}
