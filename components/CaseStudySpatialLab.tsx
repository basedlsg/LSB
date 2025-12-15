import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import Cursor from './Cursor';
import { GlassWindow } from './ui/GlassWindow';
import { SpatialLabArchitecture } from './diagrams/SpatialLabArchitecture';
import { CodebaseTree } from './diagrams/CodebaseTree';

// Custom hook for controlled scroll - one section at a time
const useControlledScroll = (containerRef: React.RefObject<HTMLDivElement>) => {
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!containerRef.current || isScrolling.current) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    isScrolling.current = true;

    const container = containerRef.current;
    const sections = container.querySelectorAll('.snap-start');
    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;

    // Find current section index
    let currentIndex = 0;
    sections.forEach((section, index) => {
      const sectionTop = (section as HTMLElement).offsetTop;
      if (scrollTop >= sectionTop - viewportHeight / 2) {
        currentIndex = index;
      }
    });

    // Determine target section
    const direction = e.deltaY > 0 ? 1 : -1;
    const targetIndex = Math.max(0, Math.min(sections.length - 1, currentIndex + direction));
    const targetSection = sections[targetIndex] as HTMLElement;

    if (targetSection) {
      container.scrollTo({
        top: targetSection.offsetTop,
        behavior: 'smooth'
      });
    }

    // Reset scrolling flag after animation
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
    }, 800);
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [handleWheel, containerRef]);
};

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
  gl_PointSize = (20.0 / -mvPosition.z);
  float sparkle = snoise(pos * 5.0 + uTime * 1.5);
  vAlpha = 0.6 + 0.4 * sparkle;
  vAlpha *= smoothstep(-6.0, 2.0, pos.z);
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
  gl_FragColor = vec4(color, vAlpha * glow * 1.5);
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

const bgFragmentShader = `
uniform float uTime;
varying vec2 vUv;

${noiseFunctions}

void main() {
  vec2 uv = vUv;
  vec2 center = vec2(0.5);
  float dist = length(uv - center);

  vec3 voidBlack = vec3(0.008, 0.004, 0.012);
  vec3 deepIndigo = vec3(0.03, 0.015, 0.06);
  vec3 warmAmber = vec3(0.15, 0.06, 0.02);
  vec3 emberOrange = vec3(0.2, 0.08, 0.02);
  vec3 cosmicPurple = vec3(0.08, 0.02, 0.12);

  float t = uTime * 0.04;
  float n1 = snoise(vec3(uv * 1.5, t));
  float n2 = snoise(vec3(uv * 3.0 + n1 * 0.4, t * 1.3));
  float n3 = snoise(vec3(uv * 6.0 + n2 * 0.3, t * 0.7));
  float n4 = snoise(vec3(uv * 12.0, t * 0.5));

  float nebula1 = pow(n1 * 0.5 + 0.5, 1.5);
  float nebula2 = pow(n2 * 0.5 + 0.5, 2.0);
  float nebula3 = pow(max(0.0, n3), 3.0);

  vec3 color = mix(voidBlack, deepIndigo, nebula1 * 0.4);
  float warmFlow = smoothstep(0.3, 0.8, dist) * nebula2;
  color = mix(color, warmAmber, warmFlow * 0.5);
  float embers = nebula3 * smoothstep(0.6, 0.3, dist);
  color = mix(color, emberOrange, embers * 0.4);
  float purpleWisp = pow(n2 * 0.5 + 0.5, 2.5) * (1.0 - dist * 0.8);
  color = mix(color, cosmicPurple, purpleWisp * 0.3);
  color += n4 * 0.015;
  float stars = pow(max(0.0, snoise(vec3(uv * 50.0, t * 0.1))), 12.0);
  color += vec3(1.0, 0.95, 0.9) * stars * 0.25;
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

const MetricCard = ({ value, label }: { value: string, label: string }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-thin tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">{value}</div>
    <div className="text-[10px] md:text-xs tracking-[0.2em] uppercase opacity-60 mt-2 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)] font-mono">{label}</div>
  </div>
);

const codebaseData = {
  name: 'spatial_lab',
  type: 'folder' as const,
  children: [
    {
      name: 'environments',
      type: 'folder' as const,
      desc: 'Warehouse simulation',
      children: [
        { name: 'warehouse.py', type: 'file' as const, desc: 'Layout generation, physics' }
      ]
    },
    {
      name: 'coordination',
      type: 'folder' as const,
      desc: 'Multi-agent systems',
      children: [
        { name: 'fleet.py', type: 'file' as const, desc: 'Robot management' },
        { name: 'pathfinding.py', type: 'file' as const, desc: 'A*, collision avoidance' },
        { name: 'communication.py', type: 'file' as const, desc: 'Inter-robot messaging' }
      ]
    },
    {
      name: 'llm',
      type: 'folder' as const,
      desc: 'Language model integration',
      children: [
        { name: 'gemini.py', type: 'file' as const, desc: 'Google Gemini client' },
        { name: 'openai.py', type: 'file' as const, desc: 'GPT-4 client' }
      ]
    },
    {
      name: 'evaluation',
      type: 'folder' as const,
      desc: 'Research framework',
      children: [
        { name: 'metrics.py', type: 'file' as const, desc: 'Performance measurement' },
        { name: 'statistics.py', type: 'file' as const, desc: 'Significance testing' }
      ]
    },
    { name: 'config.py', type: 'file' as const, desc: 'Experiment configuration' }
  ]
};

// --- EXPANDED CONTENT ---
const HypothesisExpanded = () => (
  <div className="grid md:grid-cols-2 gap-12">
    <div>
      <h3 className="text-xl font-light mb-6">Research Context</h3>
      <p className="text-sm font-light opacity-80 leading-relaxed mb-6">
        Traditional robotics relies on SLAM (Simultaneous Localization and Mapping) and explicit geometric planning.
        While robust, these systems lack semantic understanding. They know "obstacle at (x,y)" but not "that is a chair, I should move it."
      </p>
      <p className="text-sm font-light opacity-80 leading-relaxed">
        Large Language Models (LLMs) have demonstrated remarkable reasoning capabilities in text.
        Our hypothesis posits that this reasoning can be grounded in spatial environments without visual training,
        using coordinate-based prompts to build an internal "mental map."
      </p>
    </div>
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <h4 className="text-xs font-mono uppercase tracking-widest opacity-50 mb-4">Experimental Setup</h4>
      <ul className="space-y-4 text-sm font-mono">
        <li className="flex justify-between border-b border-white/5 pb-2">
          <span>Model</span>
          <span className="text-white/70">GPT-4 / Gemini Pro</span>
        </li>
        <li className="flex justify-between border-b border-white/5 pb-2">
          <span>Input</span>
          <span className="text-white/70">JSON Grid State</span>
        </li>
        <li className="flex justify-between border-b border-white/5 pb-2">
          <span>Output</span>
          <span className="text-white/70">Action Vector (x, y)</span>
        </li>
        <li className="flex justify-between pb-2">
          <span>Metric</span>
          <span className="text-white/70">Path Optimality %</span>
        </li>
      </ul>
    </div>
  </div>
);

const ResultsExpanded = () => (
  <div className="space-y-12">
    <div className="grid md:grid-cols-3 gap-6">
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <div className="h-32 flex items-end gap-2 mb-4">
          <div className="w-1/3 bg-white/10 rounded-t-sm h-[30%]" />
          <div className="w-1/3 bg-white/20 rounded-t-sm h-[60%]" />
          <div className="w-1/3 bg-green-500/50 rounded-t-sm h-[85%]" />
        </div>
        <div className="flex justify-between text-[10px] font-mono uppercase opacity-50">
          <span>Random</span>
          <span>Heuristic</span>
          <span>LLM</span>
        </div>
        <div className="mt-4 text-center">
          <div className="text-2xl font-thin">85%</div>
          <div className="text-[10px] uppercase tracking-widest opacity-50">Success Rate</div>
        </div>
      </div>

      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <div className="h-32 flex items-end gap-2 mb-4">
          <div className="w-1/3 bg-white/10 rounded-t-sm h-[40%]" />
          <div className="w-1/3 bg-white/20 rounded-t-sm h-[55%]" />
          <div className="w-1/3 bg-blue-500/50 rounded-t-sm h-[92%]" />
        </div>
        <div className="flex justify-between text-[10px] font-mono uppercase opacity-50">
          <span>Random</span>
          <span>Heuristic</span>
          <span>LLM</span>
        </div>
        <div className="mt-4 text-center">
          <div className="text-2xl font-thin">92%</div>
          <div className="text-[10px] uppercase tracking-widest opacity-50">Collision Avoidance</div>
        </div>
      </div>

      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <div className="h-32 flex items-end gap-2 mb-4">
          <div className="w-1/3 bg-white/10 rounded-t-sm h-[20%]" />
          <div className="w-1/3 bg-white/20 rounded-t-sm h-[45%]" />
          <div className="w-1/3 bg-amber-500/50 rounded-t-sm h-[81%]" />
        </div>
        <div className="flex justify-between text-[10px] font-mono uppercase opacity-50">
          <span>Random</span>
          <span>Heuristic</span>
          <span>LLM</span>
        </div>
        <div className="mt-4 text-center">
          <div className="text-2xl font-thin">81%</div>
          <div className="text-[10px] uppercase tracking-widest opacity-50">Cooperation</div>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-light mb-6">Detailed Analysis</h3>
      <p className="text-sm font-light opacity-80 leading-relaxed max-w-3xl">
        The data reveals a clear hierarchy of capability. While heuristic methods (A*) are optimal for single-agent pathfinding,
        they fail in dynamic multi-agent scenarios without complex conflict resolution logic. The LLM agents, however,
        demonstrated emergent cooperative behavior—waiting for others to pass, choosing alternate routes to avoid congestion—without
        explicit programming. This suggests that "common sense" reasoning from language training transfers to spatial negotiation.
      </p>
    </div>
  </div>
);

export default function CaseStudySpatialLab() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useControlledScroll(scrollContainerRef);

  return (
    <div
      ref={scrollContainerRef}
      className="h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth bg-[#0d0603] text-[#FDFBF7] font-sans selection:bg-[#B06520] selection:text-white"
    >

      <Cursor />

      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
          <GradientBackground />
          <ParticleField />
        </Canvas>
      </div>

      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 p-6 md:p-8 flex justify-between items-center mix-blend-difference"
      >
        <a href="#/" className="group relative text-xs tracking-[0.3em] uppercase opacity-70 hover:opacity-100 transition-opacity font-mono">
          <span>&larr; Walking Stick Labs</span>
          <span className="absolute -bottom-1 left-0 w-0 h-px bg-current transition-all duration-300 group-hover:w-full" />
        </a>
        <a
          href="https://github.com/basedlsg/spatial-lab"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative text-xs tracking-[0.3em] uppercase opacity-70 hover:opacity-100 transition-opacity font-mono"
        >
          <span>View Code &rarr;</span>
          <span className="absolute -bottom-1 left-0 w-0 h-px bg-current transition-all duration-300 group-hover:w-full" />
        </a>
      </motion.nav>

      <section className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 pt-20 relative z-10 snap-start">
        <div className="text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.0, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-[10px] md:text-xs tracking-[0.4em] uppercase opacity-50 mb-6 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)] font-mono"
          >
            Case Study
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: 'blur(15px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tighter leading-[0.9] [text-shadow:_0_2px_30px_rgba(0,0,0,0.9),_0_4px_60px_rgba(0,0,0,0.8)]"
          >
            Spatial Lab
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.0, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl font-light tracking-wide opacity-80 mt-8 max-w-2xl mx-auto [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]"
          >
            Teaching AI to understand space — not through vision, but through reasoning
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap justify-center gap-3 mt-10"
          >
            {['Python', 'AI Research', 'Spatial Intelligence', 'Simulation'].map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.0 + i * 0.1 }}
                className="px-4 py-1.5 border border-white/20 rounded-full text-[10px] tracking-[0.15em] uppercase backdrop-blur-sm bg-black/30 font-mono"
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.5 }}
          className="absolute bottom-12 w-px h-16 bg-gradient-to-b from-white/0 via-white/50 to-white/0 animate-pulse"
        />
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow
            title="Hypothesis.md"
            path="~/spatial-lab/docs"
            summary="Investigating if language models can understand spatial relationships without visual input."
            expandedContent={<HypothesisExpanded />}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">The Question</div>
            <blockquote className="text-2xl md:text-4xl lg:text-5xl font-thin leading-snug tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
              "Can an AI that's only ever read words understand how to move through a room?"
            </blockquote>
            <p className="text-base md:text-lg font-light opacity-70 mt-10 max-w-2xl leading-relaxed [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">
              Language models learn from text alone — they've never walked through a room or moved an object.
              Yet somehow, they can often answer spatial questions correctly. This experiment explores a simple question:
              how far does that understanding actually go?
            </p>
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-5xl mx-auto w-full">
          <GlassWindow
            title="System_Architecture.canvas"
            path="~/spatial-lab/design"
            summary="Visualizing the flow from LLM reasoning to multi-agent simulation."
            expandedContent={<div className="flex justify-center"><SpatialLabArchitecture /></div>}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">System Architecture</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">How it works</h2>

            <SpatialLabArchitecture />
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-5xl mx-auto w-full">
          <GlassWindow
            title="Components.json"
            path="~/spatial-lab/src"
            summary="Core modules: Simulation Environment, Multi-Agent Coordination, and LLM Reasoning Engine."
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">The Building Blocks</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">What powers the experiment</h2>

            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">A World to Live In</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  A simulated grid environment where every position, obstacle, and path is visible.
                  Small enough to hold in your head, detailed enough to reveal meaningful patterns.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  environments/ — simulation engine
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Movement & Coordination</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Multiple agents moving through shared space, avoiding collisions,
                  finding paths, and working together — or getting in each other's way.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  coordination/ — path planning
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">The AI Mind</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Language models (GPT-4, Gemini) receive descriptions of the world and decide how to act.
                  They see coordinates and consequences. Then they choose.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  llm/ — reasoning engine
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Measuring Truth</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Every experiment runs with controls, statistics, and reproducibility.
                  The goal isn't to prove anything — it's to see what's actually there.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  evaluation/ — validation
                </div>
              </motion.div>
            </div>
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-5xl mx-auto w-full">
          <GlassWindow
            title="Results_Dashboard.py"
            path="~/spatial-lab/analysis"
            summary="LLM-guided agents achieved 85% success rate, significantly outperforming baselines."
            expandedContent={<ResultsExpanded />}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">What We Found</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">The numbers tell a story</h2>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16"
            >
              <MetricCard value="85%" label="Found Good Paths" />
              <MetricCard value="92%" label="Avoided Collisions" />
              <MetricCard value="81%" label="Worked Together" />
              <MetricCard value="+18.7%" label="vs. Baseline" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-2 gap-8"
            >
              <div className="p-6 border border-white/10 rounded-lg bg-white/5">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 mb-4 font-mono">Compared to Others</div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <span className="opacity-60">Random (no thinking)</span>
                    <span className="font-mono">30% success</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Simple rules</span>
                    <span className="font-mono">60% success</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                    <span className="opacity-60">With LLM reasoning</span>
                    <span className="text-white font-mono">85% success</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-white/10 rounded-lg bg-white/5">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 mb-4 font-mono">Is it Real?</div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <span className="opacity-60">Without LLM reasoning</span>
                    <span className="font-mono">69.5% avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">With LLM reasoning</span>
                    <span className="font-mono">82.5% avg</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                    <span className="opacity-60">Statistically significant?</span>
                    <span className="text-white font-mono">Yes (p &lt; 0.05)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow
            title="File_Explorer"
            path="~/spatial-lab"
            summary="Browse the project structure: environments, coordination logic, and evaluation scripts."
            expandedContent={<div className="p-8"><CodebaseTree data={codebaseData} /></div>}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">Structure</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Codebase</h2>

            <CodebaseTree data={codebaseData} />
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow
            title="TODO.md"
            path="~/spatial-lab"
            summary="Current limitations include pathfinding optimization and production hardening."
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">Honest Assessment</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Limitations</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)] font-mono">Current State</div>
                <ul className="space-y-3 text-sm font-light opacity-80 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5 font-mono">✓</span>
                    <span>LLM integration framework operational</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5 font-mono">✓</span>
                    <span>Multi-robot coordination validated</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5 font-mono">✓</span>
                    <span>Statistical validation framework</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5 font-mono">✓</span>
                    <span>Reproducible experiment runners</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-6">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)] font-mono">In Progress</div>
                <ul className="space-y-3 text-sm font-light opacity-80 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400 mt-0.5 font-mono">○</span>
                    <span>Full A* pathfinding implementation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400 mt-0.5 font-mono">○</span>
                    <span>Multi-agent conflict resolution</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400 mt-0.5 font-mono">○</span>
                    <span>Automated test coverage</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400 mt-0.5 font-mono">○</span>
                    <span>Production hardening</span>
                  </li>
                </ul>
              </div>
            </div>
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-4xl mx-auto text-center w-full">
          <GlassWindow
            title="Reflection.md"
            path="~/spatial-lab/thoughts"
            summary="This project demonstrates the potential of LLMs to reason about complex physical systems."
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">The Bigger Picture</div>
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
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow
            title="Journal.md"
            path="~/personal/notes"
            summary="Exploring the mechanical sense of 'self' in artificial agents."
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">Why This Exists</div>
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
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow
            title="Terminal"
            path="~/spatial-lab"
            summary="Ready to explore? View the full source code on GitHub."
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
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
                <span className="relative text-sm font-bold tracking-[0.2em] uppercase font-mono">
                  View on GitHub
                </span>
              </a>
            </div>
          </GlassWindow>
        </div>
      </section>

    </div>
  );
}
