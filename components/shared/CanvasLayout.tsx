import React, { useRef } from 'react';
import { useAppStore } from '../../store';
import { Canvas } from '@react-three/fiber';
import { View, Preload } from '@react-three/drei';
import LivingRockExperience from '../LivingRockExperience';

interface CanvasLayoutProps {
  children: React.ReactNode;
}

/**
 * CanvasLayout provides a single persistent R3F Canvas for the entire application.
 * Individual pages use the 'View' component from @react-three/drei to "portal"
 * their 3D scenes into specific DOM elements while sharing one WebGL context.
 */
const CanvasLayout = ({ children }: CanvasLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useAppStore(state => state.scrollProgress);
  const mousePos = useAppStore(state => state.mousePos);
  const route = useAppStore(state => state.route);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#030106]">
      {/* Persistent Canvas */}
      <div className="fixed inset-0 z-0">
        <Canvas
          shadows
          camera={{ position: [0, 0, 5], fov: 45 }}
          dpr={[1, 2]}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
          }}
        >
          {route === '#/' && (
            <LivingRockExperience
              scrollProgress={scrollProgress}
              mouse={mousePos}
            />
          )}
          
          {/* Optimization: Helps with shader compilation overhead */}
          <Preload all />
        </Canvas>
      </div>

      {/* Main UI Layer */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default CanvasLayout;
