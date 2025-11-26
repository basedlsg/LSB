import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
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

// Create fragment shaders for each face
const createFragmentShader = (faceIndex: number) => {
  const shaderBodies = [
    // Face 0: Dark void with emerging light (purple/gold nebula)
    `
      float n1 = snoise(vec3(vUv * 2.5, uTime * 0.12));
      float n2 = snoise(vec3(vUv * 4.0 + n1 * 0.5, uTime * 0.08));
      float n3 = snoise(vec3(vUv * 8.0, uTime * 0.15));

      vec3 void_color = vec3(0.03, 0.01, 0.08);
      vec3 nebula1 = vec3(0.2, 0.05, 0.3);
      vec3 nebula2 = vec3(0.4, 0.2, 0.1);

      float swirl = sin(n1 * 4.0 + uTime * 0.2) * 0.5 + 0.5;
      float glow = smoothstep(0.8, 0.0, length(vUv - 0.5)) * (0.3 + 0.2 * sin(uTime * 0.4));

      vec3 color = mix(void_color, nebula1, n2 * 0.6);
      color = mix(color, nebula2, swirl * glow * 0.5);
      color += n3 * 0.05;

      // Stars
      float stars = pow(snoise(vec3(vUv * 40.0, 0.0)), 8.0) * 2.0;
      color += stars;
    `,
    // Face 1: Flowing water with depth
    `
      float flow = uTime * 0.15;
      float n1 = snoise(vec3(vUv.x * 3.0, vUv.y * 2.0 + flow, uTime * 0.06));
      float n2 = snoise(vec3(vUv.x * 6.0 + n1 * 0.3, vUv.y * 3.0 + flow * 1.2, uTime * 0.08));
      float n3 = snoise(vec3(vUv * 12.0 + flow, uTime * 0.1));

      float wave1 = sin(vUv.y * 6.0 + uTime * 0.4 + n1 * 2.0) * 0.5 + 0.5;
      float wave2 = sin(vUv.x * 8.0 - uTime * 0.3 + n2 * 1.5) * 0.5 + 0.5;

      vec3 deep = vec3(0.0, 0.02, 0.08);
      vec3 mid = vec3(0.0, 0.08, 0.18);
      vec3 surface = vec3(0.1, 0.2, 0.35);
      vec3 highlight = vec3(0.3, 0.5, 0.6);

      vec3 color = mix(deep, mid, n1 * 0.5 + 0.4);
      color = mix(color, surface, wave1 * 0.4);
      color = mix(color, highlight, wave2 * wave1 * n3 * 0.3);

      // Caustics
      float caustic = pow(max(0.0, snoise(vec3(vUv * 10.0 + flow, uTime * 0.12))), 3.0);
      color += caustic * 0.15 * vec3(0.2, 0.4, 0.5);
    `,
    // Face 2: Molten lava with glowing cracks
    `
      float n1 = snoise(vec3(vUv * 2.5, uTime * 0.05));
      float n2 = snoise(vec3(vUv * 5.0 + n1 * 0.4, uTime * 0.07));
      float n3 = snoise(vec3(vUv * 10.0 + n2 * 0.3, uTime * 0.03));

      vec3 dark_rock = vec3(0.06, 0.02, 0.01);
      vec3 hot_rock = vec3(0.15, 0.04, 0.01);
      vec3 lava = vec3(1.0, 0.35, 0.0);
      vec3 bright_lava = vec3(1.0, 0.8, 0.3);

      float cracks = smoothstep(0.35, 0.65, n2);
      float heat = pow(max(0.0, n3 * 0.5 + 0.5), 1.5);
      float pulse = sin(uTime * 0.3 + n1 * 4.0) * 0.5 + 0.5;

      vec3 color = mix(dark_rock, hot_rock, n1 * 0.5 + 0.4);
      color = mix(color, lava, cracks * heat * 0.8);
      color = mix(color, bright_lava, cracks * heat * pulse * 0.5);

      // Emissive glow
      color += cracks * heat * vec3(0.4, 0.1, 0.0) * (0.5 + pulse * 0.5);
    `,
    // Face 3: Iridescent fish-scale shimmer
    `
      float n1 = snoise(vec3(vUv * 3.0, uTime * 0.1));
      float n2 = snoise(vec3(vUv * 6.0 + n1 * 0.3, uTime * 0.08));

      // Create scale pattern
      vec2 scaleUv = vUv * 8.0;
      float row = floor(scaleUv.y);
      scaleUv.x += mod(row, 2.0) * 0.5;
      vec2 cell = fract(scaleUv) - 0.5;
      float scaleDist = length(cell);
      float scale = smoothstep(0.5, 0.2, scaleDist);

      // Iridescence based on angle
      float hue = n1 * 0.4 + uTime * 0.06 + vUv.x * 0.3 + vUv.y * 0.2;
      vec3 c = vec3(hue, 0.6, 0.7);
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      vec3 iridescent = c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);

      vec3 deep = vec3(0.01, 0.05, 0.12);
      float shimmer = sin(uTime * 2.0 + n2 * 6.0) * 0.5 + 0.5;

      vec3 color = mix(deep, iridescent, scale * 0.8);
      color += shimmer * scale * 0.2;
      color = mix(color, iridescent * 1.2, n2 * 0.3);
    `
  ];

  return `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    ${noiseGLSL}

    void main() {
      ${shaderBodies[faceIndex]}

      // Add edge lighting for 3D effect
      float edgeFade = 1.0 - pow(max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)) * 2.0, 4.0);
      color *= 0.7 + edgeFade * 0.3;

      gl_FragColor = vec4(color, 1.0);
    }
  `;
};

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// 3D Cube with shader materials
interface Liquid3DCubeProps {
  targetRotation: number;
  isIntro: boolean;
}

const Liquid3DCube = ({ targetRotation, isIntro }: Liquid3DCubeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);

  // Create materials for each face
  const materials = useMemo(() => {
    return [0, 1, 2, 3].map((i) => {
      return new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: createFragmentShader(i),
        uniforms: {
          uTime: { value: 0 }
        },
        side: THREE.FrontSide
      });
    });
  }, []);

  // Dark material for top/bottom
  const darkMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({ color: '#0a0608' });
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Update shader uniforms
    materials.forEach((mat) => {
      mat.uniforms.uTime.value = t;
    });

    if (groupRef.current) {
      // Smooth rotation to target
      const target = (targetRotation * Math.PI) / 2;
      groupRef.current.rotation.y += (target - groupRef.current.rotation.y) * 0.06;

      // Intro floating animation
      if (isIntro) {
        groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.15;
        groupRef.current.rotation.z = Math.cos(t * 0.3) * 0.08;
        groupRef.current.position.y = Math.sin(t * 0.5) * 0.15;
      } else {
        // Slight tilt for 3D depth perception
        groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.03 + 0.1;
        groupRef.current.rotation.z *= 0.95;
        groupRef.current.position.y += (0 - groupRef.current.position.y) * 0.05;
      }
    }
  });

  const cubeSize = isIntro ? 2 : 3.5;
  const half = cubeSize / 2;

  return (
    <group ref={groupRef}>
      {/* Front face (Face 0 - starts visible) */}
      <mesh position={[0, 0, half]} material={materials[0]}>
        <planeGeometry args={[cubeSize, cubeSize]} />
      </mesh>

      {/* Right face (Face 1) */}
      <mesh position={[half, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={materials[1]}>
        <planeGeometry args={[cubeSize, cubeSize]} />
      </mesh>

      {/* Back face (Face 2) */}
      <mesh position={[0, 0, -half]} rotation={[0, Math.PI, 0]} material={materials[2]}>
        <planeGeometry args={[cubeSize, cubeSize]} />
      </mesh>

      {/* Left face (Face 3) */}
      <mesh position={[-half, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={materials[3]}>
        <planeGeometry args={[cubeSize, cubeSize]} />
      </mesh>

      {/* Top face */}
      <mesh position={[0, half, 0]} rotation={[-Math.PI / 2, 0, 0]} material={darkMaterial}>
        <planeGeometry args={[cubeSize, cubeSize]} />
      </mesh>

      {/* Bottom face */}
      <mesh position={[0, -half, 0]} rotation={[Math.PI / 2, 0, 0]} material={darkMaterial}>
        <planeGeometry args={[cubeSize, cubeSize]} />
      </mesh>

      {/* Wireframe edges for visibility */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(cubeSize * 1.001, cubeSize * 1.001, cubeSize * 1.001)]} />
        <lineBasicMaterial color="#ffffff" opacity={0.2} transparent />
      </lineSegments>
    </group>
  );
};

// Main component
const CubeStory = () => {
  // -1 = intro, 0-3 = faces
  const [currentState, setCurrentState] = useState(-1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);

  const isIntro = currentState === -1;
  const currentFace = Math.max(0, currentState);

  // Wheel handler
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const now = Date.now();
      if (now - lastScrollTime.current < 1200 || isTransitioning) return;
      lastScrollTime.current = now;

      setIsTransitioning(true);

      if (e.deltaY > 0 && currentState < 3) {
        setCurrentState(prev => prev + 1);
      } else if (e.deltaY < 0 && currentState > -1) {
        setCurrentState(prev => prev - 1);
      }

      setTimeout(() => setIsTransitioning(false), 1200);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      container?.removeEventListener('wheel', handleWheel);
    };
  }, [currentState, isTransitioning]);

  // Touch handler
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 1200 || isTransitioning) return;

      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) > 50) {
        lastScrollTime.current = now;
        setIsTransitioning(true);

        if (deltaY > 0 && currentState < 3) {
          setCurrentState(prev => prev + 1);
        } else if (deltaY < 0 && currentState > -1) {
          setCurrentState(prev => prev - 1);
        }

        setTimeout(() => setIsTransitioning(false), 1200);
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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full bg-[#030108] overflow-hidden"
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
        <Canvas
          camera={{ position: [0, 0, isIntro ? 8 : 6], fov: 45 }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={0.5} />
          <Liquid3DCube
            targetRotation={currentFace}
            isIntro={isIntro}
          />
        </Canvas>
      </div>

      {/* Intro overlay */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none transition-all duration-1000 ${
          isIntro ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="text-center space-y-6">
          <p className="text-xs tracking-[0.5em] uppercase text-white/40">
            A Story From
          </p>
          <h1 className="text-4xl md:text-6xl font-thin tracking-wide text-white drop-shadow-lg">
            The Dreaming
          </h1>
          <p className="text-lg md:text-xl font-light text-white/60">
            of a Technology
          </p>
        </div>

        <div className="absolute bottom-16 flex flex-col items-center gap-3">
          <span className="text-xs tracking-[0.3em] uppercase text-white/40">Scroll to begin</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Story text - after intro */}
      <div
        className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-all duration-700 ${
          isIntro ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="max-w-xl mx-auto px-6 md:px-12">
          <div
            className="bg-black/70 backdrop-blur-lg rounded-xl p-6 md:p-10 border border-white/10 shadow-2xl"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase text-white/40 mb-4">
              Chapter {['I', 'II', 'III', 'IV'][currentFace]}
            </p>

            <h2 className="text-2xl md:text-3xl font-light text-white mb-6 tracking-wide">
              {storyContent[currentFace]?.title}
            </h2>

            <div className="space-y-4">
              {storyContent[currentFace]?.text.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-sm md:text-base font-light leading-relaxed text-white/90"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress dots */}
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
                setTimeout(() => setIsTransitioning(false), 1200);
              }
            }}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
              currentFace === i ? 'bg-white scale-125' : 'bg-white/25 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Scroll hint */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-500 ${
          isIntro || currentFace === 3 ? 'opacity-0' : 'opacity-40'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/60">Scroll</span>
          <div className="w-px h-5 bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default CubeStory;
