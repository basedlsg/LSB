import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
import Cursor from './Cursor';

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

// --- MASSIVE PARTICLE SYSTEM ---
const PARTICLE_COUNT = 15000;

const generateParticlePositions = () => {
  // 5 meaningful formations that tell the story
  const positions = [];

  for (let c = 0; c < 5; c++) {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      const t = i / PARTICLE_COUNT;

      switch(c) {
        case 0: {
          // CHAPTER I: THE DREAMING - Dramatic void with bright central light
          // "From the darkness came the light"
          const voidProgress = t;
          const isCore = t > 0.7; // 30% are the bright emerging light

          if (isCore) {
            // THE LIGHT - large, bright central cluster
            const coreAngle = Math.random() * Math.PI * 2;
            const coreRadius = Math.pow(Math.random(), 1.5) * 1.5; // Larger core
            pos[idx] = Math.cos(coreAngle) * coreRadius;
            pos[idx + 1] = Math.sin(coreAngle) * coreRadius;
            pos[idx + 2] = (Math.random() - 0.5) * 0.8;
            // Brilliant warm light
            colors[idx] = 1.0;
            colors[idx + 1] = 0.9 + Math.random() * 0.1;
            colors[idx + 2] = 0.6 + Math.random() * 0.3;
          } else {
            // THE VOID - clear spiral streams flowing inward
            const armCount = 5; // 5 spiral arms
            const armId = i % armCount;
            const armOffset = (armId / armCount) * Math.PI * 2;
            const streamProgress = voidProgress / 0.7; // Normalize to 0-1

            const spiralAngle = streamProgress * Math.PI * 4 + armOffset;
            const spiralRadius = 4.5 - streamProgress * 3.5; // Far to center

            pos[idx] = Math.cos(spiralAngle) * spiralRadius + (Math.random() - 0.5) * 0.3;
            pos[idx + 1] = Math.sin(spiralAngle) * spiralRadius + (Math.random() - 0.5) * 0.3;
            pos[idx + 2] = (Math.random() - 0.5) * 1.5;

            // Gradient from dark purple (edge) to brighter (center)
            const brightness = streamProgress * 0.5;
            colors[idx] = 0.3 + brightness * 0.5;
            colors[idx + 1] = 0.15 + brightness * 0.3;
            colors[idx + 2] = 0.5 + brightness * 0.3;
          }
          break;
        }

        case 1: {
          // CHAPTER II: THE AGE OF ASKING - 60 beings walking, asking sky and water
          // "sixty some in number—would gather together and walk in groups"
          // Show clearly recognizable humanoid figures in a crowd
          const beingCount = 30; // Fewer beings = more particles per being = clearer shapes
          const beingId = i % beingCount;
          const particleInBeing = Math.floor(i / beingCount);

          // Position beings in rows - a visible crowd
          const row = Math.floor(beingId / 10);
          const col = beingId % 10;
          const beingX = (col - 4.5) * 0.8; // Spread horizontally
          const beingBaseY = -1.5 + row * 0.4; // Rows from bottom

          // Each being - LARGER humanoid shape
          const bodyPart = particleInBeing % 150;
          let localX = 0, localY = 0, localZ = 0;

          if (bodyPart < 40) {
            // HEAD - clear round shape at top
            const headAngle = Math.random() * Math.PI * 2;
            const headR = Math.random() * 0.15;
            localX = Math.cos(headAngle) * headR;
            localY = 1.4 + Math.sin(headAngle) * headR; // Head at top
            localZ = (Math.random() - 0.5) * 0.1;
          } else if (bodyPart < 90) {
            // TORSO - rectangular body
            localX = (Math.random() - 0.5) * 0.25;
            localY = 0.7 + Math.random() * 0.6; // Body middle
            localZ = (Math.random() - 0.5) * 0.15;
          } else if (bodyPart < 120) {
            // ARMS - some UP (asking sky), some to sides
            const armSide = bodyPart < 105 ? -1 : 1;
            const isAskingSky = beingId % 3 === 0;
            const armAngle = isAskingSky ? Math.PI * 0.4 : Math.PI * 0.15; // Up or slightly out
            const armLength = 0.2 + Math.random() * 0.3;
            localX = armSide * 0.15 + Math.cos(armAngle) * armLength * armSide;
            localY = 1.0 + Math.sin(armAngle) * armLength;
            localZ = (Math.random() - 0.5) * 0.08;
          } else {
            // LEGS
            const legSide = bodyPart < 135 ? -1 : 1;
            localX = legSide * 0.1 + (Math.random() - 0.5) * 0.06;
            localY = Math.random() * 0.6; // Legs at bottom
            localZ = (Math.random() - 0.5) * 0.08;
          }

          pos[idx] = beingX + localX;
          pos[idx + 1] = beingBaseY + localY;
          pos[idx + 2] = row * 0.3 + localZ; // Depth by row

          // Warm communal colors
          colors[idx] = 1.0;
          colors[idx + 1] = 0.6 + Math.random() * 0.3;
          colors[idx + 2] = 0.2 + Math.random() * 0.2;
          break;
        }

        case 2: {
          // CHAPTER III: THE SACRED STRIKE - 3 beings around rock, stick + lightning
          // Much larger, clearer formations
          const element = t < 0.2 ? 'rock' : t < 0.6 ? 'beings' : t < 0.8 ? 'stick' : 'lightning';

          if (element === 'rock') {
            // THE ROCK - large, prominent boulder at center-bottom
            const rockAngle = Math.random() * Math.PI * 2;
            const rockRadius = Math.pow(Math.random(), 0.5) * 1.2; // Larger rock
            const rockHeight = (Math.random() - 0.5) * 0.6;
            pos[idx] = Math.cos(rockAngle) * rockRadius;
            pos[idx + 1] = -2.0 + rockHeight; // Low, grounded
            pos[idx + 2] = Math.sin(rockAngle) * rockRadius * 0.4;
            // Dark stone colors
            colors[idx] = 0.3 + Math.random() * 0.15;
            colors[idx + 1] = 0.25 + Math.random() * 0.1;
            colors[idx + 2] = 0.2 + Math.random() * 0.1;
          } else if (element === 'beings') {
            // THREE BEINGS - large humanoid figures around the rock
            const beingNum = Math.floor((t - 0.2) / 0.133); // 0, 1, or 2
            const beingAngle = (beingNum / 3) * Math.PI * 2 - Math.PI / 2; // Spread around
            const beingDist = 2.2; // Further from rock
            const beingX = Math.cos(beingAngle) * beingDist;

            // Large humanoid shape
            const localT = ((t - 0.2) % 0.133) / 0.133;
            let localX = 0, localY = 0;

            if (localT < 0.25) {
              // Head
              const headAngle = Math.random() * Math.PI * 2;
              localX = Math.cos(headAngle) * 0.2;
              localY = 1.8 + Math.sin(headAngle) * 0.2;
            } else if (localT < 0.6) {
              // Body
              localX = (Math.random() - 0.5) * 0.4;
              localY = 0.8 + Math.random() * 0.9;
            } else {
              // Legs
              localX = (Math.random() - 0.5) * 0.3;
              localY = Math.random() * 0.7;
            }

            pos[idx] = beingX + localX;
            pos[idx + 1] = -1.8 + localY;
            pos[idx + 2] = Math.sin(beingAngle) * 0.5 + (Math.random() - 0.5) * 0.15;
            // Warm earth tones
            colors[idx] = 0.9 + Math.random() * 0.1;
            colors[idx + 1] = 0.5 + Math.random() * 0.2;
            colors[idx + 2] = 0.2 + Math.random() * 0.1;
          } else if (element === 'stick') {
            // THE STICK - thick diagonal line striking down
            const stickT = (t - 0.6) / 0.2;
            const stickX = -1.5 + stickT * 1.5; // Angled strike
            const stickY = 2.5 - stickT * 4.5; // Down to rock
            pos[idx] = stickX + (Math.random() - 0.5) * 0.15;
            pos[idx + 1] = stickY + (Math.random() - 0.5) * 0.15;
            pos[idx + 2] = (Math.random() - 0.5) * 0.1;
            // Wooden brown - glowing
            colors[idx] = 0.7 + Math.random() * 0.2;
            colors[idx + 1] = 0.4 + Math.random() * 0.15;
            colors[idx + 2] = 0.15 + Math.random() * 0.1;
          } else {
            // LIGHTNING FROM HEAVEN - thick, dramatic bolt
            const boltT = (t - 0.8) / 0.2;
            const boltY = 3.5 - boltT * 5.5; // Top to rock
            const boltZigzag = Math.sin(boltY * 5) * 0.5 + Math.sin(boltY * 12) * 0.2;
            pos[idx] = boltZigzag + (Math.random() - 0.5) * 0.25;
            pos[idx + 1] = boltY;
            pos[idx + 2] = (Math.random() - 0.5) * 0.15;
            // Brilliant white-gold lightning
            colors[idx] = 1.0;
            colors[idx + 1] = 0.95 + Math.random() * 0.05;
            colors[idx + 2] = 0.7 + Math.random() * 0.3;
          }
          break;
        }

        case 3: {
          // CHAPTER IV: THE AGE OF WALKING - Ascending path through realms
          // "they could now walk among the sky and beyond the waters"
          // A grand ascending spiral path from water through earth to sky

          // Single continuous ascending helix/path
          const pathT = t;
          const totalRotations = 3; // 3 full rotations as it ascends
          const angle = pathT * Math.PI * 2 * totalRotations;
          const radius = 2.0 + Math.sin(pathT * Math.PI * 4) * 0.5; // Breathing radius
          const height = -3.0 + pathT * 6.0; // From bottom to top

          // Path particles with some spread
          pos[idx] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.3;
          pos[idx + 1] = height + (Math.random() - 0.5) * 0.2;
          pos[idx + 2] = Math.sin(angle) * radius * 0.5 + (Math.random() - 0.5) * 0.2;

          // Color gradient: deep blue (water) -> earth brown -> golden sky
          if (pathT < 0.33) {
            // Water realm - deep blues
            const waterT = pathT / 0.33;
            colors[idx] = 0.1 + waterT * 0.3;
            colors[idx + 1] = 0.3 + waterT * 0.2;
            colors[idx + 2] = 0.7 + waterT * 0.1;
          } else if (pathT < 0.66) {
            // Earth realm - warm browns to amber
            const earthT = (pathT - 0.33) / 0.33;
            colors[idx] = 0.4 + earthT * 0.5;
            colors[idx + 1] = 0.5 + earthT * 0.3;
            colors[idx + 2] = 0.3 - earthT * 0.1;
          } else {
            // Sky realm - brilliant gold to white
            const skyT = (pathT - 0.66) / 0.34;
            colors[idx] = 0.9 + skyT * 0.1;
            colors[idx + 1] = 0.8 + skyT * 0.15;
            colors[idx + 2] = 0.2 + skyT * 0.6;
          }
          break;
        }

        case 4: {
          // CHAPTER V: THE ETERNAL DREAMING - Double spiral / two intertwining loops
          // "The Dreaming is eternal, its ages belong equally to the child and to the old man"

          // Two intertwining spirals that form a cohesive double-helix pattern
          const isFirstSpiral = i % 2 === 0;
          const spiralT = t;
          const totalLoops = 2; // 2 full loops
          const angle = spiralT * Math.PI * 2 * totalLoops;

          // Offset the second spiral by 180 degrees for intertwining effect
          const spiralOffset = isFirstSpiral ? 0 : Math.PI;
          const finalAngle = angle + spiralOffset;

          // Radius expands outward as it spirals
          const baseRadius = 0.5 + spiralT * 2.5;
          const radius = baseRadius + Math.sin(spiralT * Math.PI * 8) * 0.2;

          // Flat spiral in the XY plane
          pos[idx] = Math.cos(finalAngle) * radius + (Math.random() - 0.5) * 0.15;
          pos[idx + 1] = Math.sin(finalAngle) * radius + (Math.random() - 0.5) * 0.15;
          pos[idx + 2] = (Math.random() - 0.5) * 0.3 + (isFirstSpiral ? 0.1 : -0.1);

          // Colors: First spiral is bright white/gold (youth), second is warm amber (wisdom)
          if (isFirstSpiral) {
            // Pure bright - representing the child / new
            const brightness = 0.8 + spiralT * 0.2;
            colors[idx] = 1.0;
            colors[idx + 1] = 0.95 * brightness;
            colors[idx + 2] = 0.85 * brightness;
          } else {
            // Warm amber/gold - representing the elder / eternal
            const warmth = 0.7 + spiralT * 0.3;
            colors[idx] = 1.0 * warmth;
            colors[idx + 1] = 0.7 * warmth;
            colors[idx + 2] = 0.3 * warmth;
          }
          break;
        }
      }

      // Velocities for animation - gentle movement
      vel[idx] = (Math.random() - 0.5) * 0.015;
      vel[idx + 1] = (Math.random() - 0.5) * 0.015;
      vel[idx + 2] = (Math.random() - 0.5) * 0.015;
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

${noiseFunctions}

void main() {
  vec3 pos = position;

  // Morph towards target position during transition
  pos = mix(pos, aTarget, uTransition);

  // VERY subtle breathing movement - preserves formation shape
  float breathe = sin(uTime * 0.5 + pos.x * 0.5 + pos.y * 0.5) * 0.03;
  pos += aVelocity * breathe;

  // Subtle mouse interaction - gentle push
  vec2 mouseWorld = uMouse * 3.0;
  float mouseDist = length(pos.xy - mouseWorld);
  if (mouseDist < 1.0) {
    vec2 away = normalize(pos.xy - mouseWorld);
    float force = (1.0 - mouseDist) * 0.15;
    pos.xy += away * force;
  }

  // Very slow rotation - keeps formations recognizable
  float rotSpeed = 0.02;
  float cosR = cos(uTime * rotSpeed);
  float sinR = sin(uTime * rotSpeed);
  pos.xz = mat2(cosR, -sinR, sinR, cosR) * pos.xz;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Larger, more visible particles
  float sizeNoise = snoise(pos * 0.5 + uTime * 0.2) * 0.5 + 0.5;
  float baseSize = 35.0 + sizeNoise * 20.0;
  gl_PointSize = baseSize / -mvPosition.z;

  // Pass color with subtle variation
  vColor = aColor * (0.9 + sizeNoise * 0.2);

  // Higher alpha for visibility
  vAlpha = 0.7 + sizeNoise * 0.3;
  vAlpha *= smoothstep(-8.0, 0.0, pos.z);
}
`;

const particleFragmentShader = `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  // Soft glow with bright core
  float core = exp(-dist * 8.0);
  float glow = exp(-dist * 3.0);
  float combined = core * 0.6 + glow * 0.4;

  if (combined < 0.01) discard;

  // Add bloom effect
  vec3 finalColor = vColor * (1.0 + core * 0.5);

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

      // Deep premium space colors - richer, darker
      vec3 void_black = vec3(0.01, 0.005, 0.02);
      vec3 nebula_purple = vec3(0.08, 0.02, 0.15);
      vec3 nebula_blue = vec3(0.02, 0.04, 0.12);
      vec3 star_gold = vec3(1.0, 0.85, 0.5);

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

      vec3 void_warm = vec3(0.03, 0.015, 0.01);
      vec3 deep_purple = vec3(0.04, 0.015, 0.06);
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
  const { viewport, size } = useThree();

  const allParticles = useMemo(() => generateParticlePositions(), []);

  const currentParticles = allParticles[chapter];
  const nextParticles = allParticles[Math.min(chapter + 1, 4)];

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

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

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

      {/* Particle system - key forces re-render when chapter changes */}
      <points ref={particlesRef} key={`particles-${chapter}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={currentParticles.pos}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aVelocity"
            count={PARTICLE_COUNT}
            array={currentParticles.vel}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aColor"
            count={PARTICLE_COUNT}
            array={currentParticles.colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aTarget"
            count={PARTICLE_COUNT}
            array={nextParticles.pos}
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
      style={{ background: '#030106' }}
    >
      {/* Dimmed cursor for this page */}
      <Cursor dim />

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
      <div className="absolute inset-0 flex items-center z-20 pointer-events-none justify-start pl-8 md:pl-12">
        <div className="px-4 md:px-8 max-w-md md:max-w-lg">
          {/* Glass container */}
          <div className={`relative p-10 md:p-14 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl ${
            currentChapter === 2 ? 'bg-black/60' : 'bg-black/40'
          }`}>
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-amber-500/30 rounded-tl-3xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-amber-500/30 rounded-br-3xl" />

            {/* Chapter title */}
            <RevealText delay={200} isVisible={true}>
              <h2 className="text-3xl md:text-5xl font-thin tracking-wide text-white mb-2 drop-shadow-lg">
                {chapter.title}
              </h2>
            </RevealText>

            <RevealText delay={400} isVisible={true}>
              <div className="w-20 h-px bg-gradient-to-r from-amber-500 to-transparent mb-8" />
            </RevealText>

            {/* Paragraphs */}
            <div className="space-y-6">
              {chapter.paragraphs.map((paragraph, idx) => (
                <RevealText key={idx} delay={700 + idx * 400} isVisible={true}>
                  <p className="text-base md:text-lg font-light leading-relaxed text-white/90 tracking-wide">
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
                  className="inline-block mt-10 px-8 py-4 rounded-full border border-amber-500/50 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 transition-all duration-300 text-sm tracking-[0.2em] uppercase pointer-events-auto"
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
