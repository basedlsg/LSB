import * as THREE from 'three';

// Configuration
export const PARTICLE_COUNT = 15000;

// Helper to get random point in sphere
const randomInSphere = (radius: number) => {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = Math.cbrt(Math.random()) * radius;
    return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
    );
};

// 1. STICK GENERATOR
export const getStickPoints = (count: number = PARTICLE_COUNT): Float32Array => {
    const points = new Float32Array(count * 3);
    const radius = 0.15;
    const height = 4.0;

    for (let i = 0; i < count; i++) {
        // Distribute points along a cylinder with some noise/roughness
        const h = (Math.random() - 0.5) * height;
        const angle = Math.random() * Math.PI * 2;
        // Vary radius slightly for "organic" stick look
        const r = radius * (0.8 + Math.random() * 0.4);

        // Add some "knots" or irregularities
        const knot = Math.sin(h * 3) * 0.05;

        points[i * 3] = (r + knot) * Math.cos(angle);
        points[i * 3 + 1] = h;
        points[i * 3 + 2] = (r + knot) * Math.sin(angle);
    }
    return points;
};

// 2. TEXT GENERATOR
export const getTextPoints = (text: string, count: number = PARTICLE_COUNT): Float32Array => {
    const points = new Float32Array(count * 3);

    // Create a canvas to draw text
    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return points;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 150px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Handle multi-line text if needed, for now assume single centered line or wrap manually
    const lines = text.split('\n');
    const lineHeight = 160;
    const startY = size / 2 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, i) => {
        ctx.fillText(line, size / 2, startY + i * lineHeight);
    });

    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    const validPixels: number[] = [];

    // Sample valid pixels
    for (let i = 0; i < size * size; i++) {
        if (data[i * 4] > 128) { // If pixel is bright enough
            validPixels.push(i);
        }
    }

    // Distribute particles among valid pixels
    for (let i = 0; i < count; i++) {
        const pixelIndex = validPixels[Math.floor(Math.random() * validPixels.length)];
        const x = (pixelIndex % size) / size;
        const y = Math.floor(pixelIndex / size) / size;

        // Map to 3D space (-4 to 4 width approx)
        points[i * 3] = (x - 0.5) * 8;
        points[i * 3 + 1] = -(y - 0.5) * 8; // Flip Y
        points[i * 3 + 2] = (Math.random() - 0.5) * 0.2; // Slight depth
    }

    return points;
};

// 3. TERRAIN GENERATOR
export const getTerrainPoints = (count: number = PARTICLE_COUNT): Float32Array => {
    const points = new Float32Array(count * 3);
    const width = 10;
    const depth = 6;

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * width;
        const z = (Math.random() - 0.5) * depth;

        // Simple noise function for mountains (sum of sines)
        const y = Math.sin(x * 1.5) * 0.5 + Math.cos(z * 1.2) * 0.5 + Math.sin(x * 4 + z * 2) * 0.2 - 2.0;

        points[i * 3] = x;
        points[i * 3 + 1] = y;
        points[i * 3 + 2] = z;
    }
    return points;
};

// 4. ICON GENERATORS

// Map: A flat plane with some grid-like structure
export const getMapPoints = (count: number = PARTICLE_COUNT): Float32Array => {
    const points = new Float32Array(count * 3);
    const size = 4;

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * size;
        const y = (Math.random() - 0.5) * size * 0.7; // Aspect ratio

        // Grid lines logic
        const isGrid = Math.abs(x % 0.5) < 0.05 || Math.abs(y % 0.5) < 0.05;
        const z = isGrid ? 0.1 : (Math.random() - 0.5) * 0.05;

        points[i * 3] = x;
        points[i * 3 + 1] = y;
        points[i * 3 + 2] = z;
    }
    return points;
};

// Compass: A ring and a needle
export const getCompassPoints = (count: number = PARTICLE_COUNT): Float32Array => {
    const points = new Float32Array(count * 3);
    const ringCount = Math.floor(count * 0.7);
    const needleCount = count - ringCount;
    const radius = 2.0;

    // Ring
    for (let i = 0; i < ringCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = radius + (Math.random() - 0.5) * 0.2;
        points[i * 3] = r * Math.cos(angle);
        points[i * 3 + 1] = r * Math.sin(angle);
        points[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }

    // Needle
    for (let i = 0; i < needleCount; i++) {
        const t = Math.random(); // 0 to 1
        // Diamond shape needle
        const w = (1 - Math.abs(t - 0.5) * 2) * 0.5;
        const x = (Math.random() - 0.5) * w;
        const y = (t - 0.5) * 3.5;

        points[(ringCount + i) * 3] = x;
        points[(ringCount + i) * 3 + 1] = y;
        points[(ringCount + i) * 3 + 2] = 0.1;
    }

    return points;
};

// Lens: A convex shape
export const getLensPoints = (count: number = PARTICLE_COUNT): Float32Array => {
    const points = new Float32Array(count * 3);
    const radius = 2.0;

    for (let i = 0; i < count; i++) {
        // Uniform distribution in circle
        const r = radius * Math.sqrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;

        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);

        // Lens curvature: z depends on distance from center
        const z = Math.sqrt(Math.max(0, radius * radius - x * x - y * y)) * 0.6;

        points[i * 3] = x;
        points[i * 3 + 1] = y;
        points[i * 3 + 2] = Math.random() > 0.5 ? z : -z * 0.2; // Asymmetric lens
    }
    return points;
};

// Question Mark
export const getQuestionMarkPoints = (count: number = PARTICLE_COUNT): Float32Array => {
    return getTextPoints("?", count);
};
