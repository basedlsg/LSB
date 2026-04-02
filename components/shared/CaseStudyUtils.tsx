import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Controlled scroll hook — uses scrollend event instead of setTimeout to prevent double-scroll
export const useControlledScroll = (containerRef: React.RefObject<HTMLDivElement>) => {
  const currentSectionIndex = useRef(0);
  const isAnimating = useRef(false);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current || isAnimating.current) return;

    const container = containerRef.current;
    const sections = container.querySelectorAll('[data-section]');
    if (sections.length === 0) return;

    const direction = e.deltaY > 0 ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex.current + direction));
    if (nextIndex === currentSectionIndex.current) return;

    isAnimating.current = true;
    currentSectionIndex.current = nextIndex;
    const targetSection = sections[nextIndex] as HTMLElement;
    container.scrollTo({ top: targetSection.offsetTop, behavior: 'smooth' });
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScrollEnd = () => { isAnimating.current = false; };
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('scrollend', handleScrollEnd);
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('scrollend', handleScrollEnd);
    };
  }, [handleWheel, containerRef]);
};

// Noise functions for shaders
export const noiseFunctions = `
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

vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  float n1 = snoise(p + vec3(e, 0.0, 0.0));
  float n2 = snoise(p - vec3(e, 0.0, 0.0));
  float n3 = snoise(p + vec3(0.0, e, 0.0));
  float n4 = snoise(p - vec3(0.0, e, 0.0));
  float n5 = snoise(p + vec3(0.0, 0.0, e));
  float n6 = snoise(p - vec3(0.0, 0.0, e));
  float x = n3 - n4 - n5 + n6;
  float y = n5 - n6 - n1 + n2;
  float z = n1 - n2 - n3 + n4;
  return normalize(vec3(x, y, z) * (1.0 / (2.0 * e)));
}
`;

// Metric display card
export const MetricCard = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-thin tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">{value}</div>
    <div className="text-[10px] md:text-xs tracking-[0.2em] uppercase opacity-60 mt-2 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)] font-mono">{label}</div>
  </div>
);

// Configurable particle field
export function createParticleField(count: number, particleColor: string) {
  const generatePositions = () => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const r = 2.0 + Math.random() * 0.5;
      positions[idx] = r * Math.cos(theta) * Math.sin(phi);
      positions[idx + 1] = r * Math.sin(theta) * Math.sin(phi);
      positions[idx + 2] = r * Math.cos(phi);
    }
    return positions;
  };

  const vertShader = `
  uniform float uTime;
  varying float vAlpha;
  ${noiseFunctions}
  vec2 rotate(vec2 v, float a) { float s = sin(a); float c = cos(a); return mat2(c, -s, s, c) * v; }
  void main() {
    vec3 pos = position;
    pos.xy = rotate(pos.xy, uTime * 0.02);
    pos.xz = rotate(pos.xz, uTime * 0.015);
    vec3 drift = vec3(snoise(pos*0.3+uTime*0.05), snoise(pos*0.3+uTime*0.06+10.0), snoise(pos*0.3+uTime*0.04+20.0)) * 0.15;
    pos += drift;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (20.0 / -mvPosition.z);
    float sparkle = snoise(pos * 5.0 + uTime * 1.5);
    vAlpha = 0.6 + 0.4 * sparkle;
    vAlpha *= smoothstep(-6.0, 2.0, pos.z);
  }`;

  const fragShader = `
  varying float vAlpha;
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    float glow = exp(-dist * 5.0);
    if (glow < 0.01) discard;
    vec3 color = ${particleColor};
    gl_FragColor = vec4(color, vAlpha * glow * 1.5);
  }`;

  return { generatePositions, vertShader, fragShader, count };
}

// Background shader component factory
export function createGradientBg(fragmentShader: string) {
  const bgVert = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

  const BgComponent = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { viewport } = useThree();
    const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
    useFrame((state) => {
      if (meshRef.current) {
        (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime();
      }
    });
    return (
      <mesh ref={meshRef} position={[0, 0, -5]}>
        <planeGeometry args={[viewport.width * 2.5, viewport.height * 2.5]} />
        <shaderMaterial vertexShader={bgVert} fragmentShader={fragmentShader} uniforms={uniforms} />
      </mesh>
    );
  };

  return BgComponent;
}

// Particle field React component factory
export function createParticleComponent(config: ReturnType<typeof createParticleField>) {
  const ParticleComp = () => {
    const pointsRef = useRef<THREE.Points>(null);
    const positions = useMemo(() => config.generatePositions(), []);
    const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
    useFrame((state) => {
      if (pointsRef.current) {
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime();
      }
    });
    return (
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={config.count} array={positions} itemSize={3} />
        </bufferGeometry>
        <shaderMaterial vertexShader={config.vertShader} fragmentShader={config.fragShader} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    );
  };
  return ParticleComp;
}
