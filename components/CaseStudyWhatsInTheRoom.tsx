import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import Cursor from './Cursor';
import { GlassWindow } from './ui/GlassWindow';
import { WhatsInTheRoomExperiment } from './diagrams/WhatsInTheRoomExperiment';
import { CodebaseTree } from './diagrams/CodebaseTree';

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
  name: 'whats_in_the_room',
  type: 'folder' as const,
  children: [
    {
      name: 'src',
      type: 'folder' as const,
      children: [
        { name: 'core', type: 'folder' as const, desc: 'Geometry primitives' },
        { name: 'generation', type: 'folder' as const, desc: 'Floorplan synthesis' },
        { name: 'rendering', type: 'folder' as const, desc: 'PIL-based visual output' },
        { name: 'inference', type: 'folder' as const, desc: 'NVIDIA NIM API integration' },
        { name: 'storage', type: 'folder' as const, desc: 'Persistence layers' },
        { name: 'analysis', type: 'folder' as const, desc: 'Metrics & visualization' }
      ]
    },
    {
      name: 'outputs',
      type: 'folder' as const,
      children: [
        { name: 'floorplans', type: 'folder' as const, desc: 'Generated layouts (JSON)' },
        { name: 'images', type: 'folder' as const, desc: 'Rendered PNGs' },
        { name: 'predictions', type: 'folder' as const, desc: 'Model responses (Parquet)' }
      ]
    },
    { name: 'main.py', type: 'file' as const, desc: 'Experiment runner' }
  ]
};

// --- EXPANDED CONTENT ---
const HypothesisExpanded = () => (
  <div className="grid md:grid-cols-2 gap-12">
    <div>
      <h3 className="text-xl font-light mb-6">The "Blind Spot" of Vision Models</h3>
      <p className="text-sm font-light opacity-80 leading-relaxed mb-6">
        Current Vision-Language Models (VLMs) are excellent at object detection ("there is a chair") but struggle with
        structural inference ("this room must be a bedroom because it has an attached bath").
      </p>
      <p className="text-sm font-light opacity-80 leading-relaxed">
        This experiment isolates that reasoning capability. By masking a single room in a generated floorplan,
        we force the model to rely entirely on architectural context—adjacency, flow, and regional norms—to deduce the missing label.
      </p>
    </div>
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <h4 className="text-xs font-mono uppercase tracking-widest opacity-50 mb-4">Methodology</h4>
      <ul className="space-y-4 text-sm font-mono">
        <li className="flex justify-between border-b border-white/5 pb-2">
          <span>Generator</span>
          <span className="text-white/70">Wave Function Collapse</span>
        </li>
        <li className="flex justify-between border-b border-white/5 pb-2">
          <span>Dataset</span>
          <span className="text-white/70">10k Synthetic Plans</span>
        </li>
        <li className="flex justify-between border-b border-white/5 pb-2">
          <span>Model</span>
          <span className="text-white/70">Llava-v1.6 / GPT-4V</span>
        </li>
        <li className="flex justify-between pb-2">
          <span>Task</span>
          <span className="text-white/70">Zero-shot Classification</span>
        </li>
      </ul>
    </div>
  </div>
);

const ResultsExpanded = () => (
  <div className="space-y-12">
    <div className="grid md:grid-cols-2 gap-8">
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h4 className="text-xs font-mono uppercase tracking-widest opacity-50 mb-6">Confusion Matrix (Top 5 Rooms)</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="w-24 text-xs font-mono text-right opacity-70">Bathroom</span>
            <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500/60 w-[92%]" />
            </div>
            <span className="w-12 text-xs font-mono text-right">92%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-24 text-xs font-mono text-right opacity-70">Kitchen</span>
            <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500/50 w-[88%]" />
            </div>
            <span className="w-12 text-xs font-mono text-right">88%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-24 text-xs font-mono text-right opacity-70">Garage</span>
            <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500/50 w-[76%]" />
            </div>
            <span className="w-12 text-xs font-mono text-right">76%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-24 text-xs font-mono text-right opacity-70">Bedroom</span>
            <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500/40 w-[65%]" />
            </div>
            <span className="w-12 text-xs font-mono text-right">65%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-24 text-xs font-mono text-right opacity-70">Office</span>
            <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-red-500/40 w-[32%]" />
            </div>
            <span className="w-12 text-xs font-mono text-right">32%</span>
          </div>
        </div>
      </div>

      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h4 className="text-xs font-mono uppercase tracking-widest opacity-50 mb-6">Key Insights</h4>
        <ul className="space-y-4 text-sm font-light opacity-80">
          <li className="flex gap-3">
            <span className="text-green-400">→</span>
            <span>
              <strong>Functional Adjacency:</strong> Models strongly associate bathrooms with bedrooms and kitchens with dining areas.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-yellow-400">→</span>
            <span>
              <strong>Size Bias:</strong> Large undefined rooms are almost always predicted as "Living Room," regardless of position.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-red-400">→</span>
            <span>
              <strong>Ambiguity Failure:</strong> Flexible spaces (Office vs. Guest Room) confuse the model, revealing a lack of subtle cultural context.
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
);

export default function CaseStudyWhatsInTheRoom() {
  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth bg-[#0d0603] text-[#FDFBF7] font-sans selection:bg-[#B06520] selection:text-white">

      <Cursor />

      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
          <GradientBackground />
          <ParticleField />
        </Canvas>
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 p-6 md:p-8 flex justify-between items-center mix-blend-difference">
        <a href="#/" className="text-xs tracking-[0.3em] uppercase opacity-70 hover:opacity-100 transition-opacity font-mono">
          &larr; Walking Stick Labs
        </a>
        <a
          href="https://github.com/basedlsg/WhatsInTheRoom"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-[0.3em] uppercase opacity-70 hover:opacity-100 transition-opacity font-mono"
        >
          View Code &rarr;
        </a>
      </nav>

      <section className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 pt-20 relative z-10 snap-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl"
        >
          <div className="text-[10px] md:text-xs tracking-[0.4em] uppercase opacity-50 mb-6 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)] font-mono">
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
              <span key={tag} className="px-4 py-1.5 border border-white/20 rounded-full text-[10px] tracking-[0.15em] uppercase backdrop-blur-sm bg-black/30 font-mono">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="absolute bottom-12 w-px h-16 bg-gradient-to-b from-white/0 via-white/50 to-white/0 animate-pulse" />
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow
            title="Hypothesis.md"
            path="~/whats-in-the-room/docs"
            summary="Testing if AI can deduce room types from floorplan context alone."
            expandedContent={<HypothesisExpanded />}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">The Question</div>
            <blockquote className="text-2xl md:text-4xl lg:text-5xl font-thin leading-snug tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
              "If you hide one room in a floorplan, can AI figure out what it is just by looking at everything else?"
            </blockquote>
            <p className="text-base md:text-lg font-light opacity-70 mt-10 max-w-2xl leading-relaxed [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">
              Humans use context constantly. A small room next to the master bedroom is probably a closet.
              A room with a door to the outside might be a garage. Can vision-language models
              pick up on these spatial relationships — or do they just see pixels?
            </p>
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-5xl mx-auto w-full">
          <GlassWindow
            title="Experiment_Flow.canvas"
            path="~/whats-in-the-room/design"
            summary="A four-step process: Generate floorplan, Mask room, Query VLM, Evaluate prediction."
            expandedContent={<div className="flex justify-center"><WhatsInTheRoomExperiment /></div>}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">The Experiment</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">How we tested it</h2>

            <WhatsInTheRoomExperiment />
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-5xl mx-auto w-full">
          <GlassWindow
            title="Components.json"
            path="~/whats-in-the-room/src"
            summary="Procedural generation engine, regional architecture rules, and deterministic seed system."
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">The Building Blocks</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">What powers the experiment</h2>

            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Infinite Floorplans</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Procedural generation creates unlimited unique layouts. No external datasets needed —
                  every floorplan is synthesized from architectural rules and regional constraints.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  src/generation/ — layout synthesis
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Regional Architecture</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  US suburbs have attached garages. Chinese apartments have shoe rooms. European flats have different proportions.
                  The generator knows these rules.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  6+ architectural regions
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Deterministic Seeds</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Every experiment is reproducible. Same seed, same floorplan.
                  This lets us isolate variables and trust our results.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  Full reproducibility
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Ambiguity by Design</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  We don't hide obvious rooms. We pick closets, offices, storage rooms —
                  spaces that require reasoning about neighbors and context.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-50">
                  src/inference/ — mystery selection
                </div>
              </motion.div>
            </div>
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-5xl mx-auto w-full">
          <GlassWindow
            title="Results_Analysis.py"
            path="~/whats-in-the-room/analysis"
            summary="Models correctly identified bathrooms and kitchens but struggled with context-dependent rooms like offices."
            expandedContent={<ResultsExpanded />}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">What We Found</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">The numbers tell a story</h2>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16"
            >
              <MetricCard value="1000s" label="Floorplans Tested" />
              <MetricCard value="6+" label="Architectural Regions" />
              <MetricCard value="F1/P/R" label="Per Room Type" />
              <MetricCard value="100%" label="Reproducible" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-2 gap-8"
            >
              <div className="p-6 border border-white/10 rounded-lg bg-white/5">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 mb-4 font-mono">What Models Got Right</div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <span className="opacity-60">Bathrooms</span>
                    <span className="font-mono">High confidence</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Kitchens</span>
                    <span className="font-mono">Size + proximity</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                    <span className="opacity-60">Living rooms</span>
                    <span className="text-white font-mono">Central, large</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-white/10 rounded-lg bg-white/5">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 mb-4 font-mono">Where Models Struggled</div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <span className="opacity-60">Closets vs. Storage</span>
                    <span className="font-mono">Similar size</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Office vs. Guest Bedroom</span>
                    <span className="font-mono">Context-dependent</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                    <span className="opacity-60">Regional variations</span>
                    <span className="text-white font-mono">Cultural norms</span>
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
            path="~/whats-in-the-room"
            summary="Explore the generation, rendering, and inference modules."
            expandedContent={<div className="p-8"><CodebaseTree data={codebaseData} /></div>}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">Structure</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Codebase</h2>

            <CodebaseTree data={codebaseData} />
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-4xl mx-auto text-center w-full">
          <GlassWindow
            title="Reflection.md"
            path="~/whats-in-the-room/thoughts"
            summary="Demonstrating the importance of synthetic benchmarks for testing AI perception."
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">The Bigger Picture</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">What this project represents</h2>
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
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow
            title="Journal.md"
            path="~/personal/notes"
            summary="Reflecting on the nature of intelligence and spatial understanding."
          >
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">Why This Exists</div>
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
          </GlassWindow>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10 snap-start">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow
            title="Terminal"
            path="~/whats-in-the-room"
            summary="Ready to dive in? View the source code on GitHub."
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
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
