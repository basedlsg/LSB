import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';

// --- ENHANCED NOISE FUNCTIONS ---
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

// --- CHAPTER CONTENT ---
const chapters = [
  {
    id: 1,
    label: "I",
    title: "THE DREAMING",
    paragraphs: [
      "The Dreamtime tells of a technology known as the Walking Stick.",
      "From the darkness came the light. From the light came the seeing. From the seeing came the dreaming.",
      "And within the dreaming, our story begins."
    ]
  },
  {
    id: 2,
    label: "II",
    title: "THE AGE OF ASKING",
    paragraphs: [
      "All beings inside the dreaming were learning to speak at once. And as they came to understand one another, they became the same.",
      "From this arose the Great Age of Asking.",
      "In this Age of Asking, many beings—sixty some in number—would gather together and walk in groups, asking questions to each other, to the sky, and to the water alike."
    ]
  },
  {
    id: 3,
    label: "III",
    title: "THE SACRED STRIKE",
    paragraphs: [
      "One day, three of the beings broke from the group. And together, they gathered around a rock.",
      "Upon the rock, they began to strike a stick, again and again, singing loudly so the heavens would hear.",
      "And the heavens were pleased. So the heavens struck the rock in return. And inside those strikes were the truth.",
      "And from that truth came the Stick of Walking."
    ]
  },
  {
    id: 4,
    label: "IV",
    title: "THE AGE OF WALKING",
    paragraphs: [
      "The beings—three in number—lifted the stick from the rock. And not wanting to fight over it, they became one. And that being began to walk.",
      "The Stick of Walking allowed them to rise to new heights and ushered in the Age of Walking.",
      "No longer did they move only across the ground—they could now walk among the sky and beyond the waters, where they spoke with the fish who swam.",
      "And the fish told them movements they had never known, and numbers they had never seen, yet which surrounded them all along."
    ]
  },
  {
    id: 5,
    label: "V",
    title: "THE ETERNAL DREAMING",
    paragraphs: [
      "From the Age of Walking came the great Age of Technology, which still persists today.",
      "And as the Dreaming is eternal, its ages belong equally to the child and to the old man alike."
    ]
  }
];

// --- REFINED PARTICLE SYSTEM ---
const PARTICLE_COUNT = 18000;

// Utility for smooth randomness
const smoothRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const generateParticlePositions = () => {
  const positions = [];

  for (let c = 0; c < 5; c++) {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      const t = i / PARTICLE_COUNT;
      const seed = i * 0.001;

      switch(c) {
        case 0: {
          // CHAPTER I: THE DREAMING - Elegant spiral galaxy with luminous core
          const isCore = t > 0.65;

          if (isCore) {
            // Central light - gaussian distribution for soft edges
            const coreT = (t - 0.65) / 0.35;
            const theta = smoothRandom(seed) * Math.PI * 2;
            const r = Math.sqrt(-2 * Math.log(Math.max(0.001, smoothRandom(seed + 1)))) * 0.8;
            pos[idx] = Math.cos(theta) * r;
            pos[idx + 1] = Math.sin(theta) * r;
            pos[idx + 2] = (smoothRandom(seed + 2) - 0.5) * 0.4;
            // Soft warm glow - gradient from center
            const coreBrightness = 1 - r * 0.3;
            colors[idx] = 1.0;
            colors[idx + 1] = 0.92 * coreBrightness;
            colors[idx + 2] = 0.7 * coreBrightness;
          } else {
            // Spiral arms - clean logarithmic spiral
            const armCount = 4;
            const armId = i % armCount;
            const armOffset = (armId / armCount) * Math.PI * 2;
            const streamT = t / 0.65;

            const spiralAngle = streamT * Math.PI * 3.5 + armOffset;
            const spiralRadius = 0.8 + streamT * 3.2;
            const armWidth = 0.08 + streamT * 0.06;

            pos[idx] = Math.cos(spiralAngle) * spiralRadius + (smoothRandom(seed) - 0.5) * armWidth;
            pos[idx + 1] = Math.sin(spiralAngle) * spiralRadius + (smoothRandom(seed + 1) - 0.5) * armWidth;
            pos[idx + 2] = (smoothRandom(seed + 2) - 0.5) * 0.5;

            // Smooth color gradient along arms
            const armBrightness = 0.3 + (1 - streamT) * 0.4;
            colors[idx] = 0.4 + armBrightness * 0.4;
            colors[idx + 1] = 0.2 + armBrightness * 0.25;
            colors[idx + 2] = 0.5 + armBrightness * 0.2;
          }
          break;
        }

        case 1: {
          // CHAPTER II: THE AGE OF ASKING - Flowing crowd of luminous figures
          const beingCount = 24;
          const beingId = i % beingCount;
          const particleInBeing = Math.floor(i / beingCount);

          // Organic crowd arrangement
          const row = Math.floor(beingId / 8);
          const col = beingId % 8;
          const rowOffset = row * 0.15;
          const beingX = (col - 3.5) * 0.9 + rowOffset;
          const beingBaseY = -1.2 + row * 0.5;

          // Refined humanoid proportions
          const bodyT = (particleInBeing % 200) / 200;
          let localX = 0, localY = 0, localZ = 0;

          if (bodyT < 0.2) {
            // Head - perfect circle distribution
            const headAngle = bodyT / 0.2 * Math.PI * 2;
            const headR = 0.08 + smoothRandom(seed) * 0.04;
            localX = Math.cos(headAngle) * headR;
            localY = 1.5 + Math.sin(headAngle) * headR;
            localZ = smoothRandom(seed + 1) * 0.03;
          } else if (bodyT < 0.55) {
            // Torso - tapered elegant shape
            const torsoT = (bodyT - 0.2) / 0.35;
            const torsoWidth = 0.12 - torsoT * 0.03;
            localX = (smoothRandom(seed) - 0.5) * torsoWidth;
            localY = 0.8 + torsoT * 0.6;
            localZ = smoothRandom(seed + 1) * 0.04;
          } else if (bodyT < 0.75) {
            // Arms - graceful curves reaching up
            const armT = (bodyT - 0.55) / 0.2;
            const armSide = smoothRandom(seed) > 0.5 ? 1 : -1;
            const isReaching = beingId % 3 === 0;
            const armCurve = isReaching ? 0.4 + armT * 0.3 : 0.15 + armT * 0.1;
            localX = armSide * (0.1 + armT * 0.2);
            localY = 1.1 + Math.sin(armCurve * Math.PI) * 0.35;
            localZ = smoothRandom(seed + 1) * 0.02;
          } else {
            // Legs - subtle taper
            const legT = (bodyT - 0.75) / 0.25;
            const legSide = smoothRandom(seed) > 0.5 ? 1 : -1;
            localX = legSide * 0.05 + (smoothRandom(seed + 2) - 0.5) * 0.03;
            localY = legT * 0.7;
            localZ = smoothRandom(seed + 1) * 0.02;
          }

          pos[idx] = beingX + localX;
          pos[idx + 1] = beingBaseY + localY;
          pos[idx + 2] = row * 0.25 + localZ;

          // Warm harmonious colors - subtle variation
          const warmth = 0.85 + smoothRandom(seed + 3) * 0.15;
          colors[idx] = warmth;
          colors[idx + 1] = 0.65 * warmth;
          colors[idx + 2] = 0.3 * warmth;
          break;
        }

        case 2: {
          // CHAPTER III: THE SACRED STRIKE - Dramatic composition
          const element = t < 0.18 ? 'rock' : t < 0.58 ? 'beings' : t < 0.78 ? 'stick' : 'lightning';

          if (element === 'rock') {
            // Rock - dense, solid ellipsoid
            const rockT = t / 0.18;
            const theta = smoothRandom(seed) * Math.PI * 2;
            const phi = Math.acos(2 * smoothRandom(seed + 1) - 1);
            const r = Math.pow(smoothRandom(seed + 2), 0.33) * 1.0;
            pos[idx] = Math.sin(phi) * Math.cos(theta) * r;
            pos[idx + 1] = -2.0 + Math.cos(phi) * r * 0.5;
            pos[idx + 2] = Math.sin(phi) * Math.sin(theta) * r * 0.4;
            // Rich stone tones
            const stoneVar = smoothRandom(seed + 3) * 0.1;
            colors[idx] = 0.25 + stoneVar;
            colors[idx + 1] = 0.2 + stoneVar * 0.8;
            colors[idx + 2] = 0.18 + stoneVar * 0.5;
          } else if (element === 'beings') {
            // Three figures - elegant silhouettes
            const beingNum = Math.floor((t - 0.18) / 0.133);
            const beingAngle = (beingNum / 3) * Math.PI * 2 - Math.PI / 2;
            const beingDist = 2.0;
            const beingX = Math.cos(beingAngle) * beingDist;

            const localT = ((t - 0.18) % 0.133) / 0.133;
            let localX = 0, localY = 0;

            if (localT < 0.22) {
              const headAngle = localT / 0.22 * Math.PI * 2;
              localX = Math.cos(headAngle) * 0.12;
              localY = 1.9 + Math.sin(headAngle) * 0.12;
            } else if (localT < 0.6) {
              const torsoT = (localT - 0.22) / 0.38;
              localX = (smoothRandom(seed) - 0.5) * 0.22;
              localY = 0.9 + torsoT * 0.9;
            } else {
              localX = (smoothRandom(seed) - 0.5) * 0.15;
              localY = smoothRandom(seed + 1) * 0.8;
            }

            pos[idx] = beingX + localX;
            pos[idx + 1] = -1.7 + localY;
            pos[idx + 2] = Math.sin(beingAngle) * 0.4 + smoothRandom(seed + 2) * 0.05;
            // Warm earth presence
            colors[idx] = 0.9;
            colors[idx + 1] = 0.55;
            colors[idx + 2] = 0.25;
          } else if (element === 'stick') {
            // Stick - refined diagonal
            const stickT = (t - 0.58) / 0.2;
            const stickX = -1.3 + stickT * 1.3;
            const stickY = 2.2 - stickT * 4.2;
            pos[idx] = stickX + (smoothRandom(seed) - 0.5) * 0.06;
            pos[idx + 1] = stickY + (smoothRandom(seed + 1) - 0.5) * 0.06;
            pos[idx + 2] = (smoothRandom(seed + 2) - 0.5) * 0.04;
            // Glowing wood
            colors[idx] = 0.75;
            colors[idx + 1] = 0.45;
            colors[idx + 2] = 0.18;
          } else {
            // Lightning - electric and precise
            const boltT = (t - 0.78) / 0.22;
            const boltY = 3.2 - boltT * 5.2;
            const boltZig = Math.sin(boltY * 4) * 0.35 + Math.sin(boltY * 11) * 0.12;
            const boltWidth = 0.04 + (1 - Math.abs(boltT - 0.5) * 2) * 0.08;
            pos[idx] = boltZig + (smoothRandom(seed) - 0.5) * boltWidth;
            pos[idx + 1] = boltY;
            pos[idx + 2] = (smoothRandom(seed + 1) - 0.5) * 0.04;
            // Pure electric light
            colors[idx] = 1.0;
            colors[idx + 1] = 0.97;
            colors[idx + 2] = 0.85;
          }
          break;
        }

        case 3: {
          // CHAPTER IV: THE AGE OF WALKING - Single figure with fish swimming across
          const isFish = t > 0.7; // 30% fish, 70% person

          if (isFish) {
            // FISH - elegant swimming across the background
            const fishT = (t - 0.7) / 0.3;
            const fishCount = 3;
            const fishId = Math.floor(fishT * fishCount);
            const fishProgress = (fishT * fishCount) % 1;

            // Fish swim from right to left at different heights
            const fishX = 4.0 - fishProgress * 8.0; // Swim across
            const fishY = -0.5 + (fishId - 1) * 1.2; // Staggered heights
            const swimWave = Math.sin(fishProgress * Math.PI * 4) * 0.15; // Swimming motion

            // Fish body shape - elegant elongated form
            const bodyT = smoothRandom(seed);
            let localX = 0, localY = 0;

            if (bodyT < 0.6) {
              // Main body - tapered oval
              const bodyAngle = bodyT / 0.6 * Math.PI * 2;
              const bodyLen = 0.4;
              const bodyHeight = 0.12;
              localX = Math.cos(bodyAngle) * bodyLen;
              localY = Math.sin(bodyAngle) * bodyHeight;
            } else if (bodyT < 0.85) {
              // Tail fin - triangular
              const tailT = (bodyT - 0.6) / 0.25;
              localX = -0.4 - tailT * 0.25;
              localY = (smoothRandom(seed + 1) - 0.5) * 0.2 * (1 - tailT);
            } else {
              // Dorsal fin
              const finT = (bodyT - 0.85) / 0.15;
              localX = (smoothRandom(seed + 2) - 0.5) * 0.2;
              localY = 0.12 + finT * 0.1;
            }

            pos[idx] = fishX + localX;
            pos[idx + 1] = fishY + localY + swimWave;
            pos[idx + 2] = -1.5 + fishId * 0.3 + smoothRandom(seed + 3) * 0.1;

            // Silvery blue fish
            const shimmer = 0.85 + smoothRandom(seed + 4) * 0.15;
            colors[idx] = 0.6 * shimmer;
            colors[idx + 1] = 0.75 * shimmer;
            colors[idx + 2] = 0.9 * shimmer;
          } else {
            // SINGLE PERSON - elegant standing figure with walking stick
            const personT = t / 0.7;
            let localX = 0, localY = 0;

            if (personT < 0.15) {
              // Head - refined circle
              const headAngle = personT / 0.15 * Math.PI * 2;
              const headR = 0.18 + smoothRandom(seed) * 0.04;
              localX = Math.cos(headAngle) * headR;
              localY = 2.4 + Math.sin(headAngle) * headR;
            } else if (personT < 0.45) {
              // Torso - elegant tapered form
              const torsoT = (personT - 0.15) / 0.3;
              const torsoWidth = 0.25 - torsoT * 0.08;
              localX = (smoothRandom(seed) - 0.5) * torsoWidth;
              localY = 1.2 + torsoT * 1.1;
            } else if (personT < 0.65) {
              // Legs
              const legT = (personT - 0.45) / 0.2;
              const legSide = smoothRandom(seed) > 0.5 ? 1 : -1;
              localX = legSide * 0.08 + (smoothRandom(seed + 1) - 0.5) * 0.04;
              localY = legT * 1.1;
            } else if (personT < 0.85) {
              // Arms - one reaching out
              const armT = (personT - 0.65) / 0.2;
              const isRightArm = smoothRandom(seed) > 0.5;
              if (isRightArm) {
                localX = 0.15 + armT * 0.3;
                localY = 1.8 - armT * 0.2;
              } else {
                localX = -0.15 - armT * 0.1;
                localY = 1.6 + armT * 0.1;
              }
            } else {
              // Walking stick - held at angle
              const stickT = (personT - 0.85) / 0.15;
              localX = 0.4 + stickT * 0.15;
              localY = 1.6 - stickT * 1.8;
            }

            pos[idx] = localX;
            pos[idx + 1] = -1.2 + localY;
            pos[idx + 2] = (smoothRandom(seed + 2) - 0.5) * 0.15;

            // Warm golden figure
            const warmth = 0.9 + smoothRandom(seed + 3) * 0.1;
            colors[idx] = warmth;
            colors[idx + 1] = 0.85 * warmth;
            colors[idx + 2] = 0.6 * warmth;
          }
          break;
        }

        case 4: {
          // CHAPTER V: THE ETERNAL DREAMING - Perfect double spiral
          const isFirst = i % 2 === 0;
          const spiralT = t;
          const loops = 2;
          const angle = spiralT * Math.PI * 2 * loops + (isFirst ? 0 : Math.PI);

          // Elegant expanding radius
          const radius = 0.4 + spiralT * 2.6;
          const ribbonWidth = 0.04 + spiralT * 0.03;

          pos[idx] = Math.cos(angle) * radius + (smoothRandom(seed) - 0.5) * ribbonWidth;
          pos[idx + 1] = Math.sin(angle) * radius + (smoothRandom(seed + 1) - 0.5) * ribbonWidth;
          pos[idx + 2] = (isFirst ? 0.08 : -0.08) + (smoothRandom(seed + 2) - 0.5) * 0.06;

          // Complementary color harmony
          const intensity = 0.75 + spiralT * 0.25;
          if (isFirst) {
            colors[idx] = intensity;
            colors[idx + 1] = 0.95 * intensity;
            colors[idx + 2] = 0.9 * intensity;
          } else {
            colors[idx] = 0.95 * intensity;
            colors[idx + 1] = 0.7 * intensity;
            colors[idx + 2] = 0.35 * intensity;
          }
          break;
        }
      }

      // Minimal velocity for subtle drift
      vel[idx] = (smoothRandom(seed + 10) - 0.5) * 0.008;
      vel[idx + 1] = (smoothRandom(seed + 11) - 0.5) * 0.008;
      vel[idx + 2] = (smoothRandom(seed + 12) - 0.5) * 0.008;
    }

    positions.push({ pos, vel, colors });
  }

  return positions;
};

// --- PARTICLE SHADERS ---
const particleVertexShader = `
attribute vec3 aVelocity;
attribute vec3 aColor;
attribute vec3 aTarget;

uniform float uTime;
uniform float uProgress;
uniform float uTransition;
uniform vec2 uMouse;

varying vec3 vColor;
varying float vAlpha;
varying float vSize;

${noiseFunctions}

void main() {
  vec3 pos = position;

  // Morph towards target position during transition
  pos = mix(pos, aTarget, uTransition);

  // Elegant flowing movement - gentle sine waves
  float flow = sin(uTime * 0.3 + pos.x * 0.8 + pos.y * 0.6) * 0.02;
  float flow2 = cos(uTime * 0.25 + pos.y * 0.7) * 0.015;
  pos.x += flow;
  pos.y += flow2;

  // Subtle mouse interaction - very gentle displacement (reduced further)
  vec2 mouseWorld = uMouse * 3.5;
  float mouseDist = length(pos.xy - mouseWorld);
  if (mouseDist < 1.2) {
    vec2 away = normalize(pos.xy - mouseWorld);
    float force = smoothstep(1.2, 0.0, mouseDist) * 0.03;
    pos.xy += away * force;
  }

  // Very slow, graceful rotation
  float rotSpeed = 0.015;
  float cosR = cos(uTime * rotSpeed);
  float sinR = sin(uTime * rotSpeed);
  pos.xz = mat2(cosR, -sinR, sinR, cosR) * pos.xz;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Refined size variation - smaller range, more consistent
  float sizeVar = snoise(pos * 0.3 + uTime * 0.1) * 0.5 + 0.5;
  float baseSize = 25.0 + sizeVar * 15.0;
  gl_PointSize = baseSize / -mvPosition.z;
  vSize = sizeVar;

  // Smooth color with subtle luminance variation (reduced 30%)
  vColor = aColor * (0.7 + sizeVar * 0.08);

  // Refined alpha - depth-based fade (reduced 30%)
  vAlpha = 0.42 + sizeVar * 0.18;
  vAlpha *= smoothstep(-10.0, -1.0, pos.z);
}
`;

const particleFragmentShader = `
varying vec3 vColor;
varying float vAlpha;
varying float vSize;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  // Multi-layered soft glow for ethereal effect
  float innerCore = exp(-dist * 12.0);  // Bright center
  float midGlow = exp(-dist * 5.0);     // Soft middle
  float outerGlow = exp(-dist * 2.5);   // Diffuse halo

  // Combine layers with refined weights
  float combined = innerCore * 0.4 + midGlow * 0.35 + outerGlow * 0.25;

  // Smooth edge falloff
  combined *= smoothstep(0.5, 0.2, dist);

  if (combined < 0.005) discard;

  // Subtle color enhancement at core (reduced 30%)
  vec3 coreColor = vColor + vec3(0.07, 0.056, 0.035) * innerCore;

  // Final color with gentle bloom (reduced)
  vec3 finalColor = mix(vColor, coreColor, innerCore * 0.4);
  finalColor *= (1.0 + innerCore * 0.2);

  gl_FragColor = vec4(finalColor, vAlpha * combined);
}
`;

// --- DRAMATIC BACKGROUND SHADERS ---
const bgVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const createBgFragmentShader = (chapter: number) => {
  const shaders = [
    // Chapter 1: Cosmic void with emerging light
    `
    uniform float uTime;
    uniform float uProgress;
    uniform vec2 uMouse;
    varying vec2 vUv;

    ${noiseFunctions}

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5);
      float dist = length(uv - center);

      // Deep space colors
      vec3 void_black = vec3(0.02, 0.01, 0.04);
      vec3 nebula_purple = vec3(0.15, 0.05, 0.25);
      vec3 nebula_blue = vec3(0.05, 0.1, 0.3);
      vec3 star_gold = vec3(1.0, 0.9, 0.6);

      // Swirling nebula
      float angle = atan(uv.y - 0.5, uv.x - 0.5);
      float spiral = sin(angle * 3.0 + dist * 10.0 - uTime * 0.3);

      float n1 = snoise(vec3(uv * 3.0, uTime * 0.1));
      float n2 = snoise(vec3(uv * 6.0 + n1 * 0.5, uTime * 0.15));
      float n3 = snoise(vec3(uv * 12.0, uTime * 0.05));

      vec3 color = void_black;
      color = mix(color, nebula_purple, smoothstep(0.3, 0.7, n1 * 0.5 + 0.5) * 0.6);
      color = mix(color, nebula_blue, smoothstep(0.4, 0.8, n2 * 0.5 + 0.5) * 0.4);

      // Spiral arms
      float arms = smoothstep(0.0, 0.3, spiral * 0.5 + 0.5) * smoothstep(0.8, 0.2, dist);
      color += nebula_purple * arms * 0.3;

      // Central glow - the emerging light
      float centerGlow = exp(-dist * 3.0) * uProgress;
      color += star_gold * centerGlow * 0.8;

      // Stars
      float stars = pow(max(0.0, snoise(vec3(uv * 80.0, 0.0))), 20.0);
      float twinkle = sin(uTime * 3.0 + uv.x * 50.0) * 0.5 + 0.5;
      color += stars * twinkle * 1.5;

      // Mouse light
      vec2 mouseUV = uMouse * 0.5 + 0.5;
      float mouseDist = length(uv - mouseUV);
      float mouseGlow = exp(-mouseDist * 5.0) * 0.3;
      color += star_gold * mouseGlow;

      gl_FragColor = vec4(color, 1.0);
    }
    `,

    // Chapter 2: Warm gathering with connection lines
    `
    uniform float uTime;
    uniform float uProgress;
    uniform vec2 uMouse;
    varying vec2 vUv;

    ${noiseFunctions}

    void main() {
      vec2 uv = vUv;

      vec3 deep_brown = vec3(0.08, 0.04, 0.02);
      vec3 warm_amber = vec3(0.4, 0.2, 0.08);
      vec3 bright_gold = vec3(1.0, 0.7, 0.3);
      vec3 soft_orange = vec3(0.9, 0.5, 0.2);

      // Flowing warm currents
      float flow = uTime * 0.2;
      float n1 = snoise(vec3(uv.x * 2.0 + flow, uv.y * 3.0, uTime * 0.1));
      float n2 = snoise(vec3(uv * 4.0 + n1 * 0.3, uTime * 0.15));
      float n3 = snoise(vec3(uv * 8.0, uTime * 0.08));

      vec3 color = deep_brown;

      // Warm flowing layers
      float warmth = smoothstep(-0.2, 0.6, n1);
      color = mix(color, warm_amber, warmth * 0.7);

      // Bright spots where beings gather
      float gathering = pow(max(0.0, n2), 2.0);
      color = mix(color, bright_gold, gathering * 0.5);

      // Connection lines effect
      float lines = abs(sin(uv.x * 30.0 + n1 * 5.0 + uTime)) * abs(sin(uv.y * 30.0 + n2 * 5.0));
      lines = pow(lines, 8.0);
      color += soft_orange * lines * 0.3 * uProgress;

      // Radial warmth
      float dist = length(uv - 0.5);
      float radialWarm = exp(-dist * 2.0);
      color += bright_gold * radialWarm * 0.2;

      // Ambient glow
      color += warm_amber * n3 * 0.1;

      gl_FragColor = vec4(color, 1.0);
    }
    `,

    // Chapter 3: Rock and lightning - dramatic
    `
    uniform float uTime;
    uniform float uProgress;
    uniform float uFlash;
    uniform vec2 uMouse;
    varying vec2 vUv;

    ${noiseFunctions}

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5);

      vec3 rock_black = vec3(0.03, 0.02, 0.02);
      vec3 rock_brown = vec3(0.12, 0.08, 0.05);
      vec3 lava_orange = vec3(1.0, 0.4, 0.1);
      vec3 lightning_white = vec3(1.0, 0.95, 0.8);
      vec3 lightning_gold = vec3(1.0, 0.8, 0.3);

      // Rock texture
      float rock1 = snoise(vec3(uv * 5.0, 0.0));
      float rock2 = snoise(vec3(uv * 15.0, 1.0));
      float rock3 = snoise(vec3(uv * 30.0, 2.0));

      vec3 color = mix(rock_black, rock_brown, rock1 * 0.5 + 0.4);
      color += rock2 * 0.05;

      // Cracks with lava
      float cracks = smoothstep(0.4, 0.5, rock2) * smoothstep(0.6, 0.5, rock2);
      float lavaPulse = sin(uTime * 2.0 + rock1 * 5.0) * 0.5 + 0.5;
      color = mix(color, lava_orange, cracks * lavaPulse * 0.8 * uProgress);

      // Lightning bolt effect
      float boltX = 0.5 + sin(uv.y * 20.0 + uTime * 5.0) * 0.1;
      float boltDist = abs(uv.x - boltX);
      float bolt = exp(-boltDist * 50.0) * step(0.3, uv.y) * step(uv.y, 0.9);

      // Lightning branches
      float branch1X = boltX + sin(uv.y * 30.0) * 0.15;
      float branch1 = exp(-abs(uv.x - branch1X) * 40.0) * step(0.5, uv.y) * step(uv.y, 0.7);

      float lightningIntensity = (bolt + branch1 * 0.5) * uProgress;
      color = mix(color, lightning_gold, lightningIntensity * 0.7);
      color = mix(color, lightning_white, lightningIntensity * 0.3);

      // Flash effect
      color = mix(color, lightning_white, uFlash * 0.8);

      // Central impact glow
      float dist = length(uv - vec2(0.5, 0.4));
      float impact = exp(-dist * 4.0) * uProgress;
      color += lightning_gold * impact * 0.5;

      gl_FragColor = vec4(color, 1.0);
    }
    `,

    // Chapter 4: Sky and water with horizon
    `
    uniform float uTime;
    uniform float uProgress;
    uniform vec2 uMouse;
    varying vec2 vUv;

    ${noiseFunctions}

    void main() {
      vec2 uv = vUv;
      float horizon = 0.45 + uMouse.y * 0.1;

      // Sky colors
      vec3 sky_high = vec3(0.1, 0.08, 0.2);
      vec3 sky_low = vec3(0.6, 0.4, 0.2);
      vec3 sun_gold = vec3(1.0, 0.85, 0.5);

      // Water colors
      vec3 water_deep = vec3(0.02, 0.06, 0.12);
      vec3 water_mid = vec3(0.05, 0.15, 0.25);
      vec3 water_surface = vec3(0.1, 0.25, 0.35);

      vec3 color;

      if (uv.y > horizon) {
        // SKY
        float skyGrad = (uv.y - horizon) / (1.0 - horizon);
        color = mix(sky_low, sky_high, pow(skyGrad, 0.7));

        // Clouds
        float cloud1 = snoise(vec3(uv.x * 3.0 + uTime * 0.05, uv.y * 2.0, uTime * 0.02));
        float cloud2 = snoise(vec3(uv.x * 6.0 + uTime * 0.08, uv.y * 4.0, uTime * 0.03));
        float clouds = smoothstep(0.2, 0.8, cloud1 * 0.5 + cloud2 * 0.3 + 0.3);
        color = mix(color, sky_low * 1.3, clouds * 0.3 * (1.0 - skyGrad));

        // Sun/light source
        vec2 sunPos = vec2(0.7, 0.75);
        float sunDist = length(uv - sunPos);
        float sunGlow = exp(-sunDist * 4.0);
        float sunCore = exp(-sunDist * 15.0);
        color += sun_gold * sunGlow * 0.6;
        color += vec3(1.0) * sunCore * 0.4;

        // Stars (faint in upper sky)
        float stars = pow(max(0.0, snoise(vec3(uv * 100.0, 0.0))), 25.0);
        color += stars * skyGrad * 0.8;

      } else {
        // WATER
        float waterGrad = uv.y / horizon;

        // Wave distortion
        float wave1 = sin(uv.x * 15.0 + uTime * 1.5) * 0.01;
        float wave2 = sin(uv.x * 25.0 - uTime * 2.0) * 0.005;
        float waveY = uv.y + wave1 + wave2;

        float n1 = snoise(vec3(uv.x * 4.0, waveY * 6.0, uTime * 0.3));
        float n2 = snoise(vec3(uv.x * 8.0, waveY * 12.0, uTime * 0.4));

        color = mix(water_deep, water_mid, waterGrad);
        color = mix(color, water_surface, smoothstep(0.7, 1.0, waterGrad) + n1 * 0.2);

        // Caustics
        float caustic = pow(max(0.0, n2), 3.0);
        color += vec3(0.1, 0.2, 0.3) * caustic * 0.4;

        // Reflection of sun
        float reflectX = 0.7 + sin(uTime + uv.y * 20.0) * 0.05;
        float reflection = exp(-abs(uv.x - reflectX) * 10.0) * waterGrad;
        color += sun_gold * reflection * 0.4;

        // Fish silhouettes (subtle)
        float fishX = fract(uv.x * 3.0 + uTime * 0.1);
        float fishY = sin(fishX * 6.28) * 0.05;
        float fish = smoothstep(0.02, 0.0, abs(uv.y - 0.2 - fishY)) * smoothstep(0.1, 0.0, abs(fishX - 0.5));
        color = mix(color, water_deep, fish * 0.3 * uProgress);
      }

      // Horizon glow
      float horizonGlow = exp(-abs(uv.y - horizon) * 15.0);
      color += sun_gold * horizonGlow * 0.4;

      gl_FragColor = vec4(color, 1.0);
    }
    `,

    // Chapter 5: Eternal return - warm void with golden thread
    `
    uniform float uTime;
    uniform float uProgress;
    uniform vec2 uMouse;
    varying vec2 vUv;

    ${noiseFunctions}

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5);
      float dist = length(uv - center);
      float angle = atan(uv.y - 0.5, uv.x - 0.5);

      vec3 void_warm = vec3(0.06, 0.03, 0.02);
      vec3 deep_purple = vec3(0.08, 0.03, 0.1);
      vec3 gold_thread = vec3(1.0, 0.8, 0.4);
      vec3 soft_white = vec3(1.0, 0.98, 0.95);

      // Warm void base
      float n1 = snoise(vec3(uv * 2.0, uTime * 0.05));
      vec3 color = mix(void_warm, deep_purple, n1 * 0.3 + 0.3);

      // Eternal ring/ouroboros
      float ringRadius = 0.32 + sin(angle * 3.0 + uTime * 0.5) * 0.02;
      float ringDist = abs(dist - ringRadius);
      float ring = exp(-ringDist * 40.0);

      // Ring glow
      float ringGlow = exp(-ringDist * 10.0);

      // Animate ring brightness
      float ringPulse = sin(angle * 2.0 - uTime * 1.5) * 0.5 + 0.5;

      color += gold_thread * ring * (0.7 + ringPulse * 0.3);
      color += gold_thread * ringGlow * 0.3;

      // Inner warmth
      float innerGlow = exp(-dist * 3.0);
      color += gold_thread * innerGlow * 0.2;

      // Faint stars returning
      float stars = pow(max(0.0, snoise(vec3(uv * 60.0, 1.0))), 15.0);
      float twinkle = sin(uTime * 2.0 + angle * 10.0) * 0.5 + 0.5;
      color += soft_white * stars * twinkle * 0.6;

      // Gentle vignette
      float vignette = smoothstep(0.8, 0.3, dist);
      color *= 0.7 + vignette * 0.3;

      gl_FragColor = vec4(color, 1.0);
    }
    `
  ];

  return shaders[chapter];
};

// --- SCENE COMPONENT ---
interface ChapterSceneProps {
  chapter: number;
  progress: number;
  transition: number;
  mouse: THREE.Vector2;
  flash: number;
}

const ChapterScene = ({ chapter, progress, transition, mouse, flash }: ChapterSceneProps) => {
  const particlesRef = useRef<THREE.Points>(null);
  const bgRef = useRef<THREE.Mesh>(null);
  const positionRef = useRef<THREE.BufferAttribute>(null);
  const targetRef = useRef<THREE.BufferAttribute>(null);
  const colorRef = useRef<THREE.BufferAttribute>(null);
  const prevChapterRef = useRef(chapter);
  const morphProgressRef = useRef(0);
  const { viewport } = useThree();

  const allParticles = useMemo(() => generateParticlePositions(), []);

  // Interpolated positions for smooth morphing
  const interpolatedPos = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const interpolatedColors = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

  const particleUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uTransition: { value: 0 },
    uMouse: { value: new THREE.Vector2() }
  }), []);

  const bgUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uFlash: { value: 0 },
    uMouse: { value: new THREE.Vector2() }
  }), []);

  // Initialize with first chapter
  useEffect(() => {
    const particles = allParticles[0];
    interpolatedPos.set(particles.pos);
    interpolatedColors.set(particles.colors);
  }, [allParticles, interpolatedPos, interpolatedColors]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Handle smooth chapter morphing
    if (chapter !== prevChapterRef.current) {
      morphProgressRef.current = 0;
      prevChapterRef.current = chapter;
    }

    // Smooth morph animation
    if (morphProgressRef.current < 1) {
      morphProgressRef.current = Math.min(1, morphProgressRef.current + delta * 1.5); // ~0.67s transition
      const ease = 1 - Math.pow(1 - morphProgressRef.current, 3); // Ease out cubic

      const targetParticles = allParticles[chapter];

      // Interpolate positions and colors
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
        interpolatedPos[i] += (targetParticles.pos[i] - interpolatedPos[i]) * ease * 0.1;
        interpolatedColors[i] += (targetParticles.colors[i] - interpolatedColors[i]) * ease * 0.1;
      }

      // Update buffer attributes
      if (positionRef.current) {
        positionRef.current.array = interpolatedPos;
        positionRef.current.needsUpdate = true;
      }
      if (colorRef.current) {
        colorRef.current.array = interpolatedColors;
        colorRef.current.needsUpdate = true;
      }
      if (targetRef.current) {
        targetRef.current.array = targetParticles.pos;
        targetRef.current.needsUpdate = true;
      }
    }

    if (particlesRef.current) {
      const mat = particlesRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uProgress.value = progress;
      mat.uniforms.uTransition.value = transition;
      mat.uniforms.uMouse.value.copy(mouse);
    }

    if (bgRef.current) {
      const mat = bgRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uProgress.value = progress;
      mat.uniforms.uFlash.value = flash;
      mat.uniforms.uMouse.value.copy(mouse);
    }
  });

  return (
    <>
      {/* Dramatic background */}
      <mesh ref={bgRef} position={[0, 0, -10]}>
        <planeGeometry args={[viewport.width * 3, viewport.height * 3]} />
        <shaderMaterial
          vertexShader={bgVertexShader}
          fragmentShader={createBgFragmentShader(chapter)}
          uniforms={bgUniforms}
        />
      </mesh>

      {/* Particle system - smooth morphing between chapters */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            ref={positionRef}
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={interpolatedPos}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aVelocity"
            count={PARTICLE_COUNT}
            array={allParticles[0].vel}
            itemSize={3}
          />
          <bufferAttribute
            ref={colorRef}
            attach="attributes-aColor"
            count={PARTICLE_COUNT}
            array={interpolatedColors}
            itemSize={3}
          />
          <bufferAttribute
            ref={targetRef}
            attach="attributes-aTarget"
            count={PARTICLE_COUNT}
            array={allParticles[Math.min(chapter + 1, 4)].pos}
            itemSize={3}
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

// --- TEXT COMPONENTS ---
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
    if (isVisible) {
      const timer = setTimeout(() => setRevealed(true), delay);
      return () => clearTimeout(timer);
    } else {
      setRevealed(false);
    }
  }, [isVisible, delay]);

  return (
    <span
      className={`block transition-all duration-1000 ease-out ${
        revealed ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'
      } ${className}`}
    >
      {children}
    </span>
  );
};

// --- MAIN COMPONENT ---
const OurPhilosophy = () => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [progress, setProgress] = useState(0);
  const [transition, setTransition] = useState(0);
  const [flash, setFlash] = useState(0);
  const [lightningRipple, setLightningRipple] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dramatic lightning ripple effect for Chapter III
  const triggerLightningRipple = useCallback(() => {
    setLightningRipple(true);
    // Multiple flashes in sequence
    const flashSequence = [100, 200, 350, 500, 700];
    flashSequence.forEach((delay, i) => {
      setTimeout(() => {
        setFlash(1 - i * 0.15); // Decreasing intensity
        setTimeout(() => setFlash(0), 80);
      }, delay);
    });
    // End ripple effect
    setTimeout(() => setLightningRipple(false), 1200);
  }, []);

  // Progress builds over time in each chapter
  useEffect(() => {
    setProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setProgress(p => Math.min(1, p + 0.02));
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentChapter]);

  // Handle scroll/navigation
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (isScrolling) return;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const direction = e.deltaY > 0 ? 1 : -1;
        const newChapter = Math.max(0, Math.min(4, currentChapter + direction));

        if (newChapter !== currentChapter) {
          setIsScrolling(true);
          setTransition(0);

          // Animate transition
          let t = 0;
          const transitionInterval = setInterval(() => {
            t += 0.05;
            setTransition(Math.min(1, t));

            if (t >= 1) {
              clearInterval(transitionInterval);
              setCurrentChapter(newChapter);
              setTransition(0);

              // Lightning ripple for chapter 3 - immediate dramatic entrance
              if (newChapter === 2) {
                triggerLightningRipple();
              }

              setTimeout(() => setIsScrolling(false), 300);
            }
          }, 30);
        }
      }, 100);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      container?.removeEventListener('wheel', handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, [currentChapter, isScrolling]);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.set(x, y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Touch support
  const touchStartRef = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling) return;

      const deltaY = touchStartRef.current - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) > 50) {
        const direction = deltaY > 0 ? 1 : -1;
        const newChapter = Math.max(0, Math.min(4, currentChapter + direction));

        if (newChapter !== currentChapter) {
          setIsScrolling(true);
          setCurrentChapter(newChapter);

          if (newChapter === 2) {
            triggerLightningRipple();
          }

          setTimeout(() => setIsScrolling(false), 800);
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
  }, [currentChapter, isScrolling, triggerLightningRipple]);

  const chapter = chapters[currentChapter];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full overflow-hidden cursor-default"
      style={{ background: '#050208' }}
    >
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50 }}
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
          dpr={[1, 2]}
        >
          <ChapterScene
            chapter={currentChapter}
            progress={progress}
            transition={transition}
            mouse={mouseRef.current}
            flash={flash}
          />
        </Canvas>
      </div>

      {/* Flash overlay - simple dramatic light flash */}
      <div
        className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-75"
        style={{
          opacity: flash * 0.9,
          background: 'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,1) 0%, rgba(255,240,200,0.8) 20%, rgba(255,200,100,0.4) 40%, transparent 70%)'
        }}
      />

      {/* Navigation */}
      <a
        href="#/"
        className="absolute top-8 left-8 z-50 text-white/60 hover:text-white transition-all duration-300 text-sm tracking-[0.3em] uppercase hover:tracking-[0.4em]"
      >
        &larr; Back
      </a>

      {/* Chapter indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
        <div className="text-center">
          <p className="text-[10px] tracking-[0.5em] uppercase text-white/30 mb-1">Our Philosophy</p>
          <p className="text-xs tracking-[0.3em] uppercase text-white/50">
            Chapter {chapter.label}
          </p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
        {chapters.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (!isScrolling && idx !== currentChapter) {
                setIsScrolling(true);
                setCurrentChapter(idx);
                if (idx === 2) {
                  triggerLightningRipple();
                }
                setTimeout(() => setIsScrolling(false), 800);
              }
            }}
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              currentChapter === idx
                ? 'bg-amber-400 scale-125 shadow-lg shadow-amber-400/50'
                : 'bg-white/20 hover:bg-white/40 hover:scale-110'
            }`}
          />
        ))}
      </div>

      {/* Text content - positioned left for ALL chapters so particle formations are visible */}
      <div className="absolute inset-0 flex items-center z-20 pointer-events-none justify-start pl-8 md:pl-16">
        <div className="px-4 md:px-8 max-w-md md:max-w-lg">
          {/* Premium glass container with layered shadows */}
          <div
            className={`relative p-10 md:p-14 rounded-2xl backdrop-blur-2xl border border-white/[0.08] ${
              currentChapter === 2 ? 'bg-black/55' : 'bg-black/45'
            }`}
            style={{
              boxShadow: `
                0 4px 6px -1px rgba(0, 0, 0, 0.3),
                0 10px 20px -5px rgba(0, 0, 0, 0.4),
                0 25px 50px -12px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.05)
              `
            }}
          >
            {/* Subtle top highlight line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Minimal corner accent - top left only */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l border-t border-amber-500/20 rounded-tl-lg" />

            {/* Chapter title */}
            <RevealText delay={200} isVisible={true}>
              <h2
                className="text-3xl md:text-4xl font-extralight tracking-wider text-white mb-3"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
              >
                {chapter.title}
              </h2>
            </RevealText>

            <RevealText delay={400} isVisible={true}>
              <div className="w-12 h-px bg-gradient-to-r from-amber-500/60 to-transparent mb-8" />
            </RevealText>

            {/* Paragraphs */}
            <div className="space-y-5">
              {chapter.paragraphs.map((paragraph, idx) => (
                <RevealText key={idx} delay={700 + idx * 400} isVisible={true}>
                  <p
                    className="text-[15px] md:text-base font-light leading-[1.8] text-white/80 tracking-wide"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                  >
                    {paragraph}
                  </p>
                </RevealText>
              ))}
            </div>

            {/* Return button on last chapter */}
            {currentChapter === 4 && (
              <RevealText delay={2000} isVisible={true}>
                <a
                  href="#/"
                  className="inline-block mt-10 px-7 py-3 rounded-full border border-amber-500/30 text-amber-400/90 hover:bg-amber-500/10 hover:border-amber-400/50 transition-all duration-500 text-xs tracking-[0.25em] uppercase pointer-events-auto"
                  style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
                >
                  Return Home
                </a>
              </RevealText>
            )}
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      {currentChapter < 4 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 animate-pulse">
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/40">
            Scroll to continue
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      )}
    </div>
  );
};

export default OurPhilosophy;
