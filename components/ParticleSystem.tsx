import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// Custom Shader Material
const ParticleMorphMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color('#FDFBF7'),
        uProgress: 0,
        uPixelRatio: 1,
        uScale: 1,
    },
    // Vertex Shader
    `
    uniform float uTime;
    uniform float uProgress;
    uniform float uPixelRatio;
    uniform float uScale;
    
    attribute vec3 target;
    attribute float attrIndex;
    
    varying float vAlpha;
    
    // Simplex noise function (simplified)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      
      // First corner
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      
      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
      vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
      
      // Permutations
      i = mod289(i); 
      vec4 p = permute( permute( permute( 
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
               
      // Gradients: 7x7 points over a square, mapped onto an octahedron.
      // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
      float n_ = 0.142857142857; // 1.0/7.0
      vec3  ns = n_ * D.wyz - D.xzx;
      
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
      
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
      
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      
      //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
      //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      
      //Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      // Mix positions
      vec3 mixedPos = mix(position, target, uProgress);
      
      // Add noise movement
      float noiseFreq = 0.5;
      float noiseAmp = 0.1;
      vec3 noisePos = vec3(
        mixedPos.x + uTime * 0.1,
        mixedPos.y + uTime * 0.15,
        mixedPos.z + uTime * 0.05
      );
      
      float n = snoise(noisePos * noiseFreq + attrIndex);
      mixedPos += n * noiseAmp;
      
      vec4 mvPosition = modelViewMatrix * vec4(mixedPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = uScale * uPixelRatio * (100.0 / -mvPosition.z);
      
      // Fade out based on distance or noise
      vAlpha = 0.6 + 0.4 * n;
    }
  `,
    // Fragment Shader
    `
    uniform vec3 uColor;
    varying float vAlpha;
    
    void main() {
      // Circular particle
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
      
      if (alpha < 0.01) discard;
      
      gl_FragColor = vec4(uColor, alpha * vAlpha);
    }
  `
);

extend({ ParticleMorphMaterial });

interface ParticleSystemProps {
    currentPoints: Float32Array;
    targetPoints: Float32Array;
    progress: number;
    color?: string;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
    currentPoints,
    targetPoints,
    progress,
    color = '#FDFBF7'
}) => {
    const meshRef = useRef<THREE.Points>(null);
    const materialRef = useRef<any>(null);

    // Create geometry attributes
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(currentPoints, 3));
        geo.setAttribute('target', new THREE.BufferAttribute(targetPoints, 3));

        // Add random index for noise variation
        const count = currentPoints.length / 3;
        const indices = new Float32Array(count);
        for (let i = 0; i < count; i++) indices[i] = Math.random() * 100;
        geo.setAttribute('attrIndex', new THREE.BufferAttribute(indices, 1));

        return geo;
    }, [currentPoints, targetPoints]);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;
            materialRef.current.uProgress = progress;
            materialRef.current.uPixelRatio = Math.min(window.devicePixelRatio, 2);
        }
    });

    return (
        <points ref={meshRef} geometry={geometry}>
            {/* @ts-ignore */}
            <particleMorphMaterial
                ref={materialRef}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                uColor={new THREE.Color(color)}
                uScale={2.0}
            />
        </points>
    );
};
