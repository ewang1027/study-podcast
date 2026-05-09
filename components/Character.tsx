"use client";

import { useRef, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import type { AppState } from "@/app/page";

interface CharacterProps {
  appState: AppState;
  analyser: AnalyserNode | null;
}

function ProceduralCharacter({ appState, analyser }: CharacterProps) {
  const charGroupRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Mesh>(null!);
  const armGroupRef = useRef<THREE.Group>(null!);
  const eyeLeftRef = useRef<THREE.Mesh>(null!);
  const eyeRightRef = useRef<THREE.Mesh>(null!);
  const micHeadRef = useRef<THREE.Mesh>(null!);
  const freqData = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Read audio amplitude if analyser provided
    let amplitude = 0;
    if (analyser) {
      if (!freqData.current || freqData.current.length !== analyser.frequencyBinCount) {
        freqData.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      }
      analyser.getByteFrequencyData(freqData.current);
      const sum = freqData.current.reduce((a, b) => a + b, 0);
      amplitude = sum / (freqData.current.length * 255);
    }

    if (appState === "idle") {
      charGroupRef.current.position.y = Math.sin(t * 0.8) * 0.05;
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.2;
      armGroupRef.current.rotation.z = -0.3;
    } else if (appState === "uploading" || appState === "generating" || appState === "synthesizing") {
      charGroupRef.current.position.y = Math.sin(t * 2.5) * 0.08;
      headRef.current.rotation.y = Math.sin(t * 1.2) * 0.3;
      armGroupRef.current.rotation.z = -0.3 + Math.sin(t * 2) * 0.2 - 0.3;
    } else if (appState === "ready") {
      const audioScale = amplitude * 0.4;
      charGroupRef.current.position.y = Math.sin(t * 3) * (0.06 + audioScale);
      headRef.current.rotation.y = Math.sin(t * 1.8) * 0.25;
      armGroupRef.current.rotation.z = -0.6 - audioScale * 0.5;

      const emissiveIntensity = 0.6 + amplitude * 2;
      (eyeLeftRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = emissiveIntensity;
      (eyeRightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = emissiveIntensity;
      (micHeadRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + amplitude * 3;
    }
  });

  return (
    <group ref={charGroupRef}>
      {/* Body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.28, 0.35, 0.9, 16]} />
        <meshStandardMaterial color="#4a90d9" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color="#f4c98a" roughness={0.6} />
      </mesh>

      {/* Eyes */}
      <mesh ref={eyeLeftRef} position={[-0.1, 0.83, 0.28]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial color="#ffee44" emissive="#ffee44" emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={eyeRightRef} position={[0.1, 0.83, 0.28]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial color="#ffee44" emissive="#ffee44" emissiveIntensity={0.6} />
      </mesh>

      {/* Arm + mic group */}
      <group ref={armGroupRef} position={[0.3, 0.2, 0]} rotation={[0, 0, -0.3]}>
        {/* Upper arm */}
        <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.38, 10]} />
          <meshStandardMaterial color="#4a90d9" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Mic stand */}
        <mesh position={[0.38, 0.22, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.44, 8]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Mic head */}
        <mesh ref={micHeadRef} position={[0.46, 0.46, 0]}>
          <sphereGeometry args={[0.095, 16, 16]} />
          <meshStandardMaterial
            color="#3377ff"
            emissive="#3377ff"
            emissiveIntensity={0.5}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function Character({ appState, analyser }: CharacterProps) {
  return (
    <Float speed={1.5} floatIntensity={0.4} rotationIntensity={0.1}>
      <Suspense fallback={null}>
        <ProceduralCharacter appState={appState} analyser={analyser} />
      </Suspense>
    </Float>
  );
}
