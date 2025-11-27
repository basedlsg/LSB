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

  vec3 cDeep = vec3(0.1, 0.05, 0.02);
  vec3 cOchre = vec3(0.25, 0.12, 0.05);

  float n1 = snoise(uv * 2.0 + uTime * 0.02);
  vec3 color = mix(cDeep, cOchre, n1 * 0.3 + 0.3);

  float vignette = smoothstep(1.0, 0.3, length(uv - 0.5));
  color *= vignette * 0.8;

  gl_FragColor = vec4(color, 1.0);
}
`;

// Particle count
const PARTICLE_COUNT = 15000;

// Generate waveform particle positions for 4 chapters
const generateWaveformParticles = () => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);

  // Chapters have different wave characteristics
  // Each chapter represents a horizontal band of particles

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = i * 3;
    const t = i / PARTICLE_COUNT;

    // Spread across horizontal space
    const x = (t - 0.5) * 8; // -4 to 4

    // Base waveform - multiple overlapping waves
    const wave1 = Math.sin(t * Math.PI * 4) * 0.5;
    const wave2 = Math.sin(t * Math.PI * 8 + 1) * 0.25;
    const wave3 = Math.sin(t * Math.PI * 16 + 2) * 0.1;

    const y = wave1 + wave2 + wave3 + (Math.random() - 0.5) * 0.3;
    const z = (Math.random() - 0.5) * 1.5;

    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
  }

  return positions;
};

// Particle shaders
const particleVertex = `
attribute vec3 aPosition;

uniform float uTime;
uniform float uScrollProgress;
uniform vec2 uMouse;

varying float vAlpha;

${noiseFunctions}

void main() {
  vec3 pos = aPosition;

  // Progress through story (0-1)
  float progress = uScrollProgress;

  // Different wave characteristics per chapter
  float chapter = floor(progress * 4.0);
  float chapterT = fract(progress * 4.0);

  // Wave amplitude increases with progress
  float amplitude = 0.3 + progress * 0.7;

  // Wave frequency changes per chapter
  float freq = 2.0 + chapter * 1.5;

  // Animate the wave
  float waveOffset = uTime * 0.3 + pos.x * freq;
  float wave = sin(waveOffset) * amplitude;

  // Add turbulence that increases with story progression
  vec3 turbulence = curlNoise(pos * 0.5 + uTime * 0.1) * (0.1 + progress * 0.3);

  pos.y += wave + turbulence.y;
  pos.x += turbulence.x * 0.5;
  pos.z += turbulence.z * 0.3;

  // Vertical shift based on chapter (rises and falls)
  float verticalShift = sin(progress * 3.14159 * 2.0) * 0.5;
  pos.y += verticalShift;

  // Spread particles wider as story progresses
  pos.x *= 1.0 + progress * 0.3;

  // Mouse interaction
  vec2 mouseWorld = uMouse * 3.0;
  float dist = distance(pos.xy, mouseWorld);
  float radius = 0.5;
  if (dist < radius) {
    vec2 dir = normalize(pos.xy - mouseWorld);
    float force = (1.0 - dist / radius) * 0.5;
    pos.xy += dir * force;
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  gl_PointSize = (25.0 / -mvPosition.z);

  // Alpha varies with noise
  float sparkle = snoise(pos * 5.0 + uTime * 2.0);
  vAlpha = 0.5 + 0.5 * sparkle;
  vAlpha *= smoothstep(-4.0, 0.0, pos.z);
}
`;

const particleFragment = `
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  float glow = exp(-dist * 4.0);

  if (glow < 0.01) discard;

  vec3 color = vec3(1.0, 0.98, 0.95);
  gl_FragColor = vec4(color, vAlpha * glow);
}
`;

// Waveform Scene
const WaveformScene = ({ scrollProgress, mouse }: { scrollProgress: number; mouse: THREE.Vector2 }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const bgRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const positions = useMemo(() => generateWaveformParticles(), []);

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
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aPosition"
            count={PARTICLE_COUNT}
            array={positions}
            itemSize={3}
          />
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
    content: "In the time before time, when the cosmos was silent and formless, there existed only the Great Potential—an infinite sea of unmanifested possibility."
  },
  {
    title: "The Age of Asking",
    subtitle: "Chapter II",
    content: "When beings first emerged into wakefulness, they gazed outward at the vast unknown and felt for the first time the pull of curiosity."
  },
  {
    title: "The Sacred Strike",
    subtitle: "Chapter III",
    content: "Three beings reached up to the heavens. Their unified intent struck the cosmic membrane like a bolt, sending ripples across dimensions."
  },
  {
    title: "The Age of Walking",
    subtitle: "Chapter IV",
    content: "And so began the eternal journey. No longer did beings sit and wonder. They walked, they explored, they created."
  }
];

export default function PhilosophyWaveform() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mousePos = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll <= 0) return;
      const progress = Math.min(Math.max(scrollLeft / maxScroll, 0), 0.9999);
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
    <div className="relative w-full h-screen overflow-hidden bg-[#1a0c05] text-[#FDFBF7] font-sans">
      {/* Back button */}
      <a
        href="#/"
        className="fixed top-8 left-8 z-50 text-xs tracking-[0.2em] uppercase opacity-60 hover:opacity-100 transition-opacity"
      >
        &larr; Back
      </a>

      {/* Version label */}
      <div className="fixed top-8 right-8 z-50 text-xs tracking-[0.2em] uppercase opacity-40">
        Waveform Version
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <WaveformScene scrollProgress={scrollProgress} mouse={mousePos.current} />
        </Canvas>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 w-full h-full overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory"
        style={{ scrollBehavior: 'auto', overscrollBehavior: 'contain' }}
      >
        {chapters.map((chapter, idx) => (
          <section
            key={idx}
            className="min-w-full h-full flex items-center justify-center snap-start p-12"
          >
            <div className="max-w-xl text-center space-y-8 [text-shadow:_0_2px_20px_rgba(0,0,0,0.8),_0_4px_40px_rgba(0,0,0,0.6)]">
              <p className="text-xs font-bold tracking-[0.4em] uppercase opacity-50">
                {chapter.subtitle}
              </p>
              <h2 className="text-5xl md:text-7xl font-thin tracking-tight">
                {chapter.title}
              </h2>
              <div className="w-12 h-px bg-white/30 mx-auto" />
              <p className="text-lg md:text-xl font-light leading-relaxed opacity-80">
                {chapter.content}
              </p>
            </div>
          </section>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
        {chapters.map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full border border-white/30 transition-all duration-500 ${
              idx === currentChapter ? 'bg-white scale-125' : 'bg-transparent scale-100 opacity-50'
            }`}
          />
        ))}
      </div>

      {/* Scroll hint */}
      <div className="fixed bottom-8 right-8 z-50 text-[10px] tracking-[0.2em] uppercase opacity-40 flex items-center gap-2">
        <span>Scroll</span>
        <span>&rarr;</span>
      </div>
    </div>
  );
}
