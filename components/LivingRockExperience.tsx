import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- SHADER CHUNKS ---
// Corrected GLSL with proper function ordering and overloads
const noiseFunctions = `
// 1. Helper functions must be defined before use
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }

vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }

vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

// 2. 2D Simplex Noise
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

// 3. 3D Simplex Noise
float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

  // Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  //Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

// Curl Noise Approximation
vec3 curlNoise(vec3 p) {
  const float e = 0.01;
  float n1 = snoise(p + vec3(e, 0.0, 0.0));
  float n2 = snoise(p - vec3(e, 0.0, 0.0));
  float n3 = snoise(p + vec3(0.0, e, 0.0));
  float n4 = snoise(p - vec3(0.0, e, 0.0));
  float n5 = snoise(p + vec3(0.0, 0.0, e));
  float n6 = snoise(p - vec3(0.0, 0.0, e));

  float x = n3 - n4 - n5 + n6;
  float y = n5 - n6 - n1 + n2;
  float z = n1 - n2 - n3 + n4;

  const float divisor = 1.0 / (2.0 * e);
  return normalize(vec3(x, y, z) * divisor);
}
`;

// --- ROCK SURFACE SHADER ---
const rockVertex = `
varying vec2 vUv;
varying vec3 vPosition;
varying float vNoise;
uniform float uTime;
${noiseFunctions}

void main() {
  vUv = uv;
  vPosition = position;
  // Slow, subtle movement for the rock surface
  vNoise = snoise(uv * 1.5 + uTime * 0.02);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const rockFragment = `
varying vec2 vUv;
varying vec3 vPosition;
varying float vNoise;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uScrollProgress;

${noiseFunctions}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  
  // Palette (Deepened for elegance)
  vec3 cDeep = vec3(0.25, 0.12, 0.05); // Very Dark Brown
  vec3 cOchre = vec3(0.55, 0.27, 0.08); // Rich Ochre
  
  // Noise Layers
  float n1 = snoise(p * 2.0); // Macro shape
  float n2 = snoise(p * 8.0 + n1); // Detail
  float n3 = snoise(p * 32.0); // Grain

  // Base
  vec3 color = mix(cDeep, cOchre, n1 * 0.4 + 0.3);
  
  // Vignette (Focus on center)
  float distFromCenter = length(uv - 0.5);
  float vignette = smoothstep(0.8, 0.2, distFromCenter);
  color *= vignette;

  // Torch Effect (Mouse Light)
  vec2 mouseP = uMouse * vec2(aspect, 1.0);
  float mouseDist = distance(p, mouseP);
  float mouseGlow = smoothstep(0.5, 0.0, mouseDist);
  
  // Add subtle light reveals texture
  vec3 lightColor = vec3(0.8, 0.5, 0.3); // Warm light
  float textureReveal = (n2 * 0.5 + 0.5) * mouseGlow;
  color += lightColor * textureReveal * 0.4;

  // Fade to black at scroll 0 (The Void)
  float voidFade = smoothstep(0.0, 0.1, uScrollProgress);
  color *= (0.2 + 0.8 * voidFade);

  gl_FragColor = vec4(color, 1.0);
}
`;

// --- PARTICLE SYSTEM GENERATOR ---
const PARTICLE_COUNT = 20000;

const generateParticles = (width: number, height: number) => {
  const pos0 = new Float32Array(PARTICLE_COUNT * 3); // Galaxy Spiral (Origin)
  const pos1 = new Float32Array(PARTICLE_COUNT * 3); // Concentric Rings (Tool)
  const pos2 = new Float32Array(PARTICLE_COUNT * 3); // The Beam (Stick)
  const pos3 = new Float32Array(PARTICLE_COUNT * 3); // Flowing Path (Ascent)
  const pos4 = new Float32Array(PARTICLE_COUNT * 3); // Fibonacci Sphere (Future)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = i * 3;
    const r = i / PARTICLE_COUNT; // 0 to 1

    // POS 0: GALAXY SPIRAL (The Dreamtime)
    const spiralAngle = r * Math.PI * 10;
    const spiralRadius = r * 2.0;
    const spiralRandom = (Math.random() - 0.5) * 0.5;
    pos0[idx] = Math.cos(spiralAngle) * spiralRadius + spiralRandom;
    pos0[idx+1] = Math.sin(spiralAngle) * spiralRadius + spiralRandom;
    pos0[idx+2] = (Math.random() - 0.5) * 2.0; // Depth

    // POS 1: CONCENTRIC RINGS (The Tool)
    // Create 7 discrete rings
    const ringIndex = Math.floor(Math.random() * 7);
    const ringRadius = 0.3 + ringIndex * 0.3;
    const ringAngle = Math.random() * Math.PI * 2;
    // Add slight jitter for "chalk" look
    const jitter = (Math.random() - 0.5) * 0.05;
    pos1[idx] = Math.cos(ringAngle) * (ringRadius + jitter);
    pos1[idx+1] = Math.sin(ringAngle) * (ringRadius + jitter);
    pos1[idx+2] = (Math.random() - 0.5) * 0.1;

    // POS 2: THE BEAM (The Stick)
    // A tight vertical shaft of light
    const beamHeight = (Math.random() - 0.5) * 3.5;
    const beamWidth = (Math.random() - 0.5) * 0.08; // Very thin
    const beamDepth = (Math.random() - 0.5) * 0.08;
    // Concentrate particles in the center
    const concentration = Math.pow(Math.random(), 3); 
    pos2[idx] = beamWidth * concentration; // Tapered edges
    pos2[idx+1] = beamHeight;
    pos2[idx+2] = beamDepth;

    // POS 3: FLOWING PATH (Ascent)
    // A sine wave path that recedes into distance
    const pathT = (i / PARTICLE_COUNT) * 6.0 - 3.0; // -3 to 3 Y-axis
    const pathX = Math.sin(pathT * 1.5) * 0.5;
    const pathWidth = 0.2 + Math.abs(pathT) * 0.1; // Gets wider
    const pathRandomX = (Math.random() - 0.5) * pathWidth;
    
    pos3[idx] = (pathX + pathRandomX) * 1.5;
    pos3[idx+1] = pathT; // Vertical flow
    pos3[idx+2] = Math.random() * 0.5;

    // POS 4: FIBONACCI SPHERE (The Future)
    // Perfect distribution
    const phi = Math.acos(1 - 2 * (i + 0.5) / PARTICLE_COUNT);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    const sphereR = 1.2;
    
    pos4[idx] = sphereR * Math.cos(theta) * Math.sin(phi);
    pos4[idx+1] = sphereR * Math.sin(theta) * Math.sin(phi);
    pos4[idx+2] = sphereR * Math.cos(phi);
  }

  return { pos0, pos1, pos2, pos3, pos4 };
};

// --- PARTICLE SHADER (High Fidelity) ---
const particleVertex = `
attribute vec3 pos0;
attribute vec3 pos1;
attribute vec3 pos2;
attribute vec3 pos3;
attribute vec3 pos4;

uniform float uTime;
uniform float uScrollProgress; // 0.0 to 1.0
uniform vec2 uMouse; // -1 to 1
uniform vec2 uResolution;

varying float vAlpha;
varying float vSize;

${noiseFunctions}

void main() {
  float totalStates = 4.0; 
  float progress = uScrollProgress * totalStates;
  float stateIdx = floor(progress);
  float t = fract(progress);
  
  // Ease the transition time
  // Quintic ease for very snappy start/end and slow middle
  float easeT = t < 0.5 ? 16.0 * t * t * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 5.0) / 2.0;

  vec3 currentPos;
  vec3 nextPos;

  if (stateIdx < 0.5) {
     currentPos = pos0; nextPos = pos1;
  } else if (stateIdx < 1.5) {
     currentPos = pos1; nextPos = pos2;
  } else if (stateIdx < 2.5) {
     currentPos = pos2; nextPos = pos3;
  } else {
     currentPos = pos3; nextPos = pos4;
  }

  // --- FLUID TRANSITION ---
  // Instead of linear mix, we use curl noise to displace particles during the transition
  // Transition activity peaks at t=0.5
  float activity = sin(t * 3.14159);
  
  // Calculate the linear path
  vec3 mixPos = mix(currentPos, nextPos, easeT);
  
  // Add curl noise turbulence during transition
  vec3 turbulence = curlNoise(mixPos * 0.5 + uTime * 0.1) * activity * 2.0;
  
  vec3 finalPos = mixPos + turbulence;

  // --- SUBTLE LIFE (Drift) ---
  // Slow breathing motion - creates gentle ambient movement
  vec3 drift = vec3(
    snoise(finalPos * 0.5 + uTime * 0.15),
    snoise(finalPos * 0.5 + uTime * 0.18 + 10.0),
    snoise(finalPos * 0.5 + uTime * 0.12 + 20.0)
  ) * 0.12;
  finalPos += drift;

  // --- MOUSE INTERACTION ---
  float aspect = uResolution.x / uResolution.y;
  vec3 mouseWorld = vec3(uMouse.x * aspect * 5.0, uMouse.y * 5.0, 0.0);
  float dist = distance(finalPos.xy, mouseWorld.xy);
  float radius = 1.2;
  
  if (dist < radius) {
    vec3 dir = normalize(finalPos - mouseWorld);
    float force = (1.0 - dist / radius);
    force = pow(force, 2.0) * 1.5; // Sharp falloff
    finalPos += dir * force;
  }

  vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size Attenuation
  gl_PointSize = (20.0 / -mvPosition.z);
  vSize = gl_PointSize;

  // Alpha / Fade logic
  // Particles are consistent but sparkle
  float sparkle = snoise(finalPos * 10.0 + uTime * 2.0);
  vAlpha = 0.6 + 0.4 * sparkle;
  
  // Fade out slightly when deep in Z
  vAlpha *= smoothstep(-5.0, 2.0, finalPos.z);
}
`;

const particleFragment = `
varying float vAlpha;
varying float vSize;

void main() {
  // Gaussian soft dot
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  
  // Soft glow falloff
  float glow = exp(-dist * 4.0); // Sharp center, soft edge
  
  if (glow < 0.01) discard;

  // Bone white with warmth
  vec3 color = vec3(1.0, 0.98, 0.95);
  
  gl_FragColor = vec4(color, vAlpha * glow);
}
`;

const LivingRockExperience = ({ scrollProgress, mouseRef }: { scrollProgress: number, mouseRef: React.RefObject<THREE.Vector2 | null> }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const rockRef = useRef<THREE.Mesh>(null);
  const { viewport, size } = useThree();

  const particles = useMemo(() => generateParticles(viewport.width, viewport.height), [viewport]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScrollProgress: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) }
  }), [size]);

  useFrame((state) => {
    const { clock } = state;
    const t = clock.getElapsedTime();
    const mouse = mouseRef.current;

    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uScrollProgress.value = scrollProgress;
      if (mouse) {
        mat.uniforms.uMouse.value.copy(mouse);
      }
    }
    if (rockRef.current) {
      const mat = rockRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uScrollProgress.value = scrollProgress;
      if (mouse) {
        mat.uniforms.uMouse.value.copy(mouse);
      }
    }
  });

  const bgScale: [number, number, number] = [viewport.width * 2.5, viewport.height * 2.5, 1];

  return (
    <>
      <mesh ref={rockRef} position={[0, 0, -3]} scale={bgScale}>
        <planeGeometry args={[1, 1, 128, 128]} />
        <shaderMaterial
          vertexShader={rockVertex}
          fragmentShader={rockFragment}
          uniforms={uniforms}
        />
      </mesh>

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={particles.pos0} itemSize={3} />
          <bufferAttribute attach="attributes-pos0" count={PARTICLE_COUNT} array={particles.pos0} itemSize={3} />
          <bufferAttribute attach="attributes-pos1" count={PARTICLE_COUNT} array={particles.pos1} itemSize={3} />
          <bufferAttribute attach="attributes-pos2" count={PARTICLE_COUNT} array={particles.pos2} itemSize={3} />
          <bufferAttribute attach="attributes-pos3" count={PARTICLE_COUNT} array={particles.pos3} itemSize={3} />
          <bufferAttribute attach="attributes-pos4" count={PARTICLE_COUNT} array={particles.pos4} itemSize={3} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={particleVertex}
          fragmentShader={particleFragment}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};

export default LivingRockExperience;