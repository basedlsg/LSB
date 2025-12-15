import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import Cursor from './Cursor';
import LiquidGlass from './ui/LiquidGlass';

// --- NOISE FUNCTIONS ---
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
const NUM_ARMS = 5;

const generateParticlePositions = () => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = i * 3;
    const arm = i % NUM_ARMS;
    const armAngle = (arm / NUM_ARMS) * Math.PI * 2;
    const t = Math.pow(Math.random(), 0.6);
    const radius = t * 4.0;
    const spiralTightness = 2.5;
    const angle = armAngle + radius * spiralTightness + (Math.random() - 0.5) * 0.4;
    const spread = radius * 0.15 + 0.05;
    const offsetX = (Math.random() - 0.5) * spread;
    const offsetY = (Math.random() - 0.5) * spread;
    positions[idx] = Math.cos(angle) * radius + offsetX;
    positions[idx + 1] = Math.sin(angle) * radius + offsetY;
    positions[idx + 2] = (Math.random() - 0.5) * 0.5;
  }
  return positions;
};

const particleVertexShader = `
uniform float uTime;
uniform vec2 uMouse;
varying float vAlpha;
varying float vRadius;

${noiseFunctions}

void main() {
  vec3 pos = position;
  float radius = length(pos.xy);
  vRadius = radius;
  float rotationSpeed = 0.15 / (radius + 0.5);
  float angle = atan(pos.y, pos.x) + uTime * rotationSpeed;
  pos.x = cos(angle) * radius;
  pos.y = sin(angle) * radius;
  float pulse = sin(uTime * 0.5 + radius * 0.5) * 0.1;
  pos.xy *= 1.0 + pulse;
  pos.z += sin(angle * 3.0 + uTime * 0.3) * 0.15;
  vec2 mouseWorld = uMouse * 3.0;
  float mouseDist = length(pos.xy - mouseWorld);
  float mouseInfluence = smoothstep(1.5, 0.0, mouseDist);
  pos.xy += normalize(pos.xy - mouseWorld + 0.001) * mouseInfluence * 0.3;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float sparkle = snoise(vec3(pos.xy * 2.0, uTime * 2.0));
  gl_PointSize = (14.0 / -mvPosition.z) * (1.0 + sparkle * 0.4 + mouseInfluence * 0.5);
  vAlpha = 0.6 + 0.4 * sparkle;
  vAlpha *= smoothstep(4.5, 1.0, radius);
  vAlpha *= 0.9 + mouseInfluence * 0.5;
}
`;

const particleFragmentShader = `
varying float vAlpha;
varying float vRadius;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  float glow = exp(-dist * 4.0);
  if (glow < 0.01) discard;
  vec3 coreColor = vec3(1.0, 0.98, 0.92);
  vec3 edgeColor = vec3(1.0, 0.85, 0.65);
  vec3 color = mix(coreColor, edgeColor, smoothstep(0.0, 3.0, vRadius));
  gl_FragColor = vec4(color, vAlpha * glow * 1.5);
}
`;

const FlowingParticleField = ({ mouse }: { mouse: React.MutableRefObject<THREE.Vector2> }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = React.useMemo(() => generateParticlePositions(), []);
  const uniforms = React.useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) }
  }), []);

  useFrame((state) => {
    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.getElapsedTime();
      mat.uniforms.uMouse.value.lerp(mouse.current, 0.05);
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

const bgVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const bgFragmentShader = `
uniform float uTime;
uniform vec2 uMouse;
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
  vec2 mouseUV = uMouse * 0.5 + 0.5;
  float mouseDist = length(uv - mouseUV);
  float mouseGlow = exp(-mouseDist * 3.0) * 0.2;
  color += emberOrange * mouseGlow;
  float stars = pow(max(0.0, snoise(vec3(uv * 50.0, t * 0.1))), 12.0);
  color += vec3(1.0, 0.95, 0.9) * stars * 0.3;
  float vignette = smoothstep(1.2, 0.2, dist);
  color *= 0.5 + vignette * 0.5;
  gl_FragColor = vec4(color, 1.0);
}
`;

const GradientBackground = ({ mouse }: { mouse: React.MutableRefObject<THREE.Vector2> }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const uniforms = React.useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) }
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.getElapsedTime();
      mat.uniforms.uMouse.value.lerp(mouse.current, 0.02);
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

export default function Projects() {
  const mousePos = useRef(new THREE.Vector2(0, 0));

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mousePos.current.set(x, y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0603] text-[#FDFBF7] font-sans selection:bg-[#B06520] selection:text-white">
      <Cursor />

      {/* Particle Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
          <GradientBackground mouse={mousePos} />
          <FlowingParticleField mouse={mousePos} />
        </Canvas>
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 p-6 md:p-8 flex justify-between items-center mix-blend-difference"
      >
        <a href="#/" className="group relative text-xs tracking-[0.3em] uppercase opacity-70 hover:opacity-100 transition-opacity">
          <span>&larr; Walking Stick Labs</span>
          <span className="absolute -bottom-1 left-0 w-0 h-px bg-current transition-all duration-300 group-hover:w-full" />
        </a>
      </motion.nav>

      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 md:px-12 pt-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-3xl"
        >
          <div className="text-[10px] md:text-xs tracking-[0.4em] uppercase opacity-40 mb-6 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
            Research & Experiments
          </div>
          <h1 className="text-5xl md:text-7xl font-thin tracking-tighter leading-[0.9] mb-8 [text-shadow:_0_2px_30px_rgba(0,0,0,0.9),_0_4px_60px_rgba(0,0,0,0.8)]">
            Our Work
          </h1>
          <p className="text-base md:text-lg font-light tracking-wide opacity-60 max-w-xl mx-auto [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
            Honest inquiries into what AI understands — and what it doesn't
          </p>
        </motion.div>
      </section>

      {/* Projects Grid */}
      <section className="relative z-10 px-6 md:px-12 pb-48 md:pb-64">
        <motion.div
          className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2
              }
            }
          }}
        >

          {/* Spatial Lab Card */}
          <motion.div
            className="h-[360px]"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1]
                }
              }
            }}
          >
            <LiquidGlass className="h-full w-full rounded-2xl overflow-hidden" cornerRadius={16} padding="0" displacementScale={1.5} blurAmount={0.01} aberrationIntensity={0.02} elasticity={0.05}>
              <a href="#/work/spatial-lab" className="block h-full relative group">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-colors duration-500 group-hover:bg-black/30" />
                <div className="relative h-full p-6 md:p-8 flex flex-col">
                  <div className="text-[10px] tracking-[0.4em] uppercase opacity-60 mb-4 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                    AI Spatial Reasoning
                  </div>
                  <h3 className="text-2xl md:text-3xl font-thin tracking-tight mb-4 text-white/90 [text-shadow:_0_2px_15px_rgba(0,0,0,0.9)]">
                    Spatial Lab
                  </h3>
                  <p className="text-sm font-light opacity-70 leading-relaxed mb-auto [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                    Teaching AI to understand space — not through vision, but through reasoning.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['Python', 'AI Research', 'Simulation'].map((tag) => (
                      <span key={tag} className="px-2 py-0.5 border border-white/20 bg-white/5 rounded-full text-[8px] tracking-[0.15em] uppercase opacity-70">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs tracking-[0.2em] uppercase opacity-70 group-hover:opacity-100 transition-all duration-500 transform group-hover:translate-x-2">
                    <span className="bg-white/10 px-4 py-2 rounded-full border border-white/10 group-hover:bg-white/20 transition-colors">Explore Project</span>
                  </div>
                </div>
              </a>
            </LiquidGlass>
          </motion.div>

          {/* What's In The Room Card */}
          <motion.div
            className="h-[360px]"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1]
                }
              }
            }}
          >
            <LiquidGlass className="h-full w-full rounded-2xl overflow-hidden" cornerRadius={16} padding="0" displacementScale={1.5} blurAmount={0.01} aberrationIntensity={0.02} elasticity={0.05}>
              <a href="#/work/whats-in-the-room" className="block h-full relative group">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-colors duration-500 group-hover:bg-black/30" />
                <div className="relative h-full p-6 md:p-8 flex flex-col">
                  <div className="text-[10px] tracking-[0.4em] uppercase opacity-60 mb-4 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                    VLM Perception
                  </div>
                  <h3 className="text-2xl md:text-3xl font-thin tracking-tight mb-4 text-white/90 [text-shadow:_0_2px_15px_rgba(0,0,0,0.9)]">
                    What's In The Room
                  </h3>
                  <p className="text-sm font-light opacity-70 leading-relaxed mb-auto [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                    If you hide one room in a floorplan, can AI figure out what it is?
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['Python', 'Vision AI', 'Synthetic Data'].map((tag) => (
                      <span key={tag} className="px-2 py-0.5 border border-white/20 bg-white/5 rounded-full text-[8px] tracking-[0.15em] uppercase opacity-70">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs tracking-[0.2em] uppercase opacity-70 group-hover:opacity-100 transition-all duration-500 transform group-hover:translate-x-2">
                    <span className="bg-white/10 px-4 py-2 rounded-full border border-white/10 group-hover:bg-white/20 transition-colors">Explore Project</span>
                  </div>
                </div>
              </a>
            </LiquidGlass>
          </motion.div>

        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 md:px-12 text-center pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-[9px] md:text-[10px] tracking-[0.3em] opacity-40 uppercase space-y-2"
        >
          <div>San Francisco — CA, Beijing — CN</div>
          <div>&copy; Walking Stick Labs</div>
        </motion.div>
      </footer>
    </div>
  );
}
