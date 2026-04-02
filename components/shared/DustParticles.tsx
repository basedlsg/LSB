import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseFunctions } from './CaseStudyUtils';

// Reduced ambient particle field for Notes pages (2,500 vs 8,000 on case studies)
const PARTICLE_COUNT = 2500;

const generatePositions = () => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = i * 3;
    positions[idx] = (Math.random() - 0.5) * 12;
    positions[idx + 1] = (Math.random() - 0.5) * 12;
    positions[idx + 2] = (Math.random() - 0.5) * 4;
  }
  return positions;
};

const dustVertexShader = `
uniform float uTime;
varying float vAlpha;
${noiseFunctions}
void main() {
  vec3 pos = position;
  pos += vec3(
    snoise(pos * 0.15 + uTime * 0.002),
    snoise(pos * 0.15 + uTime * 0.003 + 10.0),
    snoise(pos * 0.15 + uTime * 0.001 + 20.0)
  ) * 0.3;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = (6.0 / -mvPosition.z);
  vAlpha = 0.15 + 0.1 * snoise(pos * 2.0 + uTime * 0.5);
  vAlpha *= smoothstep(-4.0, 1.0, pos.z);
}`;

const dustFragmentShader = `
varying float vAlpha;
void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  float glow = exp(-dist * 6.0);
  if (glow < 0.01) discard;
  vec3 color = vec3(0.23, 0.17, 0.10);
  gl_FragColor = vec4(color, vAlpha * glow);
}`;

const DustParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => generatePositions(), []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((state) => {
    if (pointsRef.current) {
      (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial vertexShader={dustVertexShader} fragmentShader={dustFragmentShader} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

export default DustParticles;
