import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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
  // Purple-tinted particles for Ombrixa
  vec3 color = vec3(0.85, 0.8, 1.0);
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
    <div className="w-24 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />
  </div>
);

const MetricCard = ({ value, label }: { value: string, label: string }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-thin tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">{value}</div>
    <div className="text-[10px] md:text-xs tracking-[0.2em] uppercase opacity-60 mt-2 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">{label}</div>
  </div>
);

// Premium glass card style - purple tinted for Ombrixa
const glassCardClass = "backdrop-blur-md bg-gradient-to-br from-purple-500/[0.08] to-white/[0.02] border border-purple-400/[0.15] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] p-8 md:p-12 rounded-2xl";

export default function OmbrixaProject() {
  const techStack = [
    { layer: 'Frontend', tech: 'React + TypeScript', purpose: 'Component-based UI' },
    { layer: 'Build', tech: 'Vite + Vite PWA', purpose: 'Fast builds, installability' },
    { layer: 'AI Engine', tech: 'Gemini 2.0 Flash', purpose: 'Multi-frame vision analysis' },
    { layer: 'Storage', tech: 'IndexedDB (Dexie)', purpose: 'Local-first persistence' },
    { layer: 'Maps', tech: 'Leaflet + CartoDB', purpose: 'Incident visualization' },
    { layer: 'Camera', tech: 'react-webcam + MediaRecorder', purpose: 'Cross-platform capture' },
    { layer: 'Hosting', tech: 'Vercel', purpose: 'Edge CDN deployment' },
  ];

  const designPrinciples = [
    { principle: 'Mobile-first', implementation: 'One-handed UI, touch-optimized controls' },
    { principle: 'Local-first', implementation: 'IndexedDB storage, offline capability' },
    { principle: 'Privacy-forward', implementation: 'No mandatory cloud, encrypted biometrics' },
    { principle: 'Calm UX', implementation: 'Neutral framing, minimal visual noise' },
    { principle: 'Fast feedback', implementation: 'Streaming analysis, progress indicators' },
  ];

  const userFlow = [
    { step: 'Check-In', desc: 'Hold-to-confirm location verification' },
    { step: 'Capture', desc: 'Record scene (≤30 seconds)' },
    { step: 'Process', desc: 'Automatic frame extraction + AI analysis' },
    { step: 'Review', desc: 'View SITREP, safety score, detected entities' },
    { step: 'Search', desc: 'Query past incidents by plates, badges, or keywords' },
    { step: 'Map', desc: 'Visualize incidents geospatially' },
  ];

  return (
    <div className="min-h-screen bg-[#080510] text-[#FDFBF7] font-sans selection:bg-purple-500/30 selection:text-white">

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
        <a href="#/projects" className="text-xs tracking-[0.3em] uppercase opacity-70 hover:opacity-100 transition-opacity">
          &larr; Projects
        </a>
        <a
          href="https://ombrixa.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-[0.3em] uppercase opacity-70 hover:opacity-100 transition-opacity"
        >
          Live Demo &rarr;
        </a>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 pt-20 relative z-10">
        <FadeIn delay={200} className="text-center max-w-4xl">
          <div className="text-[10px] md:text-xs tracking-[0.4em] uppercase opacity-50 mb-6 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
            Case Study
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tighter leading-[0.9] [text-shadow:_0_2px_30px_rgba(0,0,0,0.9),_0_4px_60px_rgba(0,0,0,0.8)]">
            Ombrixa
          </h1>
          <p className="text-lg md:text-xl font-light tracking-wide opacity-80 mt-8 max-w-2xl mx-auto [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
            Mobile AI for Situational Awareness
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {['React', 'Gemini AI', 'PWA', 'Privacy-First'].map((tag) => (
              <span key={tag} className="px-4 py-1.5 border border-purple-400/30 rounded-full text-[10px] tracking-[0.15em] uppercase backdrop-blur-sm bg-purple-900/20">
                {tag}
              </span>
            ))}
          </div>
        </FadeIn>

        <div className="absolute bottom-12 w-px h-16 bg-gradient-to-b from-white/0 via-purple-400/50 to-white/0 animate-pulse" />
      </section>

      {/* Content wrapper - transparent to show particles */}
      <div className="relative z-10">

      {/* The Question */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-4xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">The Vision</div>
            <blockquote className="text-2xl md:text-4xl lg:text-5xl font-thin leading-snug tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
              "Transform any smartphone into a tactical awareness device."
            </blockquote>
            <p className="text-base md:text-lg font-light opacity-70 mt-10 max-w-2xl leading-relaxed [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">
              A mobile-first PWA that turns short video clips into structured, searchable intelligence.
              Ombrixa uses Gemini 2.0 Flash multimodal AI to extract vehicles, personnel, safety scores,
              and context tags — all while keeping data local and private.
            </p>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* Key Capabilities */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-5xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">AI Capabilities</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">What Ombrixa extracts</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <FadeIn delay={100}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight text-purple-300 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Vehicle Identification</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Make, model, color, license plates, and agency affiliation. Automatically detects law enforcement,
                  emergency, and civilian vehicles.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight text-purple-300 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Personnel Details</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Uniforms, badges, ranks, and precincts. Identifies official personnel and their organizational context.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight text-purple-300 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Safety Scoring</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Real-time threat assessment on a 1-100 scale. SAFE/CAUTION indicators help users quickly
                  understand situational context.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight text-purple-300 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Context Tags</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Scene classification and categorization — COMMERCIAL_ZONE, TRAFFIC_INTERSECTION,
                  RESIDENTIAL_AREA — for searchable incident history.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Architecture */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-5xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Technical Architecture</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Data flow</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <pre className="text-[10px] md:text-xs font-mono leading-relaxed opacity-80 overflow-x-auto [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
{`
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   📍 Check-in / QR Session                                          │
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────┐                     │
│   │          📹 Camera Capture (≤30s)          │                     │
│   │                                           │                     │
│   │   • Cross-platform MIME handling          │                     │
│   │   • 30-second max recordings              │                     │
│   └───────────────────────────────────────────┘                     │
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────┐                     │
│   │      🖼️ Frame Extraction (≤5 frames)       │                     │
│   │                                           │                     │
│   │   • 0.5s interval sampling                │                     │
│   │   • JPEG compression (1024px, 0.7)        │                     │
│   └───────────────────────────────────────────┘                     │
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────┐                     │
│   │      🤖 AI Analysis (Gemini Vision)        │                     │
│   │                                           │                     │
│   │   • Structured JSON output                │                     │
│   │   • Retry with exponential backoff        │                     │
│   └───────────────────────────────────────────┘                     │
│                              │                                      │
│                              ▼                                      │
│   📊 Structured JSON → 📱 Feed + Map + Query → 💾 IndexedDB         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
`}
            </pre>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* Tech Stack */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-4xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Technology Stack</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Built with</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="space-y-4">
              {techStack.map((row, i) => (
                <div key={row.layer} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 p-4 rounded-lg bg-white/[0.03] border border-purple-400/10">
                  <span className="text-purple-300 font-medium min-w-[100px] text-sm">{row.layer}</span>
                  <span className="text-white/90 font-mono text-sm min-w-[200px]">{row.tech}</span>
                  <span className="text-white/50 text-sm hidden md:block">{row.purpose}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* Key Features */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-5xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Key Features</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Capabilities in detail</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <FadeIn delay={100}>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-purple-300 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Intelligent Video Capture</h3>
                <ul className="space-y-2 text-sm font-light opacity-70 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  <li>• 30-second recordings optimized for mobile memory</li>
                  <li>• Multi-frame extraction at 0.5s intervals</li>
                  <li>• Automatic JPEG compression (1024px, 0.7 quality)</li>
                  <li>• Cross-platform MIME type handling</li>
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-purple-300 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">AI-Powered Analysis</h3>
                <ul className="space-y-2 text-sm font-light opacity-70 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  <li>• Gemini 2.0 Flash multimodal inference</li>
                  <li>• Structured JSON with strict schema enforcement</li>
                  <li>• Retry logic with exponential backoff</li>
                  <li>• Graceful degradation for parse failures</li>
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-purple-300 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Privacy-First Design</h3>
                <ul className="space-y-2 text-sm font-light opacity-70 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  <li>• Local-only storage by default</li>
                  <li>• Optional encrypted biometric data (AES-GCM)</li>
                  <li>• No remote servers for core functionality</li>
                  <li>• User-controlled data lifecycle</li>
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-purple-300 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Progressive Web App</h3>
                <ul className="space-y-2 text-sm font-light opacity-70 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  <li>• Installable to home screen</li>
                  <li>• Offline capable (except AI analysis)</li>
                  <li>• Automatic updates via service worker</li>
                  <li>• Native app experience without app store</li>
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* User Flow */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-4xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">User Flow</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">From capture to insight</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 via-purple-500/20 to-transparent" />

              <div className="space-y-8">
                {userFlow.map((item, i) => (
                  <div key={item.step} className="flex items-start gap-6 pl-4">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xs text-purple-300 -ml-4 z-10">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-light text-white/90 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">{item.step}</h3>
                      <p className="text-sm text-white/50 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* Design Principles */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-4xl mx-auto ${glassCardClass}`}>
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Design Principles</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Guiding philosophy</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="space-y-4">
              {designPrinciples.map((item) => (
                <div key={item.principle} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 p-4 rounded-lg bg-white/[0.03] border border-purple-400/10">
                  <span className="text-purple-300 font-medium min-w-[140px]">{item.principle}</span>
                  <span className="text-white/50 text-sm">{item.implementation}</span>
                </div>
              ))}
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
{`ombrixa/
├── App.tsx                    # Main app orchestration
├── components/
│   ├── CameraScreen.tsx       # Video capture interface
│   ├── CheckInScreen.tsx      # Location verification
│   ├── EventCard.tsx          # Incident display cards
│   ├── FeedScreen.tsx         # Scrollable incident feed
│   ├── MapVisualization.tsx   # Leaflet map view
│   └── QueryPortalScreen.tsx  # Local search interface
├── services/
│   ├── db.ts                  # IndexedDB (Dexie) wrapper
│   ├── geminiService.ts       # Gemini AI integration
│   ├── forensicService.ts     # Optional biometric encryption
│   ├── geo.ts                 # Distance calculations
│   └── syncService.ts         # Optional R2 cloud sync
└── api/
    └── upload-url.ts          # Presigned URL generation`}
            </pre>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* Footer CTA */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className={`max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 ${glassCardClass}`}>
          <div>
            <div className="text-2xl md:text-3xl font-thin tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Try Ombrixa</div>
            <p className="text-sm font-light opacity-70 mt-2 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">No app store required. Install directly from the web.</p>
          </div>
          <a
            href="https://ombrixa.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-10 py-4 bg-transparent overflow-hidden rounded-full transition-all hover:scale-105"
          >
            <div className="absolute inset-0 border border-purple-400/30 rounded-full group-hover:border-purple-400/80 transition-colors duration-500" />
            <div className="absolute inset-0 bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left opacity-20" />
            <span className="relative text-sm font-bold tracking-[0.2em] uppercase">
              Launch Demo
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
