"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import type { Design } from "@/lib/dock/types";
import { fromKey, CUBE_SIZE_MM, CUBE_HEIGHT_MM } from "@/lib/dock/types";
import { getBounds } from "@/lib/dock/design";

type Props = { design: Design; active?: boolean };

// Work in metres for camera-friendliness (1 grid cell = 0.5 m).
const CELL = CUBE_SIZE_MM / 1000;
const CUBE_HEIGHT = CUBE_HEIGHT_MM / 1000;

function ActiveSync({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
  return null;
}

function InstancedCubes({ design }: { design: Design }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  const geometry = useMemo(
    () => new THREE.BoxGeometry(CELL, CUBE_HEIGHT, CELL),
    [],
  );
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#94a3b8",
        roughness: 0.7,
        metalness: 0.05,
      }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    design.cubes.forEach((key, i) => {
      const { x, y } = fromKey(key);
      dummy.position.set(
        x * CELL + CELL / 2,
        CUBE_HEIGHT / 2,
        y * CELL + CELL / 2,
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.count = design.cubes.length;
    mesh.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [design.cubes, invalidate]);

  // Guard against zero-count meshes throwing during initial render.
  const capacity = Math.max(design.cubes.length, 1);
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, capacity]}
      castShadow
      receiveShadow
    />
  );
}

export function Dock3DView({ design, active = true }: Props) {
  const bounds = getBounds(design);
  const centre = useMemo(() => {
    if (!bounds) return new THREE.Vector3(0, 0, 0);
    return new THREE.Vector3(
      ((bounds.minX + bounds.maxX + 1) / 2) * CELL,
      0,
      ((bounds.minY + bounds.maxY + 1) / 2) * CELL,
    );
  }, [bounds]);

  const cameraDistance = useMemo(() => {
    if (!bounds) return 8;
    const span = Math.max(bounds.width, bounds.height) * CELL;
    return Math.max(6, span * 1.6);
  }, [bounds]);

  return (
    <div className="h-full w-full bg-sky-50">
      <Canvas
        shadows
        frameloop={active ? "demand" : "never"}
        camera={{
          position: [
            centre.x + cameraDistance * 0.7,
            cameraDistance * 0.9,
            centre.z + cameraDistance * 0.7,
          ],
          fov: 45,
          near: 0.1,
          far: 500,
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 15, 5]}
          intensity={0.9}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Grid
          args={[40, 40]}
          cellSize={CELL}
          sectionSize={CELL * 4}
          cellColor="#cbd5e1"
          sectionColor="#94a3b8"
          fadeDistance={40}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
          position={[0, 0, 0]}
        />

        {design.cubes.length > 0 && <InstancedCubes design={design} />}
        <ActiveSync active={active} />

        <OrbitControls
          makeDefault
          target={[centre.x, 0, centre.z]}
          enableDamping
          dampingFactor={0.1}
          minDistance={2}
          maxDistance={200}
        />
      </Canvas>
    </div>
  );
}
