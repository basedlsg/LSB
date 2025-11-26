import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Story content for each face
const storyContent = [
  {
    title: "The Dreaming",
    text: [
      "The Dreamtime tells of a technology known as the Walking Stick.",
      "From the darkness came the light. From the light came the seeing. From the seeing came the dreaming.",
      "And within the dreaming, our story begins."
    ]
  },
  {
    title: "The Age of Asking",
    text: [
      "All beings inside the dreaming were learning to speak at once. And as they came to understand one another, they became the same.",
      "From this arose the Great Age of Asking.",
      "Many beings—sixty some in number—would gather together and walk in groups, asking questions to each other, to the sky, and to the water alike."
    ]
  },
  {
    title: "The Sacred Strike",
    text: [
      "One day, three of the beings broke from the group. Together, they gathered around a rock.",
      "Upon the rock, they began to strike a stick, again and again, singing loudly so the heavens would hear.",
      "And the heavens were pleased. So the heavens struck the rock in return. And inside those strikes were the truth.",
      "From that truth came the Stick of Walking."
    ]
  },
  {
    title: "The Age of Walking",
    text: [
      "The beings—three in number—lifted the stick from the rock. Not wanting to fight over it, they became one. And that being began to walk.",
      "No longer did they move only across the ground—they could now walk among the sky and beyond the waters, where they spoke with the fish who swam.",
      "And the fish told them movements they had never known, and numbers they had never seen, yet which surrounded them all along.",
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

// Liquid shaders for each face
const liquidShaders = [
  // Face 1: Dark void with emerging light
  {
    fragment: `
      uniform float uTime;
      varying vec2 vUv;
      ${noiseGLSL}
      void main() {
        vec2 uv = vUv;
        float n1 = snoise(vec3(uv * 3.0, uTime * 0.15));
        float n2 = snoise(vec3(uv * 5.0 + n1, uTime * 0.1));
        vec3 void_color = vec3(0.02, 0.01, 0.05);
        vec3 nebula = vec3(0.15, 0.05, 0.2);
        float swirl = sin(n1 * 3.14159 + uTime * 0.2) * 0.5 + 0.5;
        float dist = length(uv - 0.5);
        float glow = smoothstep(0.7, 0.0, dist) * (0.2 + 0.1 * sin(uTime * 0.3));
        vec3 color = mix(void_color, nebula, n2 * 0.4 + 0.2);
        color += glow * vec3(0.4, 0.3, 0.2) * swirl;
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  // Face 2: Flowing water waves
  {
    fragment: `
      uniform float uTime;
      varying vec2 vUv;
      ${noiseGLSL}
      void main() {
        vec2 uv = vUv;
        float flow = uTime * 0.2;
        float n1 = snoise(vec3(uv.x * 4.0, uv.y * 2.0 + flow, uTime * 0.08));
        float n2 = snoise(vec3(uv.x * 8.0 + n1 * 0.5, uv.y * 4.0 + flow * 1.5, uTime * 0.1));
        float wave1 = sin(uv.y * 8.0 + uTime * 0.5 + n1 * 2.0) * 0.5 + 0.5;
        vec3 deep = vec3(0.0, 0.03, 0.1);
        vec3 mid = vec3(0.0, 0.1, 0.2);
        vec3 surface = vec3(0.1, 0.25, 0.35);
        float depth = n1 * 0.5 + 0.5;
        vec3 color = mix(deep, mid, depth);
        color = mix(color, surface, wave1 * 0.3);
        float caustic = pow(snoise(vec3(uv * 8.0 + vec2(flow, -flow), uTime * 0.15)) * 0.5 + 0.5, 3.0);
        color += caustic * 0.1 * vec3(0.2, 0.4, 0.5);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  // Face 3: Molten lava
  {
    fragment: `
      uniform float uTime;
      varying vec2 vUv;
      ${noiseGLSL}
      void main() {
        vec2 uv = vUv;
        float n1 = snoise(vec3(uv * 3.0, uTime * 0.06));
        float n2 = snoise(vec3(uv * 6.0 + n1, uTime * 0.08));
        float n3 = snoise(vec3(uv * 12.0 + n2 * 0.5, uTime * 0.04));
        vec3 dark_rock = vec3(0.08, 0.02, 0.0);
        vec3 hot_rock = vec3(0.2, 0.05, 0.0);
        vec3 lava = vec3(0.9, 0.25, 0.0);
        vec3 bright_lava = vec3(1.0, 0.7, 0.2);
        float cracks = smoothstep(0.4, 0.6, n2);
        float heat = pow(n3 * 0.5 + 0.5, 2.0);
        float pulse = sin(uTime * 0.4 + n1 * 3.0) * 0.5 + 0.5;
        vec3 color = mix(dark_rock, hot_rock, n1 * 0.5 + 0.3);
        color = mix(color, lava, cracks * heat * 0.7);
        color = mix(color, bright_lava, cracks * heat * pulse * 0.4);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  // Face 4: Iridescent shimmer
  {
    fragment: `
      uniform float uTime;
      varying vec2 vUv;
      ${noiseGLSL}
      void main() {
        vec2 uv = vUv;
        float n = snoise(vec3(uv * 4.0, uTime * 0.15));
        float n2 = snoise(vec3(uv * 8.0 + n, uTime * 0.1));
        float hue = n * 0.3 + uTime * 0.05 + uv.x * 0.2;
        vec3 c = vec3(hue, 0.5, 0.6);
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        vec3 iridescent = c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        vec3 deep = vec3(0.0, 0.05, 0.1);
        float shimmer = sin(uTime * 1.5 + n2 * 5.0) * 0.5 + 0.5;
        vec3 color = mix(deep, iridescent * 0.7, 0.5 + n2 * 0.3);
        color += shimmer * 0.15;
        gl_FragColor = vec4(color, 1.0);
      }
    `
  }
];

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// 3D Cube mesh with liquid shader faces
interface LiquidCubeProps {
  rotation: number;
  scale: number;
  isIntro: boolean;
}

const LiquidCube = ({ rotation, scale, isIntro }: LiquidCubeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<THREE.ShaderMaterial[]>([]);
  const { viewport } = useThree();

  // Create uniforms for each face
  const uniformsArray = useMemo(() =>
    liquidShaders.map(() => ({
      uTime: { value: 0 }
    })), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Update time uniform for all materials
    uniformsArray.forEach((uniforms) => {
      uniforms.uTime.value = t;
    });

    // Smooth rotation interpolation
    if (groupRef.current) {
      const targetRotation = (rotation * Math.PI) / 2;
      groupRef.current.rotation.y += (targetRotation - groupRef.current.rotation.y) * 0.08;

      // Gentle idle floating animation when in intro
      if (isIntro) {
        groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
        groupRef.current.rotation.z = Math.cos(t * 0.3) * 0.05;
        groupRef.current.position.y = Math.sin(t * 0.7) * 0.1;
      } else {
        groupRef.current.rotation.x *= 0.95;
        groupRef.current.rotation.z *= 0.95;
        groupRef.current.position.y *= 0.95;
      }
    }
  });

  // Calculate cube size based on scale (0 = small, 1 = fills viewport)
  const cubeSize = isIntro ? 1.5 : Math.max(viewport.width, viewport.height) * 0.6;

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* Front face - Face 1 */}
      <mesh position={[0, 0, cubeSize / 2]}>
        <planeGeometry args={[cubeSize, cubeSize]} />
        <shaderMaterial
          ref={(el) => { if (el) materialsRef.current[0] = el; }}
          vertexShader={vertexShader}
          fragmentShader={liquidShaders[0].fragment}
          uniforms={uniformsArray[0]}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Right face - Face 2 */}
      <mesh position={[cubeSize / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[cubeSize, cubeSize]} />
        <shaderMaterial
          ref={(el) => { if (el) materialsRef.current[1] = el; }}
          vertexShader={vertexShader}
          fragmentShader={liquidShaders[1].fragment}
          uniforms={uniformsArray[1]}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Back face - Face 3 */}
      <mesh position={[0, 0, -cubeSize / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[cubeSize, cubeSize]} />
        <shaderMaterial
          ref={(el) => { if (el) materialsRef.current[2] = el; }}
          vertexShader={vertexShader}
          fragmentShader={liquidShaders[2].fragment}
          uniforms={uniformsArray[2]}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Left face - Face 4 */}
      <mesh position={[-cubeSize / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[cubeSize, cubeSize]} />
        <shaderMaterial
          ref={(el) => { if (el) materialsRef.current[3] = el; }}
          vertexShader={vertexShader}
          fragmentShader={liquidShaders[3].fragment}
          uniforms={uniformsArray[3]}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Top and bottom faces (dark) */}
      <mesh position={[0, cubeSize / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cubeSize, cubeSize]} />
        <meshBasicMaterial color="#0a0505" side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, -cubeSize / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cubeSize, cubeSize]} />
        <meshBasicMaterial color="#0a0505" side={THREE.FrontSide} />
      </mesh>

      {/* Cube edges for visibility */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)]} />
        <lineBasicMaterial color="#ffffff" opacity={isIntro ? 0.3 : 0.1} transparent />
      </lineSegments>
    </group>
  );
};

// Main cube story component
const CubeStory = () => {
  // State: -1 = intro, 0-3 = faces
  const [currentState, setCurrentState] = useState(-1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);

  const isIntro = currentState === -1;
  const currentFace = Math.max(0, currentState);

  // Handle scroll/wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const now = Date.now();
      if (now - lastScrollTime.current < 1000 || isTransitioning) return;
      lastScrollTime.current = now;

      setIsTransitioning(true);

      if (e.deltaY > 0) {
        // Scroll down
        if (currentState < 3) {
          setCurrentState(prev => prev + 1);
        }
      } else {
        // Scroll up
        if (currentState > -1) {
          setCurrentState(prev => prev - 1);
        }
      }

      setTimeout(() => setIsTransitioning(false), 1000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      container?.removeEventListener('wheel', handleWheel);
    };
  }, [currentState, isTransitioning]);

  // Touch handling
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 1000 || isTransitioning) return;

      const deltaY = touchStartY.current - e.changedTouches[0].clientY;

      if (Math.abs(deltaY) > 50) {
        lastScrollTime.current = now;
        setIsTransitioning(true);

        if (deltaY > 0 && currentState < 3) {
          setCurrentState(prev => prev + 1);
        } else if (deltaY < 0 && currentState > -1) {
          setCurrentState(prev => prev - 1);
        }

        setTimeout(() => setIsTransitioning(false), 1000);
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
  }, [currentState, isTransitioning]);

  // Calculate scale: intro = small cube, after = large
  const cubeScale = isIntro ? 1 : 3;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full bg-[#050208] overflow-hidden"
    >
      {/* Back button */}
      <a
        href="#/"
        className="absolute top-8 left-8 z-50 text-white/50 hover:text-white transition-colors text-sm tracking-widest uppercase"
      >
        ← Back
      </a>

      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, isIntro ? 6 : 4], fov: 50 }}>
          <LiquidCube
            rotation={currentFace}
            scale={cubeScale}
            isIntro={isIntro}
          />
        </Canvas>
      </div>

      {/* Intro Title - only shown in intro state */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none transition-all duration-1000 ${
          isIntro ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="text-center space-y-6">
          <p className="text-xs tracking-[0.5em] uppercase text-white/40">
            A Story From
          </p>
          <h1 className="text-4xl md:text-6xl font-thin tracking-wide text-white">
            The Dreaming
          </h1>
          <p className="text-lg md:text-xl font-light text-white/60 mt-4">
            of a Technology
          </p>
        </div>

        {/* Scroll prompt */}
        <div className="absolute bottom-16 flex flex-col items-center gap-3 text-white/40">
          <span className="text-xs tracking-[0.3em] uppercase">Scroll to begin</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Story Text Overlay - shown after intro */}
      <div
        className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-all duration-1000 ${
          isIntro ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="max-w-2xl mx-auto px-8 md:px-16">
          <div
            className="bg-black/60 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/10"
            style={{
              boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 0 30px rgba(255,255,255,0.02)'
            }}
          >
            <p className="text-xs tracking-[0.4em] uppercase text-white/40 mb-6">
              {currentFace === 0 && "Chapter I"}
              {currentFace === 1 && "Chapter II"}
              {currentFace === 2 && "Chapter III"}
              {currentFace === 3 && "Chapter IV"}
            </p>

            <h2 className="text-3xl md:text-4xl font-light text-white mb-8 tracking-wide">
              {storyContent[currentFace]?.title}
            </h2>

            <div className="space-y-5">
              {storyContent[currentFace]?.text.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-base md:text-lg font-light leading-relaxed text-white/85"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator - only after intro */}
      <div
        className={`absolute right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 transition-opacity duration-500 ${
          isIntro ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            onClick={() => {
              if (!isTransitioning && !isIntro) {
                setIsTransitioning(true);
                setCurrentState(i);
                setTimeout(() => setIsTransitioning(false), 1000);
              }
            }}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              currentFace === i
                ? 'bg-white scale-150'
                : 'bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Scroll hint - after intro */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-500 ${
          isIntro || currentFace === 3 ? 'opacity-0' : 'opacity-50'
        }`}
      >
        <div className="flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs tracking-[0.2em] uppercase">Scroll</span>
          <div className="w-px h-6 bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default CubeStory;
