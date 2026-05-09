"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SoundRingsProps {
  analyser: AnalyserNode | null;
}

const RING_COUNT = 5;

export default function SoundRings({ analyser }: SoundRingsProps) {
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const freqData = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    let amplitude = 0;
    if (analyser) {
      if (!freqData.current || freqData.current.length !== analyser.frequencyBinCount) {
        freqData.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      }
      analyser.getByteFrequencyData(freqData.current);
      const sum = freqData.current.reduce((a, b) => a + b, 0);
      amplitude = sum / (freqData.current.length * 255);
    }

    ringRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = (i / RING_COUNT) * Math.PI * 2;
      const idlePulse = 0.05 * Math.sin(t * 1.2 + phase);

      let scale: number;
      let opacity: number;

      if (analyser && amplitude > 0.01) {
        const ripple = Math.sin(t * 8 - i * 1.2) * amplitude;
        scale = 1 + ripple * 0.6 + idlePulse;
        opacity = 0.15 + amplitude * 0.6 - i * 0.04;
      } else {
        scale = 1 + idlePulse;
        opacity = 0.08 + idlePulse * 0.3;
      }

      mesh.scale.setScalar(Math.max(0.1, scale));
      (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, Math.min(1, opacity));
    });
  });

  return (
    <group position={[0.76, 1.35, 0]}>
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => { ringRefs.current[i] = el; }}
        >
          <torusGeometry args={[0.18 + i * 0.12, 0.012, 8, 48]} />
          <meshBasicMaterial
            color="#3377ff"
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
