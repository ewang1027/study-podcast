"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";
import Character from "./Character";
import SoundRings from "./SoundRings";
import type { AppState } from "@/app/page";

interface SceneProps {
  appState: AppState;
  analyser: AnalyserNode | null;
}

// Orbiting point lights
function OrbitLights() {
  const warmRef = useRef<THREE.PointLight>(null!);
  const coolRef = useRef<THREE.PointLight>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    warmRef.current.position.set(Math.sin(t * 0.4) * 4, 3, Math.cos(t * 0.4) * 4);
    coolRef.current.position.set(Math.sin(t * 0.4 + Math.PI) * 4, 2, Math.cos(t * 0.4 + Math.PI) * 4);
  });

  return (
    <>
      <pointLight ref={warmRef} color="#ffcc66" intensity={30} distance={12} />
      <pointLight ref={coolRef} color="#6699ff" intensity={25} distance={12} />
    </>
  );
}

// Floating particles
function Particles() {
  const count = 80;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const positions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      arr.push([
        (Math.random() - 0.5) * 14,
        Math.random() * 8,
        (Math.random() - 0.5) * 14,
      ]);
    }
    return arr;
  }, []);

  const phases = useMemo(() => positions.map(() => Math.random() * Math.PI * 2), [positions]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    positions.forEach(([x, y, z], i) => {
      dummy.position.set(x, y + Math.sin(t * 0.5 + phases[i]) * 0.3, z);
      dummy.scale.setScalar(0.04 + Math.sin(t + phases[i]) * 0.01);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#88aaff" transparent opacity={0.35} />
    </instancedMesh>
  );
}

// Camera parallax controller
function CameraParallax({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const { camera } = useThree();
  const base = useMemo(() => new THREE.Vector3(0, 1.5, 6), []);

  useFrame(() => {
    camera.position.x += (base.x + mouse.current.x * 0.8 - camera.position.x) * 0.05;
    camera.position.y += (base.y + mouse.current.y * 0.4 - camera.position.y) * 0.05;
    camera.lookAt(0, 0.5, 0);
  });

  return null;
}

function SceneContents({ appState, analyser, mouse }: SceneProps & { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  return (
    <>
      <fog attach="fog" args={["#0a0a1a", 0.04] as unknown as [string, number]} />
      <hemisphereLight args={["#334466", "#111122", 0.6]} />
      <OrbitLights />
      <CameraParallax mouse={mouse} />
      <Particles />

      {/* Platform */}
      <mesh position={[0, -0.55, 0]} receiveShadow>
        <cylinderGeometry args={[1.1, 1.1, 0.08, 48]} />
        <meshStandardMaterial color="#1a2244" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Platform rim */}
      <mesh position={[0, -0.51, 0]}>
        <torusGeometry args={[1.1, 0.025, 8, 64]} />
        <meshStandardMaterial color="#4466cc" emissive="#2244aa" emissiveIntensity={0.8} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Floor grid */}
      <Grid
        position={[0, -0.6, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#223366"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#334488"
        fadeDistance={14}
        fadeStrength={1}
        infiniteGrid
      />

      <group position={[0, -0.5, 0]}>
        <Character appState={appState} analyser={analyser} />
        <SoundRings analyser={analyser} />
      </group>
    </>
  );
}

export default function Scene({ appState, analyser }: SceneProps) {
  const mouse = useRef({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    mouse.current = {
      x: (e.clientX / window.innerWidth - 0.5) * 2,
      y: -(e.clientY / window.innerHeight - 0.5) * 2,
    };
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "#0a0a1a" }}
      onMouseMove={handleMouseMove}
    >
      <Canvas
        camera={{ position: [0, 1.5, 6], fov: 55 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        <SceneContents appState={appState} analyser={analyser} mouse={mouse} />
      </Canvas>
    </div>
  );
}
