import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Story content for each face
const storyContent = [
  {
    title: "The Dreaming",
    subtitle: "From Darkness to Light",
    text: [
      "The Dreamtime tells of a technology known as the Walking Stick.",
      "From the darkness came the light. From the light came the seeing. From the seeing came the dreaming.",
      "And within the dreaming, our story begins."
    ]
  },
  {
    title: "The Age of Asking",
    subtitle: "When Beings Learned to Speak",
    text: [
      "All beings inside the dreaming were learning to speak at once. And as they came to understand one another, they became the same.",
      "From this arose the Great Age of Asking.",
      "Many beings—sixty some in number—would gather together and walk in groups, asking questions to each other, to the sky, and to the water alike."
    ]
  },
  {
    title: "The Sacred Strike",
    subtitle: "Birth of the Walking Stick",
    text: [
      "One day, three of the beings broke from the group. Together, they gathered around a rock.",
      "Upon the rock, they began to strike a stick, again and again, singing loudly so the heavens would hear.",
      "And the heavens were pleased. So the heavens struck the rock in return. And inside those strikes were the truth.",
      "From that truth came the Stick of Walking."
    ]
  },
  {
    title: "The Age of Walking",
    subtitle: "Beyond the Ground",
    text: [
      "The beings—three in number—lifted the stick from the rock. Not wanting to fight over it, they became one. And that being began to walk.",
      "No longer did they move only across the ground—they could now walk among the sky and beyond the waters, where they spoke with the fish who swam.",
      "From the Age of Walking came the great Age of Technology, which still persists today.",
      "And as the Dreaming is eternal, its ages belong equally to the child and to the old man alike."
    ]
  }
];

// Noise functions for shaders
const noiseGLSL = `
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

// Liquid shader for Face 1: Dark void with emerging light
const liquidShader1 = {
  vertex: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: `
    uniform float uTime;
    varying vec2 vUv;
    ${noiseGLSL}

    void main() {
      vec2 uv = vUv;

      // Dark swirling void
      float n1 = snoise(vec3(uv * 3.0, uTime * 0.2));
      float n2 = snoise(vec3(uv * 5.0 + n1, uTime * 0.15));
      float n3 = snoise(vec3(uv * 8.0 + n2, uTime * 0.1));

      // Deep space colors
      vec3 void_color = vec3(0.02, 0.01, 0.05);
      vec3 nebula = vec3(0.1, 0.02, 0.15);
      vec3 light = vec3(0.9, 0.7, 0.5);

      // Swirling patterns
      float swirl = sin(n1 * 3.14159 + uTime * 0.3) * 0.5 + 0.5;

      // Light emerging from center
      float dist = length(uv - 0.5);
      float glow = smoothstep(0.6, 0.0, dist) * (0.3 + 0.2 * sin(uTime * 0.5));

      vec3 color = mix(void_color, nebula, n2 * 0.5 + 0.3);
      color = mix(color, light, glow * swirl * 0.4);

      // Add subtle stars
      float stars = step(0.98, snoise(vec3(uv * 50.0, 0.0)));
      color += stars * 0.5;

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

// Liquid shader for Face 2: Flowing water waves
const liquidShader2 = {
  vertex: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: `
    uniform float uTime;
    varying vec2 vUv;
    ${noiseGLSL}

    void main() {
      vec2 uv = vUv;

      // Flowing water effect
      float flow = uTime * 0.3;
      float n1 = snoise(vec3(uv.x * 4.0, uv.y * 2.0 + flow, uTime * 0.1));
      float n2 = snoise(vec3(uv.x * 8.0 + n1 * 0.5, uv.y * 4.0 + flow * 1.5, uTime * 0.15));

      // Wave pattern
      float wave1 = sin(uv.y * 10.0 + uTime + n1 * 2.0) * 0.5 + 0.5;
      float wave2 = sin(uv.y * 15.0 - uTime * 0.7 + n2 * 2.0) * 0.5 + 0.5;

      // Water colors
      vec3 deep = vec3(0.0, 0.05, 0.15);
      vec3 mid = vec3(0.0, 0.15, 0.3);
      vec3 surface = vec3(0.2, 0.4, 0.5);
      vec3 foam = vec3(0.6, 0.7, 0.8);

      float depth = n1 * 0.5 + 0.5;
      vec3 color = mix(deep, mid, depth);
      color = mix(color, surface, wave1 * 0.4);
      color = mix(color, foam, wave2 * wave1 * 0.3);

      // Caustics effect
      float caustic = snoise(vec3(uv * 10.0 + vec2(flow, -flow), uTime * 0.2));
      caustic = pow(caustic * 0.5 + 0.5, 3.0);
      color += caustic * 0.15 * vec3(0.3, 0.5, 0.6);

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

// Liquid shader for Face 3: Molten/lava effect
const liquidShader3 = {
  vertex: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: `
    uniform float uTime;
    varying vec2 vUv;
    ${noiseGLSL}

    void main() {
      vec2 uv = vUv;

      // Slow moving lava
      float n1 = snoise(vec3(uv * 3.0, uTime * 0.08));
      float n2 = snoise(vec3(uv * 6.0 + n1, uTime * 0.12));
      float n3 = snoise(vec3(uv * 12.0 + n2 * 0.5, uTime * 0.05));

      // Lava colors
      vec3 dark_rock = vec3(0.1, 0.02, 0.0);
      vec3 hot_rock = vec3(0.3, 0.05, 0.0);
      vec3 lava = vec3(1.0, 0.3, 0.0);
      vec3 bright_lava = vec3(1.0, 0.8, 0.2);

      // Cracks pattern
      float cracks = smoothstep(0.4, 0.6, n2);
      float heat = pow(n3 * 0.5 + 0.5, 2.0);

      // Pulsing glow
      float pulse = sin(uTime * 0.5 + n1 * 3.0) * 0.5 + 0.5;

      vec3 color = mix(dark_rock, hot_rock, n1 * 0.5 + 0.3);
      color = mix(color, lava, cracks * heat);
      color = mix(color, bright_lava, cracks * heat * pulse * 0.5);

      // Add emissive glow in cracks
      float glow = cracks * heat * (0.5 + 0.5 * pulse);
      color += vec3(0.5, 0.1, 0.0) * glow;

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

// Liquid shader for Face 4: Iridescent fish-scale shimmer
const liquidShader4 = {
  vertex: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: `
    uniform float uTime;
    varying vec2 vUv;
    ${noiseGLSL}

    void main() {
      vec2 uv = vUv;

      // Scale pattern
      vec2 scaledUV = uv * 15.0;
      vec2 cell = floor(scaledUV);
      vec2 local = fract(scaledUV);

      // Offset every other row
      if (mod(cell.y, 2.0) > 0.5) {
        local.x = fract(local.x + 0.5);
      }

      // Scale shape
      float dist = length(local - 0.5);
      float scale = smoothstep(0.5, 0.3, dist);

      // Iridescent colors based on angle and time
      float angle = atan(local.y - 0.5, local.x - 0.5);
      float n = snoise(vec3(cell * 0.5, uTime * 0.2));

      float hue = angle / 6.28318 + uTime * 0.1 + n * 0.3 + cell.x * 0.1;

      // HSV to RGB conversion
      vec3 c = vec3(hue, 0.6, 0.8);
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      vec3 iridescent = c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);

      // Deep water base
      vec3 deep = vec3(0.0, 0.1, 0.2);

      // Shimmer effect
      float shimmer = sin(uTime * 2.0 + cell.x * 0.5 + cell.y * 0.3 + n * 5.0) * 0.5 + 0.5;

      vec3 color = mix(deep, iridescent, scale * 0.7);
      color += shimmer * scale * 0.2;

      // Add subtle movement
      float flow = snoise(vec3(uv * 3.0, uTime * 0.3));
      color = mix(color, color * 1.2, flow * 0.2);

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

// Individual liquid background component
interface LiquidBackgroundProps {
  shaderType: number;
}

const LiquidBackground = ({ shaderType }: LiquidBackgroundProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const shaders = [liquidShader1, liquidShader2, liquidShader3, liquidShader4];
  const shader = shaders[shaderType] || shaders[0];

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
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        vertexShader={shader.vertex}
        fragmentShader={shader.fragment}
        uniforms={uniforms}
      />
    </mesh>
  );
};

// Face component with text overlay
interface CubeFaceProps {
  faceIndex: number;
  isActive: boolean;
}

const CubeFace = ({ faceIndex, isActive }: CubeFaceProps) => {
  const content = storyContent[faceIndex];

  return (
    <div className="absolute inset-0 w-full h-full backface-hidden">
      {/* WebGL Background */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <LiquidBackground shaderType={faceIndex} />
        </Canvas>
      </div>

      {/* Text Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-16">
        <div className="max-w-2xl text-center space-y-8 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9),_0_4px_40px_rgba(0,0,0,0.7)]">
          <p className="text-xs font-bold tracking-[0.4em] uppercase opacity-60">
            {content.subtitle}
          </p>
          <h2 className="text-4xl md:text-6xl font-thin tracking-tight">
            {content.title}
          </h2>
          <div className="space-y-4">
            {content.text.map((paragraph, i) => (
              <p key={i} className="text-sm md:text-base font-light leading-relaxed opacity-90">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main cube component
const CubeStory = () => {
  const [currentFace, setCurrentFace] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);

  // Handle scroll/wheel to rotate cube
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const now = Date.now();
      if (now - lastScrollTime.current < 800 || isTransitioning) return;
      lastScrollTime.current = now;

      setIsTransitioning(true);

      if (e.deltaY > 0 && currentFace < 3) {
        setCurrentFace(prev => prev + 1);
      } else if (e.deltaY < 0 && currentFace > 0) {
        setCurrentFace(prev => prev - 1);
      }

      setTimeout(() => setIsTransitioning(false), 800);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      container?.removeEventListener('wheel', handleWheel);
    };
  }, [currentFace, isTransitioning]);

  // Touch handling for mobile
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 800 || isTransitioning) return;

      const deltaY = touchStartY.current - e.changedTouches[0].clientY;

      if (Math.abs(deltaY) > 50) {
        lastScrollTime.current = now;
        setIsTransitioning(true);

        if (deltaY > 0 && currentFace < 3) {
          setCurrentFace(prev => prev + 1);
        } else if (deltaY < 0 && currentFace > 0) {
          setCurrentFace(prev => prev - 1);
        }

        setTimeout(() => setIsTransitioning(false), 800);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      container?.removeEventListener('touchstart', handleTouchStart);
      container?.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentFace, isTransitioning]);

  // Calculate cube rotation
  const rotation = currentFace * -90;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full bg-black overflow-hidden"
      style={{ perspective: '1500px' }}
    >
      {/* Back button */}
      <a
        href="/"
        className="absolute top-8 left-8 z-50 text-white/60 hover:text-white transition-colors text-sm tracking-widest uppercase"
      >
        &larr; Back
      </a>

      {/* Progress indicator */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true);
                setCurrentFace(i);
                setTimeout(() => setIsTransitioning(false), 800);
              }
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentFace === i
                ? 'bg-white scale-150'
                : 'bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Cube container */}
      <div
        className="w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: `translateZ(-50vh) rotateX(${rotation}deg)`,
          transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Face 1 - Front */}
        <div
          className="absolute w-full h-full"
          style={{
            transform: 'rotateX(0deg) translateZ(50vh)',
            backfaceVisibility: 'hidden'
          }}
        >
          <CubeFace faceIndex={0} isActive={currentFace === 0} />
        </div>

        {/* Face 2 - Bottom (rotated up) */}
        <div
          className="absolute w-full h-full"
          style={{
            transform: 'rotateX(90deg) translateZ(50vh)',
            backfaceVisibility: 'hidden'
          }}
        >
          <CubeFace faceIndex={1} isActive={currentFace === 1} />
        </div>

        {/* Face 3 - Back */}
        <div
          className="absolute w-full h-full"
          style={{
            transform: 'rotateX(180deg) translateZ(50vh)',
            backfaceVisibility: 'hidden'
          }}
        >
          <CubeFace faceIndex={2} isActive={currentFace === 2} />
        </div>

        {/* Face 4 - Top (rotated down) */}
        <div
          className="absolute w-full h-full"
          style={{
            transform: 'rotateX(270deg) translateZ(50vh)',
            backfaceVisibility: 'hidden'
          }}
        >
          <CubeFace faceIndex={3} isActive={currentFace === 3} />
        </div>
      </div>

      {/* Scroll hint */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-500 ${currentFace === 3 ? 'opacity-0' : 'opacity-60'}`}>
        <div className="flex flex-col items-center gap-2 text-white/60">
          <span className="text-xs tracking-widest uppercase">Scroll to continue</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/60 to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default CubeStory;
