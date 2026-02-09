import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import LivingRockExperience from './components/LivingRockExperience';
import Cursor from './components/Cursor';
import OurPhilosophy from './components/OurPhilosophy';
import OmbrixaProject from './components/OmbrixaProject';

// --- COMPONENTS ---

const FadeText = ({ children, delay = 0, className = "" }: { children?: React.ReactNode, delay?: number, className?: string }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <span className={`transition-all duration-1000 ease-out transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}>
      {children}
    </span>
  );
};

const SidebarNav = ({ progress }: { progress: number }) => {
  const chapters = [
    { id: 0, label: "ORIGIN" },
    { id: 1, label: "TOOL" },
    { id: 2, label: "ASCENT" },
    { id: 3, label: "SYSTEM" },
    { id: 4, label: "FUTURE" },
  ];

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-6 mix-blend-difference text-[#FDFBF7]">
      <div className="w-px h-32 bg-white/20 absolute right-[5px] -top-32" />
      {chapters.map((chapter, idx) => {
        // Map progress (0-1) to 5 chapters (0, 0.25, 0.5, 0.75, 1)
        const target = idx / 4;
        const isActive = Math.abs(progress - target) < 0.125;
        
        return (
          <div key={chapter.id} className="flex items-center gap-4 transition-all duration-500">
            <span className={`text-[10px] tracking-[0.2em] font-medium transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 translate-x-4'}`}>
              {chapter.id + 1} . {chapter.label}
            </span>
            <div className={`w-2.5 h-2.5 rounded-full border border-white transition-all duration-500 ${isActive ? 'bg-white scale-100' : 'bg-transparent scale-75 opacity-40'}`} />
          </div>
        );
      })}
      <div className="w-px h-32 bg-white/20 absolute right-[5px] -bottom-32" />
    </div>
  );
};

function HomePage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  // Use ref for mouse position to avoid re-renders
  const mousePos = useRef(new THREE.Vector2(0, 0));
  // Store scroll container ref for direct access in animation loop
  const scrollRef = useRef({ progress: 0 });

  useEffect(() => {
    const calculateProgress = () => {
      if (!scrollContainerRef.current) return 0;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) return 0;
      return Math.min(Math.max(scrollTop / maxScroll, 0), 0.9999);
    };

    const handleScroll = () => {
      const progress = calculateProgress();
      scrollRef.current.progress = progress;
      setScrollProgress(progress);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }
    return () => {
      container?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate Normalized Device Coordinates (-1 to 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mousePos.current.set(x, y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#1a0c05] text-[#FDFBF7] font-sans selection:bg-[#B06520] selection:text-white">
      
      <Cursor />
      <SidebarNav progress={scrollProgress} />

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
          <LivingRockExperience scrollProgress={scrollProgress} mouse={mousePos.current} scrollContainerRef={scrollContainerRef} />
        </Canvas>
      </div>

      {/* Content Scroller */}
      <div 
        ref={scrollContainerRef}
        className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth"
      >
        
        {/* 01 ORIGIN */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative p-12">
          <div className="max-w-xl text-center space-y-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.8),_0_4px_40px_rgba(0,0,0,0.6)]">
            <h1 className="text-xs font-bold tracking-[0.4em] uppercase opacity-60">
              <FadeText delay={200}>Chapter I : The Dreamtime</FadeText>
            </h1>
            <p className="text-4xl md:text-6xl font-thin leading-[1.1] tracking-tight">
              <FadeText delay={500}>In the beginning,</FadeText><br/>
              <span className="opacity-80"><FadeText delay={1000}>there was void.</FadeText></span>
            </p>
            <p className="text-sm md:text-base font-light tracking-widest uppercase opacity-70 mt-8">
              <FadeText delay={1500}>From the void came humans.</FadeText>
            </p>
          </div>
          <div className="absolute bottom-12 w-px h-16 bg-gradient-to-b from-white/0 via-white/50 to-white/0 animate-pulse" />
        </section>

        {/* 02 TOOL */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative p-12">
          <div className="max-w-3xl text-center space-y-12 z-10 [text-shadow:_0_2px_20px_rgba(0,0,0,0.8),_0_4px_40px_rgba(0,0,0,0.6)]">
            <p className="text-xl md:text-2xl font-light tracking-wide opacity-80">
              And from humans came the first technology:
            </p>
            <h2 className="text-6xl md:text-9xl font-thin tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 [text-shadow:none] drop-shadow-[0_4px_30px_rgba(255,255,255,0.3)]">
              THE STICK
            </h2>
            <div className="w-12 h-px bg-white/50 mx-auto" />
            <p className="text-lg md:text-xl leading-relaxed font-light tracking-wide opacity-90 max-w-lg mx-auto">
              A tool that let us leave the ground,<br/>
              cross new terrain,<br/>
              and discover what we couldn't reach alone.
            </p>
          </div>
        </section>

        {/* 03 ASCENT */}
        <section className="h-screen w-full flex flex-row items-center justify-start snap-start relative p-12 md:pl-32">
          <div className="max-w-lg text-left space-y-8 z-10 [text-shadow:_0_2px_20px_rgba(0,0,0,0.8),_0_4px_40px_rgba(0,0,0,0.6)] backdrop-blur-[2px] bg-black/10 p-8 rounded-lg">
            <div className="w-8 h-px bg-white/50 mb-8" />
            <p className="text-sm font-bold tracking-[0.3em] uppercase opacity-60">
              Shared Learning
            </p>
            <blockquote className="text-3xl md:text-4xl font-extralight leading-snug">
              "A tool learns from the world through us."
            </blockquote>
            <p className="text-base font-light opacity-70 leading-relaxed">
              As we reached higher, we learned something simple and powerful.
              Through shared learning, it carries us beyond our old limits.
            </p>
          </div>
        </section>

        {/* 04 SYSTEM */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative p-12">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] border border-white/5 rounded-full pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] border border-white/10 rounded-full pointer-events-none" />

          <div className="max-w-4xl text-center z-10 space-y-8 [text-shadow:_0_2px_20px_rgba(0,0,0,0.8),_0_4px_40px_rgba(0,0,0,0.6)]">
            <h3 className="text-4xl md:text-6xl font-light tracking-tight">
              Walking Stick Labs
            </h3>
            <p className="text-sm tracking-[0.4em] uppercase opacity-60">
              System Architecture & Intelligence
            </p>
            <p className="max-w-xl mx-auto text-lg font-light opacity-80 pt-8">
              Today, we're building the next version of that tool. One that pushes us beyond our current limits and into new realities.
            </p>
          </div>
        </section>

        {/* 05 FUTURE */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative p-12">
          <div className="z-10 flex flex-col items-center gap-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.8),_0_4px_40px_rgba(0,0,0,0.6)]">
            <h2 className="text-5xl md:text-7xl font-thin tracking-tighter">
              Come walk with us.
            </h2>

            <button className="group relative px-12 py-4 bg-transparent overflow-hidden rounded-full transition-all hover:scale-105">
              <div className="absolute inset-0 border border-white/30 rounded-full group-hover:border-white/80 transition-colors duration-500" />
              <div className="absolute inset-0 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left opacity-10" />
              <span className="relative text-sm font-bold tracking-[0.3em] uppercase group-hover:text-white transition-colors">
                Learn More
              </span>
            </button>

            <a
              href="#/philosophy"
              className="group relative mt-4 px-8 py-3 bg-transparent overflow-hidden rounded-full transition-all hover:scale-105"
            >
              <div className="absolute inset-0 border border-white/20 rounded-full group-hover:border-white/60 transition-colors duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 to-orange-900/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              <span className="relative text-xs font-medium tracking-[0.25em] uppercase opacity-70 group-hover:opacity-100 transition-opacity">
                Our Philosophy &rarr;
              </span>
            </a>

            <div className="mt-16 text-[10px] tracking-[0.3em] opacity-40 uppercase flex flex-col items-center gap-2">
              <span>San Francisco — CA</span>
              <span>&copy; Walking Stick Labs</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// Simple hash-based router
export default function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Route to different pages based on hash
  if (route === '#/philosophy') {
    return <OurPhilosophy />;
  }

  if (route === '#/projects/ombrixa') {
    return <OmbrixaProject />;
  }

  return <HomePage />;
}