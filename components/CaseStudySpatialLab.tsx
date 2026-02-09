import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Cursor from './Cursor';

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
    // Fibonacci sphere distribution
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

  // Gentle rotation
  pos.xy = rotate(pos.xy, uTime * 0.02);
  pos.xz = rotate(pos.xz, uTime * 0.015);

  // Subtle drift
  vec3 drift = vec3(
    snoise(pos * 0.3 + uTime * 0.05),
    snoise(pos * 0.3 + uTime * 0.06 + 10.0),
    snoise(pos * 0.3 + uTime * 0.04 + 20.0)
  ) * 0.15;
  pos += drift;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = (15.0 / -mvPosition.z);

  // Fade based on depth and add sparkle
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

// Premium glass card style
const glassCardClass = "backdrop-blur-md bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] p-8 md:p-12 rounded-2xl";

export default function CaseStudySpatialLab() {
  return (
    <div className="min-h-screen bg-[#0d0603] text-[#FDFBF7] font-sans selection:bg-[#B06520] selection:text-white">

      {/* Cursor */}
      <Cursor />

      {/* Particle Background - Fixed across entire page */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
          <ParticleField />
        </Canvas>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 md:p-8 flex justify-between items-center mix-blend-difference">
        <a href="#/" className="text-xs tracking-[0.3em] uppercase opacity-70 hover:opacity-100 transition-opacity">
          &larr; Walking Stick Labs
        </a>
        <a
          href="https://github.com/basedlsg/spatial-lab"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-[0.3em] uppercase opacity-70 hover:opacity-100 transition-opacity"
        >
          View Code &rarr;
        </a>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 pt-20 relative z-10">
        <FadeIn delay={200} className="text-center max-w-4xl">
          <div className="text-[10px] md:text-xs tracking-[0.4em] uppercase opacity-50 mb-6 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
            Case Study
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tighter leading-[0.9] [text-shadow:_0_2px_30px_rgba(0,0,0,0.9),_0_4px_60px_rgba(0,0,0,0.8)]">
            Spatial Lab
          </h1>
          <p className="text-lg md:text-xl font-light tracking-wide opacity-80 mt-8 max-w-2xl mx-auto [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
            Teaching AI to understand space — not through vision, but through reasoning
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {['Python', 'AI Research', 'Spatial Intelligence', 'Simulation'].map((tag) => (
              <span key={tag} className="px-4 py-1.5 border border-white/20 rounded-full text-[10px] tracking-[0.15em] uppercase backdrop-blur-sm bg-black/30">
                {tag}
              </span>
            ))}
          </div>
        </FadeIn>

        <div className="absolute bottom-12 w-px h-16 bg-gradient-to-b from-white/0 via-white/50 to-white/0 animate-pulse" />
      </section>

      {/* Content wrapper - transparent to show particles */}
      <div className="relative z-10">

      {/* The Question */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-4xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">The Question</div>
            <blockquote className="text-2xl md:text-4xl lg:text-5xl font-thin leading-snug tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
              "Can an AI that's only ever read words understand how to move through a room?"
            </blockquote>
            <p className="text-base md:text-lg font-light opacity-70 mt-10 max-w-2xl leading-relaxed [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">
              Language models learn from text alone — they've never walked through a room or moved an object.
              Yet somehow, they can often answer spatial questions correctly. This experiment explores a simple question:
              how far does that understanding actually go?
            </p>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* Architecture */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-5xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">System Architecture</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">How it works</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <pre className="text-[10px] md:text-xs font-mono leading-relaxed opacity-80 overflow-x-auto [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
{`
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   "Move the red crate to shelf B, avoiding the forklift"            │
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────┐                     │
│   │          LLM SPATIAL REASONER             │                     │
│   │          (Gemini / GPT-4)                 │                     │
│   │                                           │                     │
│   │   • Parse natural language intent         │                     │
│   │   • Understand spatial relationships      │                     │
│   │   • Reason about obstacles & paths        │                     │
│   └───────────────────────────────────────────┘                     │
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────┐                     │
│   │        COORDINATION ENGINE                │                     │
│   │                                           │                     │
│   │   • Select optimal agent for task         │                     │
│   │   • Calculate collision-free path         │                     │
│   │   • Manage inter-agent communication      │                     │
│   └───────────────────────────────────────────┘                     │
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────┐                     │
│   │       WAREHOUSE SIMULATION                │                     │
│   │                                           │                     │
│   │   • Configurable layouts (20m - 80m)      │                     │
│   │   • 2-10 coordinated agents               │                     │
│   │   • Physics-based constraints             │                     │
│   └───────────────────────────────────────────┘                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
`}
            </pre>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* What Was Built */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-5xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">The Building Blocks</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">What powers the experiment</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <FadeIn delay={100}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">A World to Live In</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  A simulated grid environment where every position, obstacle, and path is visible.
                  Small enough to hold in your head, detailed enough to reveal meaningful patterns.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  environments/ — simulation engine
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Movement & Coordination</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Multiple agents moving through shared space, avoiding collisions,
                  finding paths, and working together — or getting in each other's way.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  coordination/ — path planning
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">The AI Mind</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Language models (GPT-4, Gemini) receive descriptions of the world and decide how to act.
                  They see coordinates and consequences. Then they choose.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  llm/ — reasoning engine
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Measuring Truth</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Every experiment runs with controls, statistics, and reproducibility.
                  The goal isn't to prove anything — it's to see what's actually there.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  evaluation/ — validation
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Results */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-5xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">What We Found</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">The numbers tell a story</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
              <MetricCard value="85%" label="Found Good Paths" />
              <MetricCard value="92%" label="Avoided Collisions" />
              <MetricCard value="81%" label="Worked Together" />
              <MetricCard value="+18.7%" label="vs. Baseline" />
            </div>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-6 border border-white/10 rounded-lg">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 mb-4">Compared to Others</div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <span className="opacity-60">Random (no thinking)</span>
                    <span>30% success, many crashes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Simple rules</span>
                    <span>60% success, some crashes</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                    <span className="opacity-60">With LLM reasoning</span>
                    <span className="text-white">85% success, few crashes</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-white/10 rounded-lg">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 mb-4">Is it Real?</div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <span className="opacity-60">Without LLM reasoning</span>
                    <span>69.5% average score</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">With LLM reasoning</span>
                    <span>82.5% average score</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                    <span className="opacity-60">Statistically significant?</span>
                    <span className="text-white">Yes (p &lt; 0.05)</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* Code Structure */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-4xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Structure</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Codebase</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <pre className="text-xs md:text-sm font-mono leading-loose opacity-80 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
{`spatial_lab/
├── environments/        # Warehouse simulation
│   └── warehouse.py     # Layout generation, physics
├── coordination/        # Multi-agent systems
│   ├── fleet.py         # Robot management
│   ├── pathfinding.py   # A*, collision avoidance
│   └── communication.py # Inter-robot messaging
├── llm/                 # Language model integration
│   ├── gemini.py        # Google Gemini client
│   └── openai.py        # GPT-4 client
├── evaluation/          # Research framework
│   ├── metrics.py       # Performance measurement
│   └── statistics.py    # Significance testing
└── config.py            # Experiment configuration`}
            </pre>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* Limitations */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-4xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Honest Assessment</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Limitations</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">Current State</div>
                <ul className="space-y-3 text-sm font-light opacity-80 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>LLM integration framework operational</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Multi-robot coordination validated</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Statistical validation framework</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Reproducible experiment runners</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-6">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">In Progress</div>
                <ul className="space-y-3 text-sm font-light opacity-80 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400 mt-0.5">○</span>
                    <span>Full A* pathfinding implementation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400 mt-0.5">○</span>
                    <span>Multi-agent conflict resolution</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400 mt-0.5">○</span>
                    <span>Automated test coverage</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400 mt-0.5">○</span>
                    <span>Production hardening</span>
                  </li>
                </ul>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* What This Demonstrates */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-4xl mx-auto text-center ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">The Bigger Picture</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">What this project represents</h2>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <div className="text-lg font-light mb-3 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Building Complex Systems</div>
                <p className="text-sm font-light opacity-70 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Taking a big question and breaking it into pieces that can actually be tested and measured
                </p>
              </div>
              <div>
                <div className="text-lg font-light mb-3 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Honest Inquiry</div>
                <p className="text-sm font-light opacity-70 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Designing experiments that could fail — and learning from what they reveal either way
                </p>
              </div>
              <div>
                <div className="text-lg font-light mb-3 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Pushing AI Forward</div>
                <p className="text-sm font-light opacity-70 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Exploring what language models can do beyond conversation — into understanding space itself
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* Philosophical Blurb */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-4xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Why This Exists</div>
            <div className="space-y-8 text-base md:text-lg font-light leading-relaxed opacity-90 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">
              <p>
                I started Spatial Lab with something small and honest: a simple grid and a representation of a tiny robot.
                I had experimented with 3D before — it was fascinating from an RL angle, but too heavy to fully understand
                end-to-end without outside tools. I wanted a world I could actually hold in my head, inspect, tweak, and
                run a complete experiment inside. In that sense, the grid made the most sense. It's stripped down enough
                that every mistake, every decision, every pattern becomes visible.
              </p>
              <p>
                The real question underneath all of this is whether a language model can develop a sense of "self" inside a space.
                Not philosophically — mechanically. If it lives on a board, can it reason as if it is the agent moving on that board?
                Can it understand the difference between itself, the objects, and the grid that contains them? I wanted to watch how
                an LLM behaves when its entire world is coordinates and consequences, when every action shifts the reality it depends on.
                The experiment isn't about grand theories — it's about seeing what an AI actually does when you give it a world,
                however small, and tell it: <em className="opacity-100">go live in it.</em>
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* Footer CTA */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 ${glassCardClass}`}>
          <div>
            <div className="text-2xl md:text-3xl font-thin tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Explore the code</div>
            <p className="text-sm font-light opacity-70 mt-2 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">MIT Licensed. Open source.</p>
          </div>
          <a
            href="https://github.com/basedlsg/spatial-lab"
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

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 text-center">
        <div className="text-[9px] md:text-[10px] tracking-[0.3em] opacity-40 uppercase space-y-2">
          <div>San Francisco — CA, Beijing — CN</div>
          <div>&copy; Walking Stick Labs</div>
        </div>
      </footer>

      </div>{/* End content wrapper */}
    </div>
  );
}
