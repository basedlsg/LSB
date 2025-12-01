import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Cursor from './Cursor';

// --- GRADIENT BACKGROUND SHADERS ---
const bgVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// --- PARTICLE BACKGROUND ---
const noiseFunctions = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const PARTICLE_COUNT = 8000;

const generateParticlePositions = () => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = i * 3;
    const phi = Math.acos(1 - 2 * (i + 0.5) / PARTICLE_COUNT);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    const r = 2.0 + Math.random() * 0.5;
    positions[idx] = r * Math.cos(theta) * Math.sin(phi);
    positions[idx + 1] = r * Math.sin(theta) * Math.sin(phi);
    positions[idx + 2] = r * Math.cos(phi);
  }
  return positions;
};

const particleVertexShader = `
uniform float uTime;
uniform float uScroll;
varying float vAlpha;

${noiseFunctions}

vec2 rotate(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c) * v;
}

void main() {
  vec3 pos = position;
  pos.xy = rotate(pos.xy, uTime * 0.02);
  pos.xz = rotate(pos.xz, uTime * 0.015);
  vec3 drift = vec3(
    snoise(pos * 0.3 + uTime * 0.05),
    snoise(pos * 0.3 + uTime * 0.06 + 10.0),
    snoise(pos * 0.3 + uTime * 0.04 + 20.0)
  ) * 0.15;
  pos += drift;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = (15.0 / -mvPosition.z);
  float sparkle = snoise(pos * 5.0 + uTime * 1.5);
  vAlpha = 0.4 + 0.3 * sparkle;
  vAlpha *= smoothstep(-6.0, 1.0, pos.z);
}
`;

const particleFragmentShader = `
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  float glow = exp(-dist * 5.0);
  if (glow < 0.01) discard;
  vec3 color = vec3(1.0, 0.98, 0.95);
  gl_FragColor = vec4(color, vAlpha * glow * 0.6);
}
`;

const ParticleField = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => generateParticlePositions(), []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScroll: { value: 0 }
  }), []);

  useFrame((state) => {
    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// --- BEAUTIFUL GRADIENT BACKGROUND ---
const bgFragmentShader = `
uniform float uTime;
varying vec2 vUv;

${noiseFunctions}

void main() {
  vec2 uv = vUv;
  vec2 center = vec2(0.5);
  float dist = length(uv - center);

  // Rich color palette
  vec3 voidBlack = vec3(0.008, 0.004, 0.012);
  vec3 deepIndigo = vec3(0.03, 0.015, 0.06);
  vec3 warmAmber = vec3(0.15, 0.06, 0.02);
  vec3 emberOrange = vec3(0.2, 0.08, 0.02);
  vec3 cosmicPurple = vec3(0.08, 0.02, 0.12);

  // Multi-scale flowing noise
  float t = uTime * 0.04;
  float n1 = snoise(vec3(uv * 1.5, t));
  float n2 = snoise(vec3(uv * 3.0 + n1 * 0.4, t * 1.3));
  float n3 = snoise(vec3(uv * 6.0 + n2 * 0.3, t * 0.7));
  float n4 = snoise(vec3(uv * 12.0, t * 0.5));

  // Nebula layers
  float nebula1 = pow(n1 * 0.5 + 0.5, 1.5);
  float nebula2 = pow(n2 * 0.5 + 0.5, 2.0);
  float nebula3 = pow(max(0.0, n3), 3.0);

  // Base: deep void with indigo undertones
  vec3 color = mix(voidBlack, deepIndigo, nebula1 * 0.4);

  // Warm nebula clouds flowing from edges
  float warmFlow = smoothstep(0.3, 0.8, dist) * nebula2;
  color = mix(color, warmAmber, warmFlow * 0.5);

  // Ember hotspots
  float embers = nebula3 * smoothstep(0.6, 0.3, dist);
  color = mix(color, emberOrange, embers * 0.4);

  // Cosmic purple wisps
  float purpleWisp = pow(n2 * 0.5 + 0.5, 2.5) * (1.0 - dist * 0.8);
  color = mix(color, cosmicPurple, purpleWisp * 0.3);

  // Fine detail texture
  color += n4 * 0.015;

  // Soft star-like points
  float stars = pow(max(0.0, snoise(vec3(uv * 50.0, t * 0.1))), 12.0);
  color += vec3(1.0, 0.95, 0.9) * stars * 0.25;

  // Deep vignette for depth
  float vignette = smoothstep(1.2, 0.2, dist);
  color *= 0.5 + vignette * 0.5;

  gl_FragColor = vec4(color, 1.0);
}
`;

const GradientBackground = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <planeGeometry args={[viewport.width * 2.5, viewport.height * 2.5]} />
      <shaderMaterial
        vertexShader={bgVertexShader}
        fragmentShader={bgFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <div className={`transition-all duration-1000 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  );
};

const SectionDivider = () => (
  <div className="w-full flex justify-center py-16">
    <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
  </div>
);

const MetricCard = ({ value, label }: { value: string, label: string }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-thin tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">{value}</div>
    <div className="text-[10px] md:text-xs tracking-[0.2em] uppercase opacity-60 mt-2 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">{label}</div>
  </div>
);

const glassCardClass = "backdrop-blur-md bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] p-8 md:p-12 rounded-2xl";

export default function CaseStudyWhatsInTheRoom() {
  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth bg-[#0d0603] text-[#FDFBF7] font-sans selection:bg-[#B06520] selection:text-white">

      <Cursor />

      {/* Particle Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
          <GradientBackground />
          <ParticleField />
        </Canvas>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 md:p-8 flex justify-between items-center mix-blend-difference">
        <a href="#/" className="text-xs tracking-[0.3em] uppercase opacity-70 hover:opacity-100 transition-opacity">
          &larr; Walking Stick Labs
        </a>
        <a
          href="https://github.com/basedlsg/WhatsInTheRoom"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-[0.3em] uppercase opacity-70 hover:opacity-100 transition-opacity"
        >
          View Code &rarr;
        </a>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 pt-20 relative z-10 snap-start">
        <FadeIn delay={200} className="text-center max-w-4xl">
          <div className="text-[10px] md:text-xs tracking-[0.4em] uppercase opacity-50 mb-6 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
            Case Study
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tighter leading-[0.9] [text-shadow:_0_2px_30px_rgba(0,0,0,0.9),_0_4px_60px_rgba(0,0,0,0.8)]">
            What's In The Room
          </h1>
          <p className="text-lg md:text-xl font-light tracking-wide opacity-80 mt-8 max-w-2xl mx-auto [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
            Testing whether AI can understand architecture — by hiding one room and asking it to guess
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {['Python', 'Vision AI', 'Spatial Reasoning', 'Synthetic Data'].map((tag) => (
              <span key={tag} className="px-4 py-1.5 border border-white/20 rounded-full text-[10px] tracking-[0.15em] uppercase backdrop-blur-sm bg-black/30">
                {tag}
              </span>
            ))}
          </div>
        </FadeIn>

        <div className="absolute bottom-12 w-px h-16 bg-gradient-to-b from-white/0 via-white/50 to-white/0 animate-pulse" />
      </section>

      {/* The Question */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className={`max-w-4xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">The Question</div>
            <blockquote className="text-2xl md:text-4xl lg:text-5xl font-thin leading-snug tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
              "If you hide one room in a floorplan, can AI figure out what it is just by looking at everything else?"
            </blockquote>
            <p className="text-base md:text-lg font-light opacity-70 mt-10 max-w-2xl leading-relaxed [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">
              Humans use context constantly. A small room next to the master bedroom is probably a closet.
              A room with a door to the outside might be a garage. Can vision-language models
              pick up on these spatial relationships — or do they just see pixels?
            </p>
          </FadeIn>
        </div>
      </section>

      {/* The Experiment */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className={`max-w-5xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">The Experiment</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">How we tested it</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <pre className="text-[10px] md:text-xs font-mono leading-relaxed opacity-80 overflow-x-auto [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
{`
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   STEP 1: GENERATE                                                  │
│   ┌───────────────────────────────────────────┐                     │
│   │     Synthetic Floorplan Generator         │                     │
│   │                                           │                     │
│   │   • Binary space partitioning             │                     │
│   │   • Region-specific rules (US, China, EU) │                     │
│   │   • Realistic room placement & doors      │                     │
│   │   • 5-20 floorplans per second            │                     │
│   └───────────────────────────────────────────┘                     │
│                              │                                      │
│                              ▼                                      │
│   STEP 2: HIDE                                                      │
│   ┌───────────────────────────────────────────┐                     │
│   │     Mystery Room Selection                │                     │
│   │                                           │                     │
│   │   • Pick ambiguous rooms (closets,        │                     │
│   │     offices, storage, guest bedrooms)     │                     │
│   │   • Remove the label from the image       │                     │
│   │   • Mark it with "?"                      │                     │
│   └───────────────────────────────────────────┘                     │
│                              │                                      │
│                              ▼                                      │
│   STEP 3: ASK                                                       │
│   ┌───────────────────────────────────────────┐                     │
│   │     Vision-Language Model                 │                     │
│   │     (NVIDIA NIM API)                      │                     │
│   │                                           │                     │
│   │   "What room is marked with '?' ?         │                     │
│   │    Explain your reasoning."               │                     │
│   └───────────────────────────────────────────┘                     │
│                              │                                      │
│                              ▼                                      │
│   STEP 4: MEASURE                                                   │
│   ┌───────────────────────────────────────────┐                     │
│   │     Statistical Analysis                  │                     │
│   │                                           │                     │
│   │   • Accuracy by room type                 │                     │
│   │   • Confusion matrices                    │                     │
│   │   • F1 / Precision / Recall               │                     │
│   │   • Performance by region & size          │                     │
│   └───────────────────────────────────────────┘                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
`}
            </pre>
          </FadeIn>
        </div>
      </section>

      {/* What Was Built */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className={`max-w-5xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">The Building Blocks</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">What powers the experiment</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <FadeIn delay={100}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Infinite Floorplans</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Procedural generation creates unlimited unique layouts. No external datasets needed —
                  every floorplan is synthesized from architectural rules and regional constraints.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  src/generation/ — layout synthesis
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Regional Architecture</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  US suburbs have attached garages. Chinese apartments have shoe rooms. European flats have different proportions.
                  The generator knows these rules.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  6+ architectural regions
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Deterministic Seeds</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Every experiment is reproducible. Same seed, same floorplan.
                  This lets us isolate variables and trust our results.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  Full reproducibility
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Ambiguity by Design</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  We don't hide obvious rooms. We pick closets, offices, storage rooms —
                  spaces that require reasoning about neighbors and context.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  src/inference/ — mystery selection
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className={`max-w-5xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">What We Found</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">The numbers tell a story</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
              <MetricCard value="1000s" label="Floorplans Tested" />
              <MetricCard value="6+" label="Architectural Regions" />
              <MetricCard value="F1/P/R" label="Per Room Type" />
              <MetricCard value="100%" label="Reproducible" />
            </div>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-6 border border-white/10 rounded-lg">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 mb-4">What Models Got Right</div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <span className="opacity-60">Bathrooms</span>
                    <span>High confidence (near plumbing)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Kitchens</span>
                    <span>Size + proximity to dining</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                    <span className="opacity-60">Living rooms</span>
                    <span className="text-white">Central, large, connected</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-white/10 rounded-lg">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 mb-4">Where Models Struggled</div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <span className="opacity-60">Closets vs. Storage</span>
                    <span>Similar size, position</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Office vs. Guest Bedroom</span>
                    <span>Context-dependent</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                    <span className="opacity-60">Regional variations</span>
                    <span className="text-white">Cultural norms differ</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Code Structure */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className={`max-w-4xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Structure</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Codebase</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <pre className="text-xs md:text-sm font-mono leading-loose opacity-80 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
{`whats_in_the_room/
├── src/
│   ├── core/            # Geometry primitives, data models
│   ├── generation/      # Floorplan synthesis (6+ regions)
│   ├── rendering/       # PIL-based visual output
│   ├── inference/       # NVIDIA NIM API integration
│   ├── storage/         # Persistence layers
│   └── analysis/        # Metrics & visualization
├── outputs/
│   ├── floorplans/      # Generated layouts (JSON)
│   ├── images/          # Rendered PNGs
│   ├── predictions/     # Model responses (Parquet)
│   └── analysis/        # Confusion matrices, charts
└── main.py              # Experiment runner`}
            </pre>
          </FadeIn>
        </div>
      </section>

      {/* What This Demonstrates */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className={`max-w-4xl mx-auto text-center ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">The Bigger Picture</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">What this project represents</h2>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <div className="text-lg font-light mb-3 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Synthetic Benchmarks</div>
                <p className="text-sm font-light opacity-70 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Creating controlled test environments where every variable is known and reproducible
                </p>
              </div>
              <div>
                <div className="text-lg font-light mb-3 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Testing Perception</div>
                <p className="text-sm font-light opacity-70 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Probing what AI actually "sees" versus what it pattern-matches from training data
                </p>
              </div>
              <div>
                <div className="text-lg font-light mb-3 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Honest Measurement</div>
                <p className="text-sm font-light opacity-70 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Finding where models succeed and where they fail — both matter equally
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Philosophical Blurb */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className={`max-w-4xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Why This Exists</div>
            <div className="space-y-8 text-base md:text-lg font-light leading-relaxed opacity-90 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">
              <p>
                There's something almost childlike about this experiment. You draw a house, you hide one room's name,
                and you ask: can you tell what this is? It's the kind of game a kid might play.
              </p>
              <p>
                But underneath that simplicity is a real question about intelligence. When a vision model looks at a floorplan,
                does it understand that the small room next to the bathroom is probably a linen closet? Does it grasp that
                American houses have attached garages while Tokyo apartments don't? Or is it just matching pixels to labels
                it's seen before?
              </p>
              <p>
                The answer, as always, is somewhere in between. And that's what makes it <em className="opacity-100">interesting.</em>
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className={`max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 ${glassCardClass}`}>
          <div>
            <div className="text-2xl md:text-3xl font-thin tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Explore the code</div>
            <p className="text-sm font-light opacity-70 mt-2 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">MIT Licensed. Open source.</p>
          </div>
          <a
            href="https://github.com/basedlsg/WhatsInTheRoom"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-10 py-4 bg-transparent overflow-hidden rounded-full transition-all hover:scale-105"
          >
            <div className="absolute inset-0 border border-white/30 rounded-full group-hover:border-white/80 transition-colors duration-500" />
            <div className="absolute inset-0 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left opacity-10" />
            <span className="relative text-sm font-bold tracking-[0.2em] uppercase">
              View on GitHub
            </span>
          </a>
        </div>
      </section>

    </div>
  );
}
