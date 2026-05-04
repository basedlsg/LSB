import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { View, Preload } from '@react-three/drei';

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

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-screen overflow-x-hidden">
      {/* The persistent Canvas */}
      <div className="fixed inset-0 z-0 bg-[#030106]">
        <Canvas
          eventSource={containerRef}
          className="pointer-events-none"
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ 
            antialias: true, 
            powerPreference: "high-performance",
            alpha: false,
            stencil: false,
            depth: true 
          }}
          dpr={[1, 2]}
        >
          {/* This renders everything from the 'track' refs in the app */}
          <View.Port />
          
          {/* Optimization: Helps with shader compilation overhead */}
          <Preload all />
        </Canvas>
      </div>

      {/* Main Content (Pages) */}
      <div className="relative z-10 w-full h-full min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default CanvasLayout;
