import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- SHADER CHUNKS ---
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
uniform vec2 uViewport;
uniform float uScrollProgress;

${noiseFunctions}

void main() {
  vec2 uv = vUv;
  float aspect = uViewport.x / uViewport.y;
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
  // Convert mouse (0 to 1) to shader space
  // We need to approximate mouse position on the plane UVs
  vec2 mouseUV = (uMouse + 1.0) * 0.5;
  vec2 mouseP = vec2(mouseUV.x * aspect, mouseUV.y);
  
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
    // Create 7 discrete rings with subtle organic feel
    const ringIndex = Math.floor(Math.random() * 7);
    const ringRadius = 0.3 + ringIndex * 0.3;
    const ringAngle = Math.random() * Math.PI * 2;
    // Subtle jitter for organic look (not too much)
    const jitter = (Math.random() - 0.5) * 0.02;
    pos1[idx] = Math.cos(ringAngle) * (ringRadius + jitter);
    pos1[idx+1] = Math.sin(ringAngle) * (ringRadius + jitter);
    pos1[idx+2] = (Math.random() - 0.5) * 0.05; // Very slight Z variation

    // POS 2: THE BEAM (The Stick)
    // A vertical stick with slight curve at top
    const beamY = (Math.random() - 0.5) * 3.5;
    const normalizedY = (beamY + 1.75) / 3.5; // 0 to 1, bottom to top
    const topCurve = normalizedY > 0.85 ? Math.sin((normalizedY - 0.85) * 10) * 0.15 : 0;
    const beamWidth = (Math.random() - 0.5) * 0.06;
    const beamDepth = (Math.random() - 0.5) * 0.06;
    pos2[idx] = beamWidth + topCurve;
    pos2[idx+1] = beamY;
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
uniform vec2 uViewport; // Viewport dimensions

varying float vAlpha;
varying float vSize;

${noiseFunctions}

vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, -s, s, c);
	return m * v;
}

void main() {
  float totalStates = 4.0;
  float progress = uScrollProgress * totalStates;

  // Clamp to prevent issues at scrollProgress = 1.0
  float stateIdx = min(floor(progress), 3.0);
  float t = fract(progress);

  // At the very end (scrollProgress = 1.0), show final state fully
  if (uScrollProgress >= 0.999) {
    stateIdx = 3.0;
    t = 1.0;
  }

  // Smoother easing - cubic ease in-out for natural feel
  float easeT = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;

  vec3 currentPos;
  vec3 nextPos;

  // Order: pos0 (Galaxy) -> pos2 (Beam) -> pos3 (Flow) -> pos1 (Rings) -> pos4 (Sphere)
  if (stateIdx < 0.5) {
     currentPos = pos0; nextPos = pos2;  // Galaxy -> Beam
  } else if (stateIdx < 1.5) {
     currentPos = pos2; nextPos = pos3;  // Beam -> Flowing Path
  } else if (stateIdx < 2.5) {
     currentPos = pos3; nextPos = pos1;  // Flowing Path -> Rings
  } else {
     currentPos = pos1; nextPos = pos4;  // Rings -> Sphere
  }

  // --- FLUID TRANSITION ---
  vec3 mixPos = mix(currentPos, nextPos, easeT);

  // Transition Turbulence - gentler, with base movement
  float activity = sin(t * 3.14159);
  vec3 turbulence = curlNoise(mixPos * 0.5 + uTime * 0.08) * activity * 0.8;

  vec3 finalPos = mixPos + turbulence;

  // --- CONSTANT BASE MOTION ---
  // Always have some rotation so nothing ever freezes
  float baseRotation = 0.02;

  // --- STATE-SPECIFIC MOTION ---
  // Apply rotation based on state
  float rotationAmount = baseRotation;
  if (stateIdx < 0.5) {
    rotationAmount = 0.06; // Galaxy rotates
  } else if (stateIdx < 1.5) {
    rotationAmount = 0.035; // Stick rotates slowly
  } else if (stateIdx < 2.5) {
    rotationAmount = 0.025; // Flow has subtle rotation
  } else {
    // Rings rotate, sphere has gentle rotation
    rotationAmount = mix(0.04, 0.025, easeT);
  }
  finalPos.xy = rotate(finalPos.xy, uTime * rotationAmount);

  // --- SUBTLE LIFE (Drift) ---
  // Always have base drift so particles keep moving
  float baseDrift = 0.02;
  float driftStrength = baseDrift;
  if (stateIdx < 0.5) {
    driftStrength = 0.05; // Galaxy has more drift
  } else if (stateIdx < 1.5) {
    driftStrength = 0.02; // Stick has minimal drift
  } else if (stateIdx < 2.5) {
    driftStrength = 0.035; // Flow has medium drift
  } else {
    // Rings and sphere both have visible drift
    driftStrength = mix(0.03, 0.025, easeT);
  }
  vec3 drift = vec3(
    snoise(finalPos * 0.5 + uTime * 0.12),
    snoise(finalPos * 0.5 + uTime * 0.14 + 10.0),
    snoise(finalPos * 0.5 + uTime * 0.1 + 20.0)
  ) * driftStrength;
  finalPos += drift;

  // --- MOUSE INTERACTION ---
  // Correctly map mouse to world space for interaction
  vec3 mouseWorld = vec3(uMouse.x * uViewport.x * 0.5, uMouse.y * uViewport.y * 0.5, 0.0);
  
  float dist = distance(finalPos.xy, mouseWorld.xy);
  float radius = 0.15; // TIGHT radius for "small" cursor
  
  if (dist < radius) {
    vec3 dir = normalize(finalPos - mouseWorld);
    float force = (1.0 - dist / radius);
    force = pow(force, 2.0) * 0.8; 
    finalPos += dir * force;
  }

  vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size Attenuation
  gl_PointSize = (20.0 / -mvPosition.z);
  vSize = gl_PointSize;

  // Alpha / Fade logic
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

// --- CURSOR PARTICLE RING ---
const CursorParticles = ({ mouse }: { mouse: THREE.Vector2 }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();

  const { positions, angles } = useMemo(() => {
    const count = 48; // Number of particles in the ring
    const pos = new Float32Array(count * 3);
    const ang = new Float32Array(count);
    for(let i=0; i<count; i++) {
        const a = (i/count) * Math.PI * 2;
        pos[i*3] = Math.cos(a) * 0.15; // Base radius matching interaction
        pos[i*3+1] = Math.sin(a) * 0.15;
        pos[i*3+2] = 0;
        ang[i] = a;
    }
    return { positions: pos, angles: ang };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state) => {
    if(pointsRef.current) {
        // Map NDC (-1 to 1) to World Plane
        const x = (mouse.x * viewport.width) / 2;
        const y = (mouse.y * viewport.height) / 2;
        
        // Lerp for smooth movement
        const lerpFactor = 0.15;
        pointsRef.current.position.x += (x - pointsRef.current.position.x) * lerpFactor;
        pointsRef.current.position.y += (y - pointsRef.current.position.y) * lerpFactor;
        
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const vertexShader = `
    attribute float angle;
    uniform float uTime;
    varying float vAlpha;
    ${noiseFunctions}

    void main() {
      // Dynamic Ring
      float rBase = 1.0; // Scaled by position
      float theta = angle + uTime * 0.5;
      
      // Turbulent radius
      float noise = snoise(vec2(cos(theta), sin(theta)) + uTime);
      float r = rBase + noise * 0.2;
      
      vec3 pos = position * r; 
      
      // Add drift/trail effect in Z and slightly XY
      pos.z += snoise(vec3(pos.xy * 4.0, uTime)) * 0.1;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      gl_PointSize = (40.0 / -mvPosition.z); 
      vAlpha = 0.7 + 0.3 * noise;
    }
  `;
  
  const fragmentShader = `
    varying float vAlpha;
    void main() {
      vec2 coord = gl_PointCoord - 0.5;
      float dist = length(coord);
      if(dist > 0.5) discard;
      float glow = exp(-dist * 6.0);
      gl_FragColor = vec4(0.9, 0.95, 1.0, vAlpha * glow); // Slightly blue-white
    }
  `;

  return (
    <points ref={pointsRef}>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={positions.length/3} array={positions} itemSize={3} />
            <bufferAttribute attach="attributes-angle" count={angles.length} array={angles} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial 
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={uniforms}
            transparent={true}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
        />
    </points>
  )
}

const LivingRockExperience = ({ scrollProgress, mouse }: { scrollProgress: number, mouse: THREE.Vector2 }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const rockRef = useRef<THREE.Mesh>(null);
  const { viewport, size } = useThree();

  // Use refs to avoid stale closures in useFrame
  const scrollProgressRef = useRef(scrollProgress);
  scrollProgressRef.current = scrollProgress;

  const particles = useMemo(() => generateParticles(viewport.width, viewport.height), [viewport]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScrollProgress: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uViewport: { value: new THREE.Vector2(viewport.width, viewport.height) }
  }), [viewport, size]);

  useFrame((state) => {
    const { clock } = state;
    const t = clock.getElapsedTime();

    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uScrollProgress.value = scrollProgressRef.current;
      mat.uniforms.uMouse.value.copy(mouse);
    }
    if (rockRef.current) {
      const mat = rockRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uScrollProgress.value = scrollProgressRef.current;
      mat.uniforms.uMouse.value.copy(mouse);
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

      {/* New Cursor Ring Component */}
      <CursorParticles mouse={mouse} />
    </>
  );
};

export default LivingRockExperience;