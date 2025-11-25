import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- HELPER FUNCTIONS ---
const smoothstep = (min: number, max: number, value: number) => {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
};

// --- SHARED NOISE (Used in both shaders) ---
const noiseFunctions = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
varying float vElevation;

uniform float uTime;
uniform float uScrollProgress;

${noiseFunctions}

void main() {
  vUv = uv;
  vec3 pos = position;

  // --- Vertex Displacement ---
  // Create organic undulation
  float noiseVal = snoise(uv * 2.0 + uTime * 0.05);
  float detailNoise = snoise(uv * 8.0 - uTime * 0.02) * 0.2;
  
  // Flatten the rock as we transition to digital (wireframe)
  // Transition happens around scroll 0.5 - 0.8
  float digitalTransition = smoothstep(0.5, 0.8, uScrollProgress);
  float amplitude = mix(0.5, 0.1, digitalTransition); 
  
  float elevation = (noiseVal + detailNoise) * amplitude;
  
  // Add a "wave" effect when scrolling
  float scrollWave = sin(uv.y * 5.0 - uScrollProgress * 10.0) * 0.1 * smoothstep(0.0, 0.2, uScrollProgress);
  
  pos.z += elevation + scrollWave;

  vElevation = elevation;
  vPosition = pos;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;
varying float vElevation;

uniform float uTime;
uniform vec2 uResolution;
uniform float uScrollProgress;
uniform vec2 uMouse; // 0 to 1

${noiseFunctions}

void main() {
  vec2 uv = vUv;
  // Aspect correction for patterns
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);

  // --- Colors ---
  vec3 colSienna = vec3(0.545, 0.271, 0.075);
  vec3 colOrange = vec3(0.8, 0.333, 0.0);
  vec3 colClay = vec3(0.627, 0.251, 0.0);
  vec3 colWhite = vec3(0.99, 0.98, 0.97);

  // --- Base Texture ---
  float n1 = snoise(p * 4.0);
  float n2 = snoise(p * 20.0);
  
  // Mix colors based on noise and elevation from vertex shader
  vec3 color = mix(colSienna, colOrange, n1 * 0.5 + 0.5);
  color = mix(color, colClay, smoothstep(-0.2, 0.2, vElevation));

  // Add "Grain"
  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
  color -= grain * 0.05;

  // --- Lighting ---
  // Fake normal based on noise derivative approximation
  float lighting = 0.5 + 0.5 * n1;
  color *= lighting;

  // Mouse Light (Torch effect)
  vec2 mouseUV = uMouse; // Mouse is passed 0..1
  mouseUV.x *= aspect;
  float dist = distance(p, mouseUV);
  float glowRadius = 0.4;
  float mouseGlow = smoothstep(glowRadius, 0.0, dist);
  color += colOrange * mouseGlow * 0.8;

  // --- Scroll Phase 1: Darkness (The Void) ---
  float voidReveal = smoothstep(0.0, 0.15, uScrollProgress + 0.05);
  color *= voidReveal;

  // --- Scroll Phase 3/4: Wireframe / Digital ---
  float wireframeMix = smoothstep(0.6, 0.9, uScrollProgress);
  
  if (wireframeMix > 0.01) {
    // Grid Logic
    float gridSize = 30.0;
    vec2 gridUV = fract(p * gridSize + uTime * 0.1); // Move grid slightly
    float gridLine = step(0.92, gridUV.x) + step(0.92, gridUV.y);
    
    // Topographic contours
    float topo = step(0.9, fract(vElevation * 10.0));
    
    vec3 digitalColor = mix(color * 0.3, colWhite, max(gridLine, topo));
    color = mix(color, digitalColor, wireframeMix);
  }

  // Vignette
  float vignette = smoothstep(1.5, 0.5, distance(uv, vec2(0.5)));
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
`;

// --- FLOATING SYMBOLS COMPONENT ---
// Renders 3D primitive shapes (Rings, Sticks) that float in front of the rock
const FloatingArtifacts = ({ scrollProgress, mouse }: { scrollProgress: number, mouse: THREE.Vector2 }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate random positions for artifacts
  const artifacts = useMemo(() => {
    return new Array(8).fill(0).map((_, i) => ({
      type: i % 2 === 0 ? 'ring' : 'stick',
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 4, // Spread X
        (Math.random() - 0.5) * 3, // Spread Y
        Math.random() * 0.5 + 0.2  // Z depth (in front of plane)
      ),
      rotationSpeed: (Math.random() - 0.5) * 1,
      scale: Math.random() * 0.5 + 0.5
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    
    // Visibility logic: Visible mostly during Section 3 (Shared Learning)
    // Scroll 0.4 to 0.7
    const opacity = smoothstep(0.3, 0.45, scrollProgress) * (1.0 - smoothstep(0.65, 0.8, scrollProgress));
    
    groupRef.current.children.forEach((child, i) => {
      const art = artifacts[i];
      
      // Floating motion
      child.position.y = art.position.y + Math.sin(t * 0.5 + i) * 0.1;
      child.position.x = art.position.x + Math.cos(t * 0.3 + i) * 0.05;
      
      // Rotate
      child.rotation.x += art.rotationSpeed * 0.01;
      child.rotation.y += art.rotationSpeed * 0.02;

      // Mouse reaction (look at mouse slightly)
      const mouseX = (mouse.x) * 2; // -1 to 1 range approx
      const mouseY = (mouse.y) * 2;
      child.rotation.z = (mouseX - child.position.x) * 0.1;

      // Update opacity
      const mat = child.material as THREE.MeshBasicMaterial;
      mat.opacity = opacity;
      mat.transparent = true;
      mat.visible = opacity > 0.01;
    });
  });

  return (
    <group ref={groupRef}>
      {artifacts.map((art, i) => (
        <mesh key={i} position={art.position} scale={art.scale}>
          {art.type === 'ring' ? (
            <torusGeometry args={[0.3, 0.02, 16, 32]} />
          ) : (
            <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
          )}
          <meshBasicMaterial color="#FDFBF7" transparent opacity={0} wireframe={false} />
        </mesh>
      ))}
    </group>
  );
};

const LivingRockBackground = ({ scrollProgress, mouse }: { scrollProgress: number, mouse: THREE.Vector2 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree(); // Get viewport dimensions to fill screen
  
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uScrollProgress: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    }),
    []
  );

  useFrame((state) => {
    const { clock } = state;
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = clock.getElapsedTime();
      material.uniforms.uScrollProgress.value = scrollProgress;
      // Convert Mouse (-1 to 1) to (0 to 1) for Shader UV logic
      material.uniforms.uMouse.value.set(
        (mouse.x + 1) * 0.5,
        (mouse.y + 1) * 0.5
      );
      material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    }
  });

  return (
    <>
      <mesh ref={meshRef} position={[0, 0, -1]}> 
        {/* Dynamic plane size based on viewport to ensure no "square" edges */}
        <planeGeometry args={[viewport.width, viewport.height, 128, 128]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
        />
      </mesh>
      
      {/* Floating 3D Elements */}
      <FloatingArtifacts scrollProgress={scrollProgress} mouse={mouse} />
    </>
  );
};

export default LivingRockBackground;