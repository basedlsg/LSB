import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- SHADER CHUNKS ---
const noiseFunctions = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }

vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }

vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

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

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

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

// Background shader
const bgVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const bgFragment = `
varying vec2 vUv;
uniform float uTime;
uniform float uScrollProgress;
${noiseFunctions}

void main() {
  vec2 uv = vUv;

  vec3 cDeep = vec3(0.08, 0.04, 0.02);
  vec3 cOchre = vec3(0.2, 0.1, 0.05);

  float n1 = snoise(uv * 1.5 + uTime * 0.015);
  vec3 color = mix(cDeep, cOchre, n1 * 0.25 + 0.25);

  // Subtle stars in background
  float stars = snoise(uv * 50.0);
  stars = smoothstep(0.85, 1.0, stars) * 0.15;
  color += vec3(stars);

  float vignette = smoothstep(1.0, 0.2, length(uv - 0.5));
  color *= vignette * 0.9;

  gl_FragColor = vec4(color, 1.0);
}
`;

// Particle count
const PARTICLE_COUNT = 12000;

// Define constellation shapes for key words
// Each constellation is an array of {x, y} positions relative to center
const createConstellationPatterns = () => {
  // VOID - scattered, dissolving points
  const voidPattern: { x: number; y: number }[] = [];
  for (let i = 0; i < 200; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 2;
    voidPattern.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r
    });
  }

  // DREAM - swirling spiral
  const dreamPattern: { x: number; y: number }[] = [];
  for (let i = 0; i < 300; i++) {
    const t = i / 300;
    const angle = t * Math.PI * 6;
    const r = t * 1.5;
    dreamPattern.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r
    });
  }

  // ASK - upward reaching lines (like raised hands)
  const askPattern: { x: number; y: number }[] = [];
  for (let i = 0; i < 200; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const baseX = (col - 2) * 0.4;
    const baseY = -1 + row * 0.05;
    const spread = Math.sin(row * 0.1) * 0.2;
    askPattern.push({
      x: baseX + spread * (col - 2) * 0.3,
      y: baseY + Math.sin(col + row * 0.1) * 0.1
    });
  }

  // STRIKE - lightning bolt / explosion pattern
  const strikePattern: { x: number; y: number }[] = [];
  for (let i = 0; i < 250; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.5) * 1.5;
    // Add radial lines
    const lineAngle = Math.floor(Math.random() * 8) * Math.PI / 4;
    const onLine = Math.random() < 0.4;
    strikePattern.push({
      x: onLine ? Math.cos(lineAngle) * r : Math.cos(angle) * r * 0.3,
      y: onLine ? Math.sin(lineAngle) * r : Math.sin(angle) * r * 0.3
    });
  }

  // WALK - flowing path / footsteps
  const walkPattern: { x: number; y: number }[] = [];
  for (let i = 0; i < 300; i++) {
    const t = i / 300;
    const x = (t - 0.5) * 3;
    const y = Math.sin(t * Math.PI * 3) * 0.5 + (Math.random() - 0.5) * 0.2;
    walkPattern.push({ x, y });
  }

  return { voidPattern, dreamPattern, askPattern, strikePattern, walkPattern };
};

// Generate particle positions for all 4 states
const generateConstellationParticles = () => {
  const pos0 = new Float32Array(PARTICLE_COUNT * 3); // Scattered (intro)
  const pos1 = new Float32Array(PARTICLE_COUNT * 3); // Dream spiral
  const pos2 = new Float32Array(PARTICLE_COUNT * 3); // Ask (reaching up)
  const pos3 = new Float32Array(PARTICLE_COUNT * 3); // Strike (explosion)
  const pos4 = new Float32Array(PARTICLE_COUNT * 3); // Walk (path)

  const { voidPattern, dreamPattern, askPattern, strikePattern, walkPattern } = createConstellationPatterns();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = i * 3;
    const t = i / PARTICLE_COUNT;

    // POS 0: Scattered void (ambient floating)
    const scatterAngle = Math.random() * Math.PI * 2;
    const scatterR = Math.random() * 3;
    pos0[idx] = Math.cos(scatterAngle) * scatterR;
    pos0[idx + 1] = Math.sin(scatterAngle) * scatterR;
    pos0[idx + 2] = (Math.random() - 0.5) * 2;

    // POS 1: Dream spiral constellation
    const dreamIdx = Math.floor(Math.random() * dreamPattern.length);
    const dream = dreamPattern[dreamIdx];
    pos1[idx] = dream.x + (Math.random() - 0.5) * 0.15;
    pos1[idx + 1] = dream.y + (Math.random() - 0.5) * 0.15;
    pos1[idx + 2] = (Math.random() - 0.5) * 0.5;

    // POS 2: Asking/reaching pattern
    const askIdx = Math.floor(Math.random() * askPattern.length);
    const ask = askPattern[askIdx];
    pos2[idx] = ask.x + (Math.random() - 0.5) * 0.1;
    pos2[idx + 1] = ask.y + (Math.random() - 0.5) * 0.1;
    pos2[idx + 2] = (Math.random() - 0.5) * 0.3;

    // POS 3: Strike/explosion pattern
    const strikeIdx = Math.floor(Math.random() * strikePattern.length);
    const strike = strikePattern[strikeIdx];
    pos3[idx] = strike.x + (Math.random() - 0.5) * 0.1;
    pos3[idx + 1] = strike.y + (Math.random() - 0.5) * 0.1;
    pos3[idx + 2] = (Math.random() - 0.5) * 0.4;

    // POS 4: Walking path pattern
    const walkIdx = Math.floor(Math.random() * walkPattern.length);
    const walk = walkPattern[walkIdx];
    pos4[idx] = walk.x + (Math.random() - 0.5) * 0.15;
    pos4[idx + 1] = walk.y + (Math.random() - 0.5) * 0.15;
    pos4[idx + 2] = (Math.random() - 0.5) * 0.3;
  }

  return { pos0, pos1, pos2, pos3, pos4 };
};

// Particle shaders
const particleVertex = `
attribute vec3 pos0;
attribute vec3 pos1;
attribute vec3 pos2;
attribute vec3 pos3;
attribute vec3 pos4;

uniform float uTime;
uniform float uScrollProgress;
uniform vec2 uMouse;

varying float vAlpha;
varying float vGlow;

${noiseFunctions}

vec2 rotate(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  mat2 m = mat2(c, -s, s, c);
  return m * v;
}

void main() {
  float totalStates = 4.0;

  float safeScroll = clamp(uScrollProgress, 0.0, 0.9999);
  float progress = safeScroll * totalStates;

  float stateIdx = floor(progress);
  stateIdx = clamp(stateIdx, 0.0, 3.0);
  float t = progress - stateIdx;
  t = clamp(t, 0.0, 1.0);

  // Smoothstep easing
  float easeT = t * t * (3.0 - 2.0 * t);

  vec3 currentPos;
  vec3 nextPos;

  // Transitions: Void -> Dream -> Ask -> Strike -> Walk
  if (stateIdx < 0.5) {
    currentPos = pos0; nextPos = pos1;  // Void -> Dream
  } else if (stateIdx < 1.5) {
    currentPos = pos1; nextPos = pos2;  // Dream -> Ask
  } else if (stateIdx < 2.5) {
    currentPos = pos2; nextPos = pos3;  // Ask -> Strike
  } else {
    currentPos = pos3; nextPos = pos4;  // Strike -> Walk
  }

  vec3 mixPos = mix(currentPos, nextPos, easeT);

  // Transition turbulence
  float activity = sin(t * 3.14159);
  vec3 turbulence = curlNoise(mixPos * 0.8 + uTime * 0.1) * activity * 0.6;
  vec3 finalPos = mixPos + turbulence;

  // Gentle continuous rotation
  float rotSpeed = 0.02 + activity * 0.01;
  finalPos.xy = rotate(finalPos.xy, uTime * rotSpeed);

  // Subtle drift
  vec3 drift = vec3(
    snoise(finalPos * 0.5 + uTime * 0.08),
    snoise(finalPos * 0.5 + uTime * 0.1 + 10.0),
    snoise(finalPos * 0.5 + uTime * 0.06 + 20.0)
  ) * 0.03;
  finalPos += drift;

  // Mouse interaction - particles are attracted slightly
  vec2 mouseWorld = uMouse * 2.5;
  float dist = distance(finalPos.xy, mouseWorld);
  float radius = 0.8;

  if (dist < radius) {
    vec2 dir = normalize(finalPos.xy - mouseWorld);
    float force = (1.0 - dist / radius);
    force = pow(force, 1.5) * 0.4;
    // Push away but also create slight orbit effect
    vec2 tangent = vec2(-dir.y, dir.x);
    finalPos.xy += dir * force * 0.5 + tangent * force * 0.3;
  }

  vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Larger particles for constellation effect
  gl_PointSize = (30.0 / -mvPosition.z);

  // Sparkle and glow
  float sparkle = snoise(finalPos * 8.0 + uTime * 3.0);
  vAlpha = 0.5 + 0.5 * sparkle;
  vAlpha *= smoothstep(-4.0, 1.0, finalPos.z);

  // Extra glow during transitions
  vGlow = activity * 0.3;
}
`;

const particleFragment = `
varying float vAlpha;
varying float vGlow;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  // Soft glow with bright core
  float core = exp(-dist * 8.0);
  float glow = exp(-dist * 3.0);

  if (glow < 0.01) discard;

  // Warm white with slight color variation
  vec3 coreColor = vec3(1.0, 0.98, 0.95);
  vec3 glowColor = vec3(1.0, 0.9, 0.8);

  vec3 color = mix(glowColor, coreColor, core);

  float alpha = vAlpha * (core * 0.7 + glow * 0.3);
  alpha += vGlow * glow;

  gl_FragColor = vec4(color, alpha);
}
`;

// Connection lines shader (for constellation effect)
const lineVertex = `
attribute vec3 position;
uniform float uTime;
varying float vAlpha;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vAlpha = 0.15;
}
`;

const lineFragment = `
varying float vAlpha;
void main() {
  gl_FragColor = vec4(1.0, 0.95, 0.9, vAlpha);
}
`;

// Constellation Scene
const ConstellationScene = ({ scrollProgress, mouse }: { scrollProgress: number; mouse: THREE.Vector2 }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const bgRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const particles = useMemo(() => generateConstellationParticles(), []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScrollProgress: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) }
  }), []);

  const bgUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScrollProgress: { value: 0 }
  }), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uScrollProgress.value = scrollProgress;
      mat.uniforms.uMouse.value.copy(mouse);
    }

    if (bgRef.current) {
      const mat = bgRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uScrollProgress.value = scrollProgress;
    }
  });

  return (
    <>
      <mesh ref={bgRef} position={[0, 0, -5]}>
        <planeGeometry args={[viewport.width * 3, viewport.height * 3]} />
        <shaderMaterial
          vertexShader={bgVertex}
          fragmentShader={bgFragment}
          uniforms={bgUniforms}
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

// Story content
const chapters = [
  {
    title: "The Dreaming",
    subtitle: "Chapter I",
    keyword: "VOID",
    content: "In the time before time, when the cosmos was silent and formless, there existed only the Great Potential—an infinite sea of unmanifested possibility."
  },
  {
    title: "The Age of Asking",
    subtitle: "Chapter II",
    keyword: "ASK",
    content: "When beings first emerged into wakefulness, they gazed outward at the vast unknown and felt for the first time the pull of curiosity."
  },
  {
    title: "The Sacred Strike",
    subtitle: "Chapter III",
    keyword: "STRIKE",
    content: "Three beings reached up to the heavens. Their unified intent struck the cosmic membrane like a bolt, sending ripples across dimensions."
  },
  {
    title: "The Age of Walking",
    subtitle: "Chapter IV",
    keyword: "WALK",
    content: "And so began the eternal journey. No longer did beings sit and wonder. They walked, they explored, they created."
  }
];

export default function PhilosophyConstellations() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mousePos = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) return;
      const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 0.9999);
      setScrollProgress(progress);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mousePos.current.set(x, y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const currentChapter = Math.min(Math.floor(scrollProgress * 4), 3);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0504] text-[#FDFBF7] font-sans">
      {/* Back button */}
      <a
        href="#/"
        className="fixed top-8 left-8 z-50 text-xs tracking-[0.2em] uppercase opacity-60 hover:opacity-100 transition-opacity"
      >
        &larr; Back
      </a>

      {/* Version label */}
      <div className="fixed top-8 right-8 z-50 text-xs tracking-[0.2em] uppercase opacity-40">
        Constellations Version
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ConstellationScene scrollProgress={scrollProgress} mouse={mousePos.current} />
        </Canvas>
      </div>

      {/* Vertical scroll container */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory"
        style={{ scrollBehavior: 'auto', overscrollBehavior: 'contain' }}
      >
        {chapters.map((chapter, idx) => (
          <section
            key={idx}
            className="min-h-screen w-full flex items-center justify-center snap-start p-12"
          >
            <div className="max-w-xl text-center space-y-8 [text-shadow:_0_2px_30px_rgba(0,0,0,0.9),_0_4px_60px_rgba(0,0,0,0.7)]">
              <p className="text-xs font-bold tracking-[0.4em] uppercase opacity-40">
                {chapter.subtitle}
              </p>
              <h2 className="text-5xl md:text-7xl font-thin tracking-tight">
                {chapter.title}
              </h2>
              <div className="flex items-center justify-center gap-4">
                <div className="w-8 h-px bg-white/20" />
                <span className="text-[10px] tracking-[0.5em] uppercase opacity-30">{chapter.keyword}</span>
                <div className="w-8 h-px bg-white/20" />
              </div>
              <p className="text-lg md:text-xl font-light leading-relaxed opacity-75">
                {chapter.content}
              </p>
            </div>
          </section>
        ))}
      </div>

      {/* Side progress indicator */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-6">
        {chapters.map((chapter, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className={`text-[10px] tracking-[0.15em] uppercase transition-all duration-500 ${
              idx === currentChapter ? 'opacity-100' : 'opacity-0'
            }`}>
              {chapter.keyword}
            </span>
            <div
              className={`w-2 h-2 rounded-full border border-white/30 transition-all duration-500 ${
                idx === currentChapter ? 'bg-white scale-125' : 'bg-transparent scale-100 opacity-40'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 opacity-40">
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/50 to-transparent animate-pulse" />
        <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
      </div>
    </div>
  );
}
