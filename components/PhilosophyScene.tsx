/// <reference types="@react-three/fiber" />
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseFunctions } from './shared/CaseStudyUtils';
import { generatePhilosophyPositions, generatePhilosophyAmbientParticles } from './shared/PhilosophyUtils';

const particleVertexShader = `
attribute vec3 aVelocity;
attribute vec3 aColor;
attribute vec3 aTarget;
uniform float uTime;
uniform float uProgress;
uniform float uTransition;
uniform float uFlash;
uniform float uChapter;
uniform vec2 uMouse;
varying vec3 vColor;
varying float vAlpha;
varying float vFlash;
${noiseFunctions}
void main() {
  vec3 pos = position;
  pos = mix(pos, aTarget, uTransition);
  float breathe = sin(uTime * 0.5 + pos.x * 0.5 + pos.y * 0.5) * 0.012;
  pos += aVelocity * breathe;
  vec3 flow = curlNoise(pos * 0.28 + vec3(uTime * 0.08, uTime * 0.06, -uTime * 0.05));
  pos += flow * (0.022 + uProgress * 0.045);
  float isStrike = step(1.5, uChapter) * (1.0 - step(2.5, uChapter));
  pos += normalize(vec3(pos.xy * 0.5, 0.2) + vec3(0.0001)) * uFlash * isStrike * 0.22;
  vec2 mouseWorld = uMouse * 2.2;
  float mouseDist = length(pos.xy - mouseWorld);
  if (mouseDist < 0.9) {
    vec2 away = normalize(pos.xy - mouseWorld);
    float force = (1.0 - mouseDist) * 0.035;
    pos.xy += away * force;
  }
  float rotSpeed = 0.02;
  float cosR = cos(uTime * rotSpeed);
  float sinR = sin(uTime * rotSpeed);
  pos.xz = mat2(cosR, -sinR, sinR, cosR) * pos.xz;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float sizeNoise = snoise(pos * 0.5 + uTime * 0.2) * 0.5 + 0.5;
  float baseSize = 6.2 + sizeNoise * 4.2;
  float depthScale = clamp(4.2 / max(1.2, -mvPosition.z), 0.28, 1.6);
  gl_PointSize = max(1.8, baseSize * depthScale);
  float chapterPulse = sin(uTime * 0.45 + uChapter) * 0.5 + 0.5;
  vColor = aColor * (1.0 + sizeNoise * 0.16 + chapterPulse * 0.08);
  vAlpha = 0.35 + sizeNoise * 0.2;
  vAlpha *= smoothstep(-10.0, 1.0, pos.z);
  vFlash = uFlash;
}
`;

const particleFragmentShader = `
varying vec3 vColor;
varying float vAlpha;
varying float vFlash;
void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  float core = exp(-dist * 12.0);
  float glow = exp(-dist * 3.5);
  float combined = core * 0.95 + glow * 0.55;
  if (combined < 0.006) discard;
  vec3 flashTint = vec3(1.0, 0.94, 0.8) * vFlash * 0.16;
  vec3 finalColor = vColor * (1.02 + core * 0.32) + flashTint;
  gl_FragColor = vec4(finalColor, vAlpha * combined);
}
`;

const ambientParticleVertexShader = `
attribute vec3 aColor;
attribute float aScale;
uniform float uTime;
uniform float uChapter;
uniform vec2 uMouse;
varying vec3 vColor;
varying float vAlpha;
${noiseFunctions}
void main() {
  vec3 pos = position;
  float zFlow = fract((pos.z + uTime * 0.8) / 15.0);
  pos.z = -8.0 + zFlow * 15.0;
  vec3 drift = curlNoise(pos * 0.1 + vec3(uTime * 0.02, -uTime * 0.015, uTime * 0.03)) * 0.04;
  pos += drift;
  pos.xy += uMouse * 0.12 * (0.3 + zFlow * 0.7);
  float twinkle = sin(uTime * (0.8 + aScale * 0.6) + pos.x * 1.9 + pos.y * 1.6 + pos.z * 0.7) * 0.5 + 0.5;
  float chapterPulse = sin(uTime * 0.35 + uChapter * 1.2) * 0.5 + 0.5;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float depthScale = clamp(3.2 / max(1.2, -mvPosition.z), 0.22, 1.1);
  gl_PointSize = max(1.2, (1.0 + twinkle * 1.5 + chapterPulse * 0.35) * aScale * depthScale);
  vColor = aColor * (0.88 + twinkle * 0.32);
  vAlpha = (0.14 + twinkle * 0.2) * (0.7 + chapterPulse * 0.16);
}
`;

const ambientParticleFragmentShader = `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  float core = exp(-dist * 12.0);
  float halo = exp(-dist * 3.2);
  float alpha = (core * 0.95 + halo * 0.45) * vAlpha;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor, alpha);
}
`;

const ambientVeilFragmentShader = `
uniform float uTime;
uniform float uChapter;
uniform float uProgress;
uniform float uFlash;
uniform vec2 uMouse;
varying vec2 vUv;
${noiseFunctions}
void main() {
  vec2 uv = vUv;
  vec2 centered = uv - 0.5;
  centered.x *= 1.35;
  float dist = length(centered);
  vec3 baseA; vec3 baseB; vec3 accent;
  if (uChapter < 0.5) {
    baseA = vec3(0.02, 0.01, 0.06); baseB = vec3(0.08, 0.03, 0.16); accent = vec3(0.95, 0.78, 0.46);
  } else if (uChapter < 1.5) {
    baseA = vec3(0.08, 0.03, 0.02); baseB = vec3(0.24, 0.10, 0.04); accent = vec3(1.0, 0.62, 0.26);
  } else if (uChapter < 2.5) {
    baseA = vec3(0.03, 0.02, 0.02); baseB = vec3(0.16, 0.06, 0.03); accent = vec3(1.0, 0.9, 0.78);
  } else if (uChapter < 3.5) {
    baseA = vec3(0.02, 0.06, 0.11); baseB = vec3(0.06, 0.14, 0.23); accent = vec3(0.9, 0.78, 0.48);
  } else {
    baseA = vec3(0.05, 0.02, 0.03); baseB = vec3(0.11, 0.05, 0.08); accent = vec3(0.98, 0.82, 0.52);
  }
  float t = uTime * 0.08;
  float flowA = snoise(vec3(uv * 2.4 + vec2(t, -t * 0.6), t * 0.8));
  float flowB = snoise(vec3((uv - 0.5) * 4.2 + flowA * 0.3, -t * 1.2));
  float flowC = snoise(vec3(uv * 9.0 + flowB * 0.2, t * 1.7));
  vec3 veil = mix(baseA, baseB, flowA * 0.5 + 0.5);
  veil = mix(veil, accent, max(0.0, flowB) * 0.28);
  float halo = exp(-dist * 3.0);
  veil += accent * halo * 0.11 * uProgress;
  vec2 mouseUV = uMouse * 0.5 + 0.5;
  float mouseGlow = exp(-length(uv - mouseUV) * 5.0);
  veil += accent * mouseGlow * 0.08;
  float grain = snoise(vec3(uv * 140.0, uTime * 0.2));
  veil += grain * 0.015;
  float veilAlpha = 0.018 + smoothstep(0.25, 0.95, flowC * 0.5 + 0.5) * 0.05;
  float isStrike = step(1.5, uChapter) * (1.0 - step(2.5, uChapter));
  float boltX = 0.5 + sin(uv.y * 38.0 + uTime * 8.0) * 0.05;
  float bolt = exp(-abs(uv.x - boltX) * 120.0) * smoothstep(0.95, 0.08, uv.y);
  float branch = exp(-abs(uv.x - (boltX + sin(uv.y * 62.0 + uTime * 1.5) * 0.11)) * 95.0) *
    smoothstep(0.8, 0.2, uv.y) * smoothstep(0.16, 0.44, uv.y);
  float lightning = (bolt + branch * 0.62) * isStrike * (0.1 + uFlash * 0.7);
  veil += vec3(0.95, 0.9, 1.0) * lightning * 0.5;
  veilAlpha += lightning * 0.08;
  gl_FragColor = vec4(veil, veilAlpha);
}
`;

interface PhilosophySceneProps {
  chapter: number;
  progress: number;
  transition: number;
  mouse: { x: number; y: number };
  flash: number;
}

export const PhilosophyScene = ({ chapter, progress, transition, mouse, flash }: PhilosophySceneProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const ambientPointsRef = useRef<THREE.Points>(null);
  const veilRef = useRef<THREE.Mesh>(null);

  const formations = useMemo(() => generatePhilosophyPositions(), []);
  const ambient = useMemo(() => generatePhilosophyAmbientParticles(), []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uTransition: { value: 0 },
    uFlash: { value: 0 },
    uChapter: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) }
  }), []);

  // Use local arrays to prevent mutation of the global formations data and handle transitions
  const currentArray = useMemo(() => new Float32Array(formations[0].pos.length), [formations]);
  const targetArray = useMemo(() => new Float32Array(formations[0].pos.length), [formations]);
  const colorArray = useMemo(() => new Float32Array(formations[0].colors.length), [formations]);
  const velArray = useMemo(() => new Float32Array(formations[0].vel.length), [formations]);

  const prevChapter = useRef(chapter);

  useEffect(() => {
    if (pointsRef.current) {
      const { geometry } = pointsRef.current;
      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      const targetAttr = geometry.getAttribute('aTarget') as THREE.BufferAttribute;
      const colorAttr = geometry.getAttribute('aColor') as THREE.BufferAttribute;
      const velocityAttr = geometry.getAttribute('aVelocity') as THREE.BufferAttribute;

      const currentFormation = formations[prevChapter.current];
      const nextFormation = formations[chapter];

      // Current position becomes what was the previous target (or initial)
      currentArray.set(currentFormation.pos);
      // New target
      targetArray.set(nextFormation.pos);
      
      colorArray.set(nextFormation.colors);
      velArray.set(nextFormation.vel);

      posAttr.needsUpdate = true;
      targetAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      velocityAttr.needsUpdate = true;
      
      prevChapter.current = chapter;
    }
  }, [chapter, formations, currentArray, targetArray, colorArray, velArray]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    uniforms.uTime.value = time;
    uniforms.uProgress.value = progress;
    uniforms.uTransition.value = transition;
    uniforms.uFlash.value = flash;
    uniforms.uChapter.value = chapter;
    uniforms.uMouse.value.set(mouse.x, mouse.y);
  });

  return (
    <>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={currentArray.length / 3} array={currentArray} itemSize={3} />
          <bufferAttribute attach="attributes-aTarget" count={targetArray.length / 3} array={targetArray} itemSize={3} />
          <bufferAttribute attach="attributes-aColor" count={colorArray.length / 3} array={colorArray} itemSize={3} />
          <bufferAttribute attach="attributes-aVelocity" count={velArray.length / 3} array={velArray} itemSize={3} />
        </bufferGeometry>
        <shaderMaterial vertexShader={particleVertexShader} fragmentShader={particleFragmentShader} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <points ref={ambientPointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={ambient.pos.length / 3} array={ambient.pos} itemSize={3} />
          <bufferAttribute attach="attributes-aColor" count={ambient.colors.length / 3} array={ambient.colors} itemSize={3} />
          <bufferAttribute attach="attributes-aScale" count={ambient.scales.length} array={ambient.scales} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial vertexShader={ambientParticleVertexShader} fragmentShader={ambientParticleFragmentShader} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <mesh ref={veilRef} position={[0, 0, -2]}>
        <planeGeometry args={[20, 12]} />
        <shaderMaterial vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`} fragmentShader={ambientVeilFragmentShader} uniforms={uniforms} transparent />
      </mesh>
    </>
  );
};
