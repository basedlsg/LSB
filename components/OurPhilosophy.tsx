import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- NOISE FUNCTIONS FOR SHADERS ---
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

// --- CHAPTER CONTENT ---
const chapters = [
  {
    id: 1,
    label: "I — THE DREAMING",
    paragraphs: [
      "The Dreamtime tells of a technology known as the Walking Stick.",
      "From the darkness came the light. From the light came the seeing. From the seeing came the dreaming.",
      "And within the dreaming, our story begins."
    ]
  },
  {
    id: 2,
    label: "II — THE AGE OF ASKING",
    paragraphs: [
      "All beings inside the dreaming were learning to speak at once. And as they came to understand one another, they became the same.",
      "From this arose the Great Age of Asking.",
      "In this Age of Asking, many beings—sixty some in number—would gather together and walk in groups, asking questions to each other, to the sky, and to the water alike."
    ]
  },
  {
    id: 3,
    label: "III — THE SACRED STRIKE",
    paragraphs: [
      "One day, three of the beings broke from the group. And together, they gathered around a rock.",
      "Upon the rock, they began to strike a stick, again and again, singing loudly so the heavens would hear.",
      "And the heavens were pleased. So the heavens struck the rock in return. And inside those strikes were the truth.",
      "And from that truth came the Stick of Walking."
    ]
  },
  {
    id: 4,
    label: "IV — THE AGE OF WALKING",
    paragraphs: [
      "The beings—three in number—lifted the stick from the rock. And not wanting to fight over it, they became one. And that being began to walk.",
      "The Stick of Walking allowed them to rise to new heights and ushered in the Age of Walking.",
      "No longer did they move only across the ground—they could now walk among the sky and beyond the waters, where they spoke with the fish who swam.",
      "And the fish told them movements they had never known, and numbers they had never seen, yet which surrounded them all along."
    ]
  },
  {
    id: 5,
    label: "V — THE ETERNAL DREAMING",
    paragraphs: [
      "From the Age of Walking came the great Age of Technology, which still persists today.",
      "And as the Dreaming is eternal, its ages belong equally to the child and to the old man alike."
    ]
  }
];

// --- TEXT REVEAL COMPONENT ---
const RevealText = ({
  children,
  delay = 0,
  isVisible = true,
  className = ""
}: {
  children: React.ReactNode;
  delay?: number;
  isVisible?: boolean;
  className?: string;
}) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isVisible && !revealed) {
      const timer = setTimeout(() => setRevealed(true), delay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, delay, revealed]);

  return (
    <span
      className={`block transition-all duration-800 ease-out ${
        revealed
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
      } ${className}`}
      style={{ transitionDuration: '800ms' }}
    >
      {children}
    </span>
  );
};

// --- TEXT CONTAINER COMPONENT ---
const TextContainer = ({
  chapter,
  isActive,
  position = 'center'
}: {
  chapter: typeof chapters[0];
  isActive: boolean;
  position?: 'left' | 'center' | 'right';
}) => {
  const positionClasses = {
    left: 'left-[10%] -translate-x-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-[10%] translate-x-0 left-auto'
  };

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 z-20 max-w-[540px] w-[90vw] md:w-[540px] ${positionClasses[position]}`}
    >
      <div
        className={`
          p-8 md:p-12 rounded-2xl
          bg-black/75 backdrop-blur-[20px]
          border border-white/[0.08]
          shadow-[0_4px_24px_rgba(0,0,0,0.4),0_12px_48px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]
          transition-all duration-700
          ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
      >
        {/* Chapter Label */}
        <RevealText delay={300} isVisible={isActive}>
          <p className="text-[10px] md:text-xs font-medium tracking-[0.35em] uppercase text-white/40 mb-6">
            {chapter.label}
          </p>
        </RevealText>

        {/* Paragraphs */}
        <div className="space-y-6">
          {chapter.paragraphs.map((paragraph, idx) => (
            <RevealText
              key={idx}
              delay={900 + idx * 400}
              isVisible={isActive}
            >
              <p className="text-lg md:text-[22px] font-light leading-[1.7] tracking-[0.005em] text-[#FDFBF7]/90">
                {paragraph}
              </p>
            </RevealText>
          ))}
        </div>

        {/* Return button for last chapter */}
        {chapter.id === 5 && (
          <RevealText delay={2500} isVisible={isActive}>
            <a
              href="#/"
              className="inline-block mt-10 group relative px-10 py-4 bg-transparent overflow-hidden rounded-full transition-all hover:scale-105"
            >
              <div className="absolute inset-0 border border-white/30 rounded-full group-hover:border-white/80 transition-colors duration-500" />
              <div className="absolute inset-0 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left opacity-10" />
              <span className="relative text-sm font-medium tracking-[0.25em] uppercase text-white/80 group-hover:text-white transition-colors">
                Return Home
              </span>
            </a>
          </RevealText>
        )}
      </div>
    </div>
  );
};

// --- PARTICLE SYSTEM FOR CHAPTERS ---
const PARTICLE_COUNT = 3000;

const generateChapterParticles = (chapterIndex: number) => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const randoms = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = i * 3;
    randoms[i] = Math.random();

    switch (chapterIndex) {
      case 0: // The Dreaming - fog/void
        positions[idx] = (Math.random() - 0.5) * 8;
        positions[idx + 1] = (Math.random() - 0.5) * 6;
        positions[idx + 2] = (Math.random() - 0.5) * 4;
        break;
      case 1: // Age of Asking - 60 clusters
        const clusterIdx = Math.floor(Math.random() * 60);
        const clusterAngle = (clusterIdx / 60) * Math.PI * 2;
        const clusterRadius = 1.5 + Math.random() * 1.5;
        const clusterX = Math.cos(clusterAngle) * clusterRadius;
        const clusterY = Math.sin(clusterAngle) * clusterRadius;
        positions[idx] = clusterX + (Math.random() - 0.5) * 0.3;
        positions[idx + 1] = clusterY + (Math.random() - 0.5) * 0.3;
        positions[idx + 2] = (Math.random() - 0.5) * 0.5;
        break;
      case 2: // Sacred Strike - three figures around center
        const figureIdx = i % 3;
        const figureAngle = (figureIdx / 3) * Math.PI * 2 - Math.PI / 2;
        const figureRadius = 1.2;
        positions[idx] = Math.cos(figureAngle) * figureRadius + (Math.random() - 0.5) * 0.4;
        positions[idx + 1] = (Math.random() - 0.5) * 1.5 - 0.5;
        positions[idx + 2] = Math.sin(figureAngle) * 0.5 + (Math.random() - 0.5) * 0.3;
        break;
      case 3: // Age of Walking - sky/water split
        const isWater = Math.random() > 0.5;
        positions[idx] = (Math.random() - 0.5) * 6;
        positions[idx + 1] = isWater
          ? -Math.random() * 2 - 0.5
          : Math.random() * 2 + 0.5;
        positions[idx + 2] = (Math.random() - 0.5) * 3;
        break;
      case 4: // Eternal - ouroboros ring
        const ringAngle = (i / PARTICLE_COUNT) * Math.PI * 2;
        const ringRadius = 1.8 + Math.sin(ringAngle * 3) * 0.2;
        positions[idx] = Math.cos(ringAngle) * ringRadius;
        positions[idx + 1] = Math.sin(ringAngle) * ringRadius * 0.6;
        positions[idx + 2] = (Math.random() - 0.5) * 0.3;
        break;
    }
  }

  return { positions, randoms };
};

// --- CHAPTER PARTICLE SHADER ---
const particleVertexShader = `
attribute float random;
uniform float uTime;
uniform float uDepthReveal;
uniform int uChapter;

varying float vAlpha;
varying float vDepth;

${noiseFunctions}

void main() {
  vec3 pos = position;

  // Add movement based on chapter
  float movement = snoise(pos * 0.5 + uTime * 0.1) * 0.1;
  pos += movement;

  // Depth-based positioning
  float depthOffset = (1.0 - uDepthReveal) * 2.0;
  pos.z += depthOffset;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size based on depth
  float size = 15.0 + random * 10.0;
  gl_PointSize = size / -mvPosition.z;

  // Alpha based on position and depth reveal
  vAlpha = 0.3 + random * 0.4;
  vAlpha *= smoothstep(-5.0, 0.0, pos.z);
  vAlpha *= uDepthReveal * 0.5 + 0.5;

  vDepth = pos.z;
}
`;

const particleFragmentShader = `
varying float vAlpha;
varying float vDepth;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  float glow = exp(-dist * 4.0);
  if (glow < 0.01) discard;

  // Warm white color
  vec3 color = vec3(1.0, 0.98, 0.94);

  gl_FragColor = vec4(color, vAlpha * glow);
}
`;

// --- CHAPTER BACKGROUND SHADER ---
const createBackgroundShader = (chapterIndex: number) => {
  const fragmentShaders = [
    // Chapter 1: Void to light
    `
    uniform float uTime;
    uniform float uDepthReveal;
    uniform vec2 uResolution;
    varying vec2 vUv;

    ${noiseFunctions}

    void main() {
      vec2 uv = vUv;

      // Deep void colors
      vec3 void_color = vec3(0.04, 0.02, 0.06);
      vec3 nebula = vec3(0.15, 0.05, 0.2);
      vec3 light = vec3(0.83, 0.65, 0.45);

      float n1 = snoise(vec3(uv * 2.0, uTime * 0.05));
      float n2 = snoise(vec3(uv * 4.0, uTime * 0.08));

      vec3 color = mix(void_color, nebula, n1 * 0.5 + 0.3);

      // Central light emergence based on depth reveal
      float centerDist = length(uv - 0.5);
      float lightGlow = smoothstep(0.5, 0.0, centerDist) * uDepthReveal;
      color = mix(color, light, lightGlow * 0.4);

      // Stars in background
      float stars = pow(max(0.0, snoise(vec3(uv * 50.0, 0.0))), 12.0) * uDepthReveal;
      color += stars * 0.8;

      // Vignette
      float vignette = smoothstep(0.8, 0.3, centerDist);
      color *= 0.5 + vignette * 0.5;

      gl_FragColor = vec4(color, 1.0);
    }
    `,
    // Chapter 2: Warm amber gathering
    `
    uniform float uTime;
    uniform float uDepthReveal;
    uniform vec2 uResolution;
    varying vec2 vUv;

    ${noiseFunctions}

    void main() {
      vec2 uv = vUv;

      vec3 deep = vec3(0.11, 0.05, 0.03);
      vec3 warm = vec3(0.25, 0.12, 0.05);
      vec3 amber = vec3(0.7, 0.4, 0.15);

      float n1 = snoise(vec3(uv * 3.0, uTime * 0.06));
      float n2 = snoise(vec3(uv * 6.0 + n1 * 0.3, uTime * 0.08));

      vec3 color = mix(deep, warm, n1 * 0.5 + 0.4);

      // Warmth reveals with depth
      float warmGlow = n2 * 0.5 + 0.5;
      color = mix(color, amber, warmGlow * uDepthReveal * 0.3);

      // Subtle radial gradient
      float centerDist = length(uv - 0.5);
      color *= 0.7 + smoothstep(0.7, 0.2, centerDist) * 0.3;

      gl_FragColor = vec4(color, 1.0);
    }
    `,
    // Chapter 3: Rock and lightning
    `
    uniform float uTime;
    uniform float uDepthReveal;
    uniform vec2 uResolution;
    uniform float uLightningFlash;
    varying vec2 vUv;

    ${noiseFunctions}

    void main() {
      vec2 uv = vUv;

      vec3 rock_dark = vec3(0.06, 0.04, 0.03);
      vec3 rock_mid = vec3(0.12, 0.08, 0.05);
      vec3 gold = vec3(1.0, 0.85, 0.4);
      vec3 lightning = vec3(1.0, 0.95, 0.8);

      float n1 = snoise(vec3(uv * 4.0, uTime * 0.03));
      float n2 = snoise(vec3(uv * 8.0, uTime * 0.05));

      vec3 color = mix(rock_dark, rock_mid, n1 * 0.5 + 0.4);

      // Golden veins that reveal with depth
      float veins = smoothstep(0.4, 0.6, n2);
      color = mix(color, gold, veins * uDepthReveal * 0.5);

      // Lightning flash effect
      color = mix(color, lightning, uLightningFlash * 0.8);

      // Central focus
      float centerDist = length(uv - 0.5);
      color *= 0.6 + smoothstep(0.6, 0.1, centerDist) * 0.4;

      gl_FragColor = vec4(color, 1.0);
    }
    `,
    // Chapter 4: Sky and water
    `
    uniform float uTime;
    uniform float uDepthReveal;
    uniform vec2 uResolution;
    uniform float uMouseY;
    varying vec2 vUv;

    ${noiseFunctions}

    void main() {
      vec2 uv = vUv;

      // Sky colors
      vec3 sky_high = vec3(0.15, 0.12, 0.2);
      vec3 sky_low = vec3(0.5, 0.35, 0.2);

      // Water colors
      vec3 water_surface = vec3(0.1, 0.15, 0.25);
      vec3 water_deep = vec3(0.03, 0.08, 0.15);

      float horizonLine = 0.5 + uMouseY * 0.1;

      vec3 color;

      if (uv.y > horizonLine) {
        // Sky
        float skyGrad = (uv.y - horizonLine) / (1.0 - horizonLine);
        float n = snoise(vec3(uv * 3.0, uTime * 0.05));
        color = mix(sky_low, sky_high, skyGrad + n * 0.2);
      } else {
        // Water
        float waterGrad = uv.y / horizonLine;
        float wave = sin(uv.x * 10.0 + uTime * 0.5) * 0.02;
        float n = snoise(vec3(uv.x * 5.0, uv.y * 3.0 + wave, uTime * 0.1));
        color = mix(water_deep, water_surface, waterGrad + n * 0.2);

        // Caustics
        float caustic = pow(max(0.0, snoise(vec3(uv * 15.0, uTime * 0.15))), 3.0);
        color += caustic * 0.1 * uDepthReveal * vec3(0.2, 0.3, 0.4);
      }

      // Horizon glow
      float horizonGlow = exp(-abs(uv.y - horizonLine) * 8.0);
      color += vec3(0.8, 0.6, 0.3) * horizonGlow * 0.2;

      gl_FragColor = vec4(color, 1.0);
    }
    `,
    // Chapter 5: Eternal return
    `
    uniform float uTime;
    uniform float uDepthReveal;
    uniform vec2 uResolution;
    varying vec2 vUv;

    ${noiseFunctions}

    void main() {
      vec2 uv = vUv;

      vec3 void_warm = vec3(0.08, 0.05, 0.04);
      vec3 deep = vec3(0.04, 0.02, 0.03);
      vec3 gold_thread = vec3(0.83, 0.65, 0.45);

      float n1 = snoise(vec3(uv * 2.5, uTime * 0.04));

      vec3 color = mix(deep, void_warm, n1 * 0.4 + 0.3);

      // Golden thread ring
      float centerDist = length(uv - 0.5);
      float ring = smoothstep(0.02, 0.0, abs(centerDist - 0.35));
      float ringGlow = smoothstep(0.1, 0.0, abs(centerDist - 0.35));

      // Animate ring
      float ringNoise = snoise(vec3(uv * 10.0, uTime * 0.2));
      ring *= 0.8 + ringNoise * 0.2;

      color = mix(color, gold_thread, ring * uDepthReveal);
      color += gold_thread * ringGlow * 0.2 * uDepthReveal;

      // Faint stars returning
      float stars = pow(max(0.0, snoise(vec3(uv * 40.0, 1.0))), 10.0);
      color += stars * 0.3 * uDepthReveal;

      // Warm vignette
      float vignette = smoothstep(0.8, 0.2, centerDist);
      color *= 0.6 + vignette * 0.4;

      gl_FragColor = vec4(color, 1.0);
    }
    `
  ];

  return fragmentShaders[chapterIndex];
};

const backgroundVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// --- CHAPTER SCENE COMPONENT ---
interface ChapterSceneProps {
  chapterIndex: number;
  isActive: boolean;
  depthReveal: number;
  mouseY: number;
  lightningFlash: number;
}

const ChapterScene = ({ chapterIndex, isActive, depthReveal, mouseY, lightningFlash }: ChapterSceneProps) => {
  const particlesRef = useRef<THREE.Points>(null);
  const backgroundRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const particles = useMemo(() => generateChapterParticles(chapterIndex), [chapterIndex]);

  const particleUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDepthReveal: { value: 0 },
    uChapter: { value: chapterIndex }
  }), [chapterIndex]);

  const backgroundUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDepthReveal: { value: 0 },
    uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
    uMouseY: { value: 0 },
    uLightningFlash: { value: 0 }
  }), [viewport]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (particlesRef.current) {
      const mat = particlesRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uDepthReveal.value = depthReveal;
    }

    if (backgroundRef.current) {
      const mat = backgroundRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uDepthReveal.value = depthReveal;
      mat.uniforms.uMouseY.value = mouseY;
      mat.uniforms.uLightningFlash.value = lightningFlash;
    }
  });

  return (
    <>
      {/* Background plane */}
      <mesh ref={backgroundRef} position={[0, 0, -5]}>
        <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
        <shaderMaterial
          vertexShader={backgroundVertexShader}
          fragmentShader={createBackgroundShader(chapterIndex)}
          uniforms={backgroundUniforms}
        />
      </mesh>

      {/* Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={particles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-random"
            count={PARTICLE_COUNT}
            array={particles.randoms}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={particleVertexShader}
          fragmentShader={particleFragmentShader}
          uniforms={particleUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};

// --- PROGRESS INDICATOR ---
const ProgressIndicator = ({
  currentChapter,
  totalChapters,
  onChapterClick
}: {
  currentChapter: number;
  totalChapters: number;
  onChapterClick: (idx: number) => void;
}) => {
  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
      {Array.from({ length: totalChapters }, (_, i) => (
        <button
          key={i}
          onClick={() => onChapterClick(i)}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
            currentChapter === i
              ? 'bg-white scale-125'
              : 'bg-white/25 hover:bg-white/50'
          }`}
          aria-label={`Go to chapter ${i + 1}`}
        />
      ))}
    </div>
  );
};

// --- MAIN COMPONENT ---
const OurPhilosophy = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [depthReveal, setDepthReveal] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [lightningFlash, setLightningFlash] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const dwellTimeRef = useRef(0);
  const lastChapterRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Chapter positions for text containers
  const chapterPositions: Array<'left' | 'center' | 'right'> = [
    'center', 'left', 'center', 'right', 'center'
  ];

  // Handle horizontal scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (isTransitioning) return;

      // Clear any pending scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Debounce scroll
      scrollTimeoutRef.current = setTimeout(() => {
        const direction = e.deltaY > 0 ? 1 : -1;
        const newChapter = Math.max(0, Math.min(4, currentChapter + direction));

        if (newChapter !== currentChapter) {
          setIsTransitioning(true);
          setCurrentChapter(newChapter);
          setDepthReveal(0);
          dwellTimeRef.current = 0;

          // Lightning flash for chapter 3
          if (newChapter === 2) {
            setTimeout(() => {
              setLightningFlash(1);
              setTimeout(() => setLightningFlash(0), 100);
            }, 2500);
          }

          setTimeout(() => setIsTransitioning(false), 800);
        }
      }, 50);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      container?.removeEventListener('wheel', handleWheel);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentChapter, isTransitioning]);

  // Handle touch for mobile
  const touchStartRef = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioning) return;

      const deltaX = touchStartRef.current - e.changedTouches[0].clientX;

      if (Math.abs(deltaX) > 50) {
        const direction = deltaX > 0 ? 1 : -1;
        const newChapter = Math.max(0, Math.min(4, currentChapter + direction));

        if (newChapter !== currentChapter) {
          setIsTransitioning(true);
          setCurrentChapter(newChapter);
          setDepthReveal(0);
          dwellTimeRef.current = 0;

          if (newChapter === 2) {
            setTimeout(() => {
              setLightningFlash(1);
              setTimeout(() => setLightningFlash(0), 100);
            }, 2500);
          }

          setTimeout(() => setIsTransitioning(false), 800);
        }
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
  }, [currentChapter, isTransitioning]);

  // Depth reveal based on dwell time
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentChapter === lastChapterRef.current) {
        dwellTimeRef.current += 100;
        const newDepth = Math.min(1, dwellTimeRef.current / 2400);
        setDepthReveal(newDepth);
      } else {
        lastChapterRef.current = currentChapter;
        dwellTimeRef.current = 0;
        setDepthReveal(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentChapter]);

  // Mouse tracking for chapter 4
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const normalizedY = (e.clientY / window.innerHeight) * 2 - 1;
      setMouseY(-normalizedY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle chapter click from progress indicator
  const handleChapterClick = (idx: number) => {
    if (idx !== currentChapter && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentChapter(idx);
      setDepthReveal(0);
      dwellTimeRef.current = 0;

      if (idx === 2) {
        setTimeout(() => {
          setLightningFlash(1);
          setTimeout(() => setLightningFlash(0), 100);
        }, 2500);
      }

      setTimeout(() => setIsTransitioning(false), 800);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full bg-[#0a0608] overflow-hidden cursor-default"
    >
      {/* Back button */}
      <a
        href="#/"
        className="absolute top-8 left-8 z-50 text-white/50 hover:text-white transition-colors text-sm tracking-[0.2em] uppercase"
      >
        &larr; Back
      </a>

      {/* Page title */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
        <h1 className="text-[10px] md:text-xs font-medium tracking-[0.4em] uppercase text-white/30">
          Our Philosophy
        </h1>
      </div>

      {/* Progress indicator */}
      <ProgressIndicator
        currentChapter={currentChapter}
        totalChapters={5}
        onChapterClick={handleChapterClick}
      />

      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <ChapterScene
            chapterIndex={currentChapter}
            isActive={true}
            depthReveal={depthReveal}
            mouseY={mouseY}
            lightningFlash={lightningFlash}
          />
        </Canvas>
      </div>

      {/* Text containers for each chapter */}
      {chapters.map((chapter, idx) => (
        <TextContainer
          key={chapter.id}
          chapter={chapter}
          isActive={currentChapter === idx}
          position={chapterPositions[idx]}
        />
      ))}

      {/* Scroll hint */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 transition-opacity duration-500 ${
          currentChapter === 4 ? 'opacity-0' : 'opacity-40'
        }`}
      >
        <span className="text-[10px] tracking-[0.3em] uppercase text-white/60">
          Scroll to continue
        </span>
        <div className="w-px h-6 bg-gradient-to-b from-white/50 to-transparent" />
      </div>

      {/* Lightning flash overlay for chapter 3 */}
      <div
        className={`absolute inset-0 bg-white pointer-events-none z-40 transition-opacity duration-100 ${
          lightningFlash > 0 ? 'opacity-30' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default OurPhilosophy;
