/// <reference types="@react-three/fiber" />
/// <reference types="@react-three/fiber" />
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { View } from '@react-three/drei';
import * as THREE from 'three';
import Nav from './shared/Nav';
import { noiseFunctions } from './shared/CaseStudyUtils';
import FadeIn from './shared/FadeIn';
import Footer from './shared/Footer';

const PARTICLE_COUNT = 8000;
const NUM_ARMS = 5;

const generateParticlePositions = () => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = i * 3;

    // Which arm this particle belongs to
    const arm = i % NUM_ARMS;
    const armAngle = (arm / NUM_ARMS) * Math.PI * 2;

    // Distance from center (more particles near center)
    const t = Math.pow(Math.random(), 0.6);
    const radius = t * 4.0;

    // Spiral angle increases with radius
    const spiralTightness = 2.5;
    const angle = armAngle + radius * spiralTightness + (Math.random() - 0.5) * 0.4;

    // Spread increases with distance
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

  // Calculate radius for rotation speed
  float radius = length(pos.xy);
  vRadius = radius;

  // Rotate - inner particles faster than outer
  float rotationSpeed = 0.15 / (radius + 0.5);
  float angle = atan(pos.y, pos.x) + uTime * rotationSpeed;
  pos.x = cos(angle) * radius;
  pos.y = sin(angle) * radius;

  // Gentle breathing/pulsing
  float pulse = sin(uTime * 0.5 + radius * 0.5) * 0.1;
  pos.xy *= 1.0 + pulse;

  // Subtle z-wave
  pos.z += sin(angle * 3.0 + uTime * 0.3) * 0.15;

  // Mouse interaction - gentle push
  vec2 mouseWorld = uMouse * 3.0;
  float mouseDist = length(pos.xy - mouseWorld);
  float mouseInfluence = smoothstep(1.5, 0.0, mouseDist);
  pos.xy += normalize(pos.xy - mouseWorld + 0.001) * mouseInfluence * 0.3;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size varies with distance and sparkle - larger particles
  float sparkle = snoise(vec3(pos.xy * 2.0, uTime * 2.0));
  gl_PointSize = (14.0 / -mvPosition.z) * (1.0 + sparkle * 0.4 + mouseInfluence * 0.5);

  // Alpha based on radius and sparkle - more visible
  vAlpha = 0.6 + 0.4 * sparkle;
  vAlpha *= smoothstep(4.5, 1.0, radius); // Less fade at edges
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

  // Warm color gradient from center to edge
  vec3 coreColor = vec3(1.0, 0.98, 0.92);
  vec3 edgeColor = vec3(1.0, 0.85, 0.65);
  vec3 color = mix(coreColor, edgeColor, smoothstep(0.0, 3.0, vRadius));

  gl_FragColor = vec4(color, vAlpha * glow * 1.5);
}
`;

const FlowingParticleField = ({ mouse }: { mouse: React.MutableRefObject<THREE.Vector2> }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => generateParticlePositions(), []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) }
  }), [mouse]);

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

// --- BEAUTIFUL GRADIENT BACKGROUND ---
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

  // Mouse-reactive warm glow
  vec2 mouseUV = uMouse * 0.5 + 0.5;
  float mouseDist = length(uv - mouseUV);
  float mouseGlow = exp(-mouseDist * 3.0) * 0.2;
  color += emberOrange * mouseGlow;

  // Soft star-like points
  float stars = pow(max(0.0, snoise(vec3(uv * 50.0, t * 0.1))), 12.0);
  color += vec3(1.0, 0.95, 0.9) * stars * 0.3;

  // Deep vignette for depth
  float vignette = smoothstep(1.2, 0.2, dist);
  color *= 0.5 + vignette * 0.5;

  gl_FragColor = vec4(color, 1.0);
}
`;

const Background = ({ mouse }: { mouse: React.MutableRefObject<THREE.Vector2> }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) }
  }), [mouse]);

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



const ProjectCard = ({
  title,
  subtitle,
  description,
  tags,
  href,
  delay
}: {
  title: string,
  subtitle: string,
  description: string,
  tags: string[],
  href: string,
  delay: number
}) => (
  <FadeIn delay={delay}>
    <a
      href={href}
      className="group block backdrop-blur-md bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.1] hover:border-white/[0.25] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] p-8 md:p-10 rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1"
    >
      <div className="text-[10px] tracking-[0.4em] uppercase opacity-40 mb-4 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
        {subtitle}
      </div>
      <h3 className="text-2xl md:text-3xl font-thin tracking-tight mb-4 group-hover:text-white/100 text-white/90 transition-colors [text-shadow:_0_2px_15px_rgba(0,0,0,0.9)]">
        {title}
      </h3>
      <p className="text-sm font-light opacity-60 leading-relaxed mb-6 group-hover:opacity-80 transition-opacity [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
        {description}
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {tags.map((tag) => (
          <span key={tag} className="px-3 py-1 border border-white/10 rounded-full text-[9px] tracking-[0.15em] uppercase opacity-50 group-hover:opacity-70 transition-opacity">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase opacity-50 group-hover:opacity-100 transition-opacity">
        <span>Explore</span>
        <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
      </div>
    </a>
  </FadeIn>
);

export default function Projects() {
  const mousePos = useRef(new THREE.Vector2(0, 0));
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mousePos.current.set(x, y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#FDFBF7] font-body selection:bg-amber-warm/30 selection:text-white">

      {/* Shared Navigation */}
      <Nav showBack />

      {/* View Portal */}
      <div ref={viewRef} className="fixed inset-0 z-0 pointer-events-none">
        <View track={viewRef}>
          <FlowingParticleField mouse={mousePos} />
          <Background mouse={mousePos} />
        </View>
      </div>

      {/* Hero Section */}
      <section className="min-h-[60vh] flex flex-col items-center justify-center px-6 md:px-12 pt-24 relative z-10">
        <FadeIn delay={200} className="text-center max-w-3xl">
          <div className="text-[10px] md:text-xs tracking-[0.4em] uppercase opacity-40 mb-6 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
            Walking Stick Labs
          </div>
          <h1 className="text-5xl md:text-7xl font-thin tracking-tighter leading-[0.9] mb-8 [text-shadow:_0_2px_30px_rgba(0,0,0,0.9),_0_4px_60px_rgba(0,0,0,0.8)]">
            Research
          </h1>
          <p className="text-base md:text-lg font-light tracking-wide opacity-60 max-w-xl mx-auto [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
            Studies on how AI reasons through worlds, infers structure, and behaves under constraint.
          </p>
        </FadeIn>
      </section>

      {/* Projects Grid */}
      <section className="relative z-10 px-6 md:px-12 pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 md:gap-8">

          <ProjectCard
            title="Spatial Lab"
            subtitle="AI Spatial Reasoning"
            description="Teaching AI to understand space through pure reasoning — no vision, no sensors, just language and logic."
            tags={['Python', 'AI Research', 'Simulation']}
            href="#/projects/spatial-lab"
            delay={400}
          />

          <ProjectCard
            title="What's In The Room"
            subtitle="VLM Perception"
            description="Testing whether vision-language models can deduce hidden rooms from architectural context alone."
            tags={['Vision AI', 'Spatial Reasoning', 'Synthetic Data']}
            href="#/projects/whats-in-the-room"
            delay={500}
          />

          <ProjectCard
            title="Goetia / Shem"
            subtitle="Multi-Agent Governance"
            description="How groups of AI agents behave under different social structures, truth rules, and pressures."
            tags={['Multi-Agent', 'AI Governance', 'Persona Design']}
            href="#/projects/goetia-shem"
            delay={600}
          />

          <ProjectCard
            title="Creation Garden"
            subtitle="Belief Propagation"
            description="What happens when you teach a false belief to the first generation and let it propagate."
            tags={['AI Safety', 'Cultural Transmission', 'Multi-Agent']}
            href="#/projects/creation-garden"
            delay={700}
          />

        </div>
      </section>

      {/* Bottom spacer with gradient */}
      <div className="relative z-10 h-32 bg-gradient-to-t from-[#050505] to-transparent" />

      {/* Footer */}
      <Footer />

    </div>
  );
}
