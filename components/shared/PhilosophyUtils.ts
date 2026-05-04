const PARTICLE_COUNT = 12000;

export const generatePhilosophyPositions = () => {
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
          // CHAPTER I: THE DREAMING
          const isCore = t > 0.7;
          if (isCore) {
            const coreAngle = Math.random() * Math.PI * 2;
            const coreRadius = Math.pow(Math.random(), 1.5) * 1.5;
            pos[idx] = Math.cos(coreAngle) * coreRadius;
            pos[idx + 1] = Math.sin(coreAngle) * coreRadius;
            pos[idx + 2] = (Math.random() - 0.5) * 0.8;
            colors[idx] = 1.0;
            colors[idx + 1] = 0.9 + Math.random() * 0.1;
            colors[idx + 2] = 0.6 + Math.random() * 0.3;
          } else {
            const armCount = 5;
            const armId = i % armCount;
            const armOffset = (armId / armCount) * Math.PI * 2;
            const streamProgress = (t / 0.7);
            const spiralAngle = streamProgress * Math.PI * 4 + armOffset;
            const spiralRadius = 4.5 - streamProgress * 3.5;
            pos[idx] = Math.cos(spiralAngle) * spiralRadius + (Math.random() - 0.5) * 0.3;
            pos[idx + 1] = Math.sin(spiralAngle) * spiralRadius + (Math.random() - 0.5) * 0.3;
            pos[idx + 2] = (Math.random() - 0.5) * 1.5;
            const brightness = streamProgress * 0.5;
            colors[idx] = 0.3 + brightness * 0.5;
            colors[idx + 1] = 0.15 + brightness * 0.3;
            colors[idx + 2] = 0.5 + brightness * 0.3;
          }
          break;
        }
        case 1: {
          // CHAPTER II: The Age of Asking
          const phase = t;
          if (phase < 0.35) {
            const radius = Math.pow(Math.random(), 0.45) * 6.8;
            const angle = Math.random() * Math.PI * 2.0;
            pos[idx] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.18;
            pos[idx + 1] = ((Math.random() - 0.5) * 6.2) * 0.55;
            pos[idx + 2] = Math.sin(angle) * radius * 0.55 + (Math.random() - 0.5) * 1.3;
            pos[idx + 1] += Math.sin(pos[idx] * 0.35 + pos[idx + 2] * 0.6) * 0.2;
            const tone = Math.random();
            if (tone > 0.82) {
              colors[idx] = 1.0; colors[idx + 1] = 0.82 + Math.random() * 0.16; colors[idx + 2] = 0.56 + Math.random() * 0.18;
            } else if (tone > 0.56) {
              colors[idx] = 0.86 + Math.random() * 0.14; colors[idx + 1] = 0.88 + Math.random() * 0.12; colors[idx + 2] = 0.9 + Math.random() * 0.1;
            } else {
              colors[idx] = 0.66 + Math.random() * 0.16; colors[idx + 1] = 0.78 + Math.random() * 0.18; colors[idx + 2] = 0.94 + Math.random() * 0.06;
            }
          } else if (phase < 0.88) {
            const local = (phase - 0.35) / 0.53;
            const inDot = local > 0.84;
            let qx = 0, qy = 0;
            if (!inDot) {
              const curveT = Math.pow(local / 0.84, 0.72);
              const angle = 2.55 - curveT * 3.38;
              const radius = 0.62 + (1.0 - curveT) * 1.1;
              qx = 2.85 + Math.cos(angle) * radius;
              qy = 1.35 + Math.sin(angle) * radius;
              if (curveT > 0.58) {
                const hook = (curveT - 0.58) / 0.42;
                qx -= hook * 0.45; qy -= hook * 1.12;
              }
            } else {
              qx = 2.78 + (Math.random() - 0.5) * 0.1; qy = -0.22 + (Math.random() - 0.5) * 0.1;
            }
            const width = inDot ? 0.09 : (0.06 + (1.0 - local) * 0.1);
            pos[idx] = qx + (Math.random() - 0.5) * width;
            pos[idx + 1] = qy + (Math.random() - 0.5) * width;
            pos[idx + 2] = (Math.random() - 0.5) * 0.28;
            colors[idx] = 1.0; colors[idx + 1] = 0.86 + Math.random() * 0.12; colors[idx + 2] = 0.62 + Math.random() * 0.22;
          } else {
            const local = (phase - 0.88) / 0.12;
            const shapeRoll = Math.random();
            let sx = 0, sy = 0;
            if (shapeRoll < 0.28) {
              const a = Math.random() * Math.PI * 2.0;
              const rx = 0.52, ry = 0.66;
              sx = 2.55 + Math.cos(a) * rx * (0.72 + Math.random() * 0.28);
              sy = -1.05 + Math.sin(a) * ry * (0.72 + Math.random() * 0.28);
            } else if (shapeRoll < 0.74) {
              const u = Math.random() * Math.PI * 2.0;
              const rr = Math.sqrt(Math.random());
              sx = 2.45 + Math.cos(u) * 1.12 * rr;
              sy = -2.35 + Math.sin(u) * 0.95 * rr;
            } else {
              const s = Math.random();
              sx = 1.65 + s * 2.0 + Math.sin(s * 10.0) * 0.22;
              sy = -2.9 + Math.sin(s * Math.PI) * 0.82 + Math.sin(s * 7.0) * 0.14;
            }
            pos[idx] = sx + (Math.random() - 0.5) * 0.12;
            pos[idx + 1] = sy + (Math.random() - 0.5) * 0.12;
            pos[idx + 2] = (Math.random() - 0.5) * 0.42;
            const dustGlow = 0.68 + local * 0.22 + Math.random() * 0.1;
            colors[idx] = 0.92 * dustGlow; colors[idx + 1] = 0.78 * dustGlow; colors[idx + 2] = 0.5 * dustGlow;
          }
          break;
        }
        case 2: {
          // CHAPTER III: THE SACRED STRIKE
          const element = t < 0.2 ? 'rock' : t < 0.6 ? 'beings' : t < 0.8 ? 'stick' : 'lightning';
          if (element === 'rock') {
            const rockAngle = Math.random() * Math.PI * 2;
            const rockRadius = Math.pow(Math.random(), 0.5) * 1.2;
            const rockHeight = (Math.random() - 0.5) * 0.6;
            pos[idx] = Math.cos(rockAngle) * rockRadius;
            pos[idx + 1] = -2.0 + rockHeight;
            pos[idx + 2] = Math.sin(rockAngle) * rockRadius * 0.4;
            colors[idx] = 0.3 + Math.random() * 0.15; colors[idx + 1] = 0.25 + Math.random() * 0.1; colors[idx + 2] = 0.2 + Math.random() * 0.1;
          } else if (element === 'beings') {
            const beingNum = Math.floor((t - 0.2) / 0.133);
            const beingAngle = (beingNum / 3) * Math.PI * 2 - Math.PI / 2;
            const beingDist = 2.2;
            const beingX = Math.cos(beingAngle) * beingDist;
            const localT = ((t - 0.2) % 0.133) / 0.133;
            let localX = 0, localY = 0;
            if (localT < 0.25) {
              const headAngle = Math.random() * Math.PI * 2;
              localX = Math.cos(headAngle) * 0.2; localY = 1.8 + Math.sin(headAngle) * 0.2;
            } else if (localT < 0.6) {
              localX = (Math.random() - 0.5) * 0.4; localY = 0.8 + Math.random() * 0.9;
            } else {
              localX = (Math.random() - 0.5) * 0.3; localY = Math.random() * 0.7;
            }
            pos[idx] = beingX + localX; pos[idx + 1] = -1.8 + localY; pos[idx + 2] = Math.sin(beingAngle) * 0.5 + (Math.random() - 0.5) * 0.15;
            colors[idx] = 0.9 + Math.random() * 0.1; colors[idx + 1] = 0.5 + Math.random() * 0.2; colors[idx + 2] = 0.2 + Math.random() * 0.1;
          } else if (element === 'stick') {
            const stickT = (t - 0.6) / 0.2;
            const stickX = -1.5 + stickT * 1.5;
            const stickY = 2.5 - stickT * 4.5;
            pos[idx] = stickX + (Math.random() - 0.5) * 0.15; pos[idx + 1] = stickY + (Math.random() - 0.5) * 0.15; pos[idx + 2] = (Math.random() - 0.5) * 0.1;
            colors[idx] = 0.7 + Math.random() * 0.2; colors[idx + 1] = 0.4 + Math.random() * 0.15; colors[idx + 2] = 0.15 + Math.random() * 0.1;
          } else {
            const boltT = (t - 0.8) / 0.2;
            const boltY = 3.5 - boltT * 5.5;
            const boltZigzag = Math.sin(boltY * 5) * 0.5 + Math.sin(boltY * 12) * 0.2;
            pos[idx] = boltZigzag + (Math.random() - 0.5) * 0.25; pos[idx + 1] = boltY; pos[idx + 2] = (Math.random() - 0.5) * 0.15;
            colors[idx] = 1.0; colors[idx + 1] = 0.95 + Math.random() * 0.05; colors[idx + 2] = 0.7 + Math.random() * 0.3;
          }
          break;
        }
        case 3: {
          // CHAPTER IV: THE AGE OF WALKING
          const pathT = t;
          const totalRotations = 3;
          const angle = pathT * Math.PI * 2 * totalRotations;
          const radius = 2.0 + Math.sin(pathT * Math.PI * 4) * 0.5;
          const height = -3.0 + pathT * 6.0;
          pos[idx] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.3;
          pos[idx + 1] = height + (Math.random() - 0.5) * 0.2;
          pos[idx + 2] = Math.sin(angle) * radius * 0.5 + (Math.random() - 0.5) * 0.2;
          if (pathT < 0.33) {
            const waterT = pathT / 0.33;
            colors[idx] = 0.1 + waterT * 0.3; colors[idx + 1] = 0.3 + waterT * 0.2; colors[idx + 2] = 0.7 + waterT * 0.1;
          } else if (pathT < 0.66) {
            const earthT = (pathT - 0.33) / 0.33;
            colors[idx] = 0.4 + earthT * 0.5; colors[idx + 1] = 0.5 + earthT * 0.3; colors[idx + 2] = 0.3 - earthT * 0.1;
          } else {
            const skyT = (pathT - 0.66) / 0.34;
            colors[idx] = 0.9 + skyT * 0.1; colors[idx + 1] = 0.8 + skyT * 0.15; colors[idx + 2] = 0.2 + skyT * 0.6;
          }
          break;
        }
        case 4: {
          // CHAPTER V: THE ETERNAL DREAMING
          const isFirstSpiral = i % 2 === 0;
          const spiralT = t;
          const totalLoops = 2;
          const angle = spiralT * Math.PI * 2 * totalLoops;
          const spiralOffset = isFirstSpiral ? 0 : Math.PI;
          const finalAngle = angle + spiralOffset;
          const baseRadius = 0.5 + spiralT * 2.5;
          const radius = baseRadius + Math.sin(spiralT * Math.PI * 8) * 0.2;
          pos[idx] = Math.cos(finalAngle) * radius + (Math.random() - 0.5) * 0.15;
          pos[idx + 1] = Math.sin(finalAngle) * radius + (Math.random() - 0.5) * 0.15;
          pos[idx + 2] = (Math.random() - 0.5) * 0.3 + (isFirstSpiral ? 0.1 : -0.1);
          if (isFirstSpiral) {
            const brightness = 0.8 + spiralT * 0.2;
            colors[idx] = 1.0; colors[idx + 1] = 0.95 * brightness; colors[idx + 2] = 0.85 * brightness;
          } else {
            const warmth = 0.7 + spiralT * 0.3;
            colors[idx] = 1.0 * warmth; colors[idx + 1] = 0.7 * warmth; colors[idx + 2] = 0.3 * warmth;
          }
          break;
        }
      }
      vel[idx] = (Math.random() - 0.5) * 0.015;
      vel[idx + 1] = (Math.random() - 0.5) * 0.015;
      vel[idx + 2] = (Math.random() - 0.5) * 0.015;
    }
    positions.push({ pos, vel, colors });
  }
  return positions;
};

export const generatePhilosophyAmbientParticles = () => {
  const count = 12000;
  const pos = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scales = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    pos[idx] = (Math.random() - 0.5) * 15.0;
    pos[idx + 1] = (Math.random() - 0.5) * 8.2;
    pos[idx + 2] = -8.0 + Math.random() * 15.0;

    const warmChance = Math.random();
    if (warmChance > 0.85) {
      colors[idx] = 1.0; colors[idx + 1] = 0.9 + Math.random() * 0.1; colors[idx + 2] = 0.68 + Math.random() * 0.2;
    } else if (warmChance > 0.5) {
      colors[idx] = 0.9 + Math.random() * 0.1; colors[idx + 1] = 0.93 + Math.random() * 0.07; colors[idx + 2] = 0.95 + Math.random() * 0.05;
    } else {
      colors[idx] = 0.72 + Math.random() * 0.16; colors[idx + 1] = 0.84 + Math.random() * 0.12; colors[idx + 2] = 0.98 + Math.random() * 0.02;
    }
    scales[i] = 0.45 + Math.random() * 1.15;
  }

  return { pos, colors, scales };
};
