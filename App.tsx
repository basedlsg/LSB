import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import LivingRockExperience from './components/LivingRockExperience';
import Cursor from './components/Cursor';
import OurPhilosophy from './components/OurPhilosophy';
import CaseStudySpatialLab from './components/CaseStudySpatialLab';
import CaseStudyWhatsInTheRoom from './components/CaseStudyWhatsInTheRoom';
import Projects from './components/Projects';

// --- COMPONENTS ---

const FadeText = ({ children, delay = 0, className = "" }: { children?: React.ReactNode, delay?: number, className?: string }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <span className={`inline-block transition-all duration-1200 ease-out ${visible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-6 blur-sm'} ${className}`}>
      {children}
    </span>
  );
};

const SidebarNav = ({ progress }: { progress: number }) => {
  const chapters = [
    { id: 0, label: "ORIGIN" },
    { id: 1, label: "TOOL" },
    { id: 2, label: "WISDOM" },
    { id: 3, label: "SYSTEM" },
    { id: 4, label: "FUTURE" },
  ];

  return (
    <div className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-5">
      {/* Vertical line */}
      <div className="absolute right-[5px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      {chapters.map((chapter, idx) => {
        const target = idx / 4;
        const isActive = Math.abs(progress - target) < 0.125;
        const isPast = progress > target + 0.1;

        return (
          <div key={chapter.id} className="flex items-center gap-3 transition-all duration-700">
            <span className={`text-[9px] tracking-[0.25em] font-light transition-all duration-700 ${
              isActive ? 'opacity-90 translate-x-0' : 'opacity-0 translate-x-4'
            }`}>
              {chapter.label}
            </span>
            <div className={`relative w-2.5 h-2.5 rounded-full transition-all duration-500 ${
              isActive
                ? 'bg-amber-400/90 scale-110'
                : isPast
                  ? 'bg-white/30 scale-75'
                  : 'bg-white/10 scale-75'
            }`}>
              {isActive && (
                <div className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Minimal navigation
const TopNav = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 p-6 md:p-8 flex justify-between items-center">
    <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 font-light">
      Walking Stick Labs
    </div>
    <div className="flex gap-6">
      <a href="#/work" className="text-[10px] tracking-[0.3em] uppercase opacity-40 hover:opacity-90 transition-opacity font-light">
        Work
      </a>
      <a href="#/philosophy" className="text-[10px] tracking-[0.3em] uppercase opacity-40 hover:opacity-90 transition-opacity font-light">
        Story
      </a>
    </div>
  </nav>
);

function HomePage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mousePos = useRef(new THREE.Vector2(0, 0));
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
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mousePos.current.set(x, y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#080406] text-[#FDFBF7] font-sans selection:bg-amber-600/50 selection:text-white">

      <Cursor />
      <TopNav />
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

        {/* 01 ORIGIN - The Void */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative px-6 md:px-12">
          <div className="max-w-2xl text-center space-y-10">
            <div className="space-y-3">
              <FadeText delay={300}>
                <span className="text-[10px] tracking-[0.5em] uppercase opacity-40 font-light">Chapter I</span>
              </FadeText>
              <FadeText delay={500}>
                <span className="block text-[10px] tracking-[0.4em] uppercase opacity-60 font-medium">The Dreamtime</span>
              </FadeText>
            </div>

            <div className="space-y-2">
              <FadeText delay={800}>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extralight tracking-tight leading-[1.1]">
                  In the beginning,
                </h1>
              </FadeText>
              <FadeText delay={1200}>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extralight tracking-tight leading-[1.1] opacity-60">
                  there was void.
                </h1>
              </FadeText>
            </div>

            <FadeText delay={1800}>
              <p className="text-sm md:text-base font-light tracking-[0.15em] opacity-50 pt-4">
                From the void came humans.
              </p>
            </FadeText>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-12 flex flex-col items-center gap-3">
            <span className="text-[9px] tracking-[0.3em] uppercase opacity-30">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
          </div>
        </section>

        {/* 02 TOOL - The Stick */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative px-6 md:px-12">
          <div className="max-w-3xl text-center space-y-12">
            <p className="text-lg md:text-xl font-light tracking-wide opacity-60">
              And from humans came the first technology:
            </p>

            <h2 className="text-6xl md:text-8xl lg:text-9xl font-thin tracking-[-0.02em] bg-gradient-to-b from-white via-white/90 to-white/40 bg-clip-text text-transparent">
              THE STICK
            </h2>

            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto" />

            <p className="text-base md:text-lg font-light tracking-wide opacity-70 max-w-lg mx-auto leading-relaxed">
              A tool that let us leave the ground, cross new terrain,
              and discover what we couldn't reach alone.
            </p>
          </div>
        </section>

        {/* 03 WISDOM - Shared Learning */}
        <section className="h-screen w-full flex items-center snap-start relative px-6 md:px-12 lg:px-24">
          <div className="max-w-lg space-y-8 backdrop-blur-xl bg-black/30 border border-white/[0.08] p-8 md:p-12 rounded-2xl shadow-2xl">
            <div className="w-10 h-px bg-gradient-to-r from-amber-500/60 to-transparent" />

            <p className="text-[10px] tracking-[0.4em] uppercase opacity-50 font-medium">
              Shared Learning
            </p>

            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-extralight leading-snug tracking-tight">
              "A tool learns from the world through us."
            </blockquote>

            <p className="text-sm md:text-base font-light opacity-60 leading-relaxed">
              As we reached higher, we learned something simple and powerful.
              Through shared learning, it carries us beyond our old limits.
            </p>
          </div>
        </section>

        {/* 04 SYSTEM - Walking Stick Labs */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative px-6 md:px-12">
          {/* Orbital rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] border border-white/[0.03] rounded-full" />
            <div className="absolute w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] border border-white/[0.02] rounded-full" />
            <div className="absolute w-[100vw] h-[100vw] max-w-[1000px] max-h-[1000px] border border-white/[0.01] rounded-full" />
          </div>

          <div className="max-w-3xl text-center z-10 space-y-8">
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-extralight tracking-tight">
              Walking Stick Labs
            </h3>

            <p className="text-[10px] tracking-[0.5em] uppercase opacity-40">
              System Architecture & Intelligence
            </p>

            <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto" />

            <p className="max-w-xl mx-auto text-base md:text-lg font-light opacity-60 leading-relaxed pt-4">
              Today, we're building the next version of that tool.
              One that pushes us beyond our current limits and into new realities.
            </p>
          </div>
        </section>

        {/* 05 FUTURE - Come Walk With Us */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative px-6 md:px-12">
          <div className="text-center space-y-12">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-extralight tracking-tight">
              Come walk with us.
            </h2>

            {/* Action buttons */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <a
                href="#/work"
                className="group relative px-8 py-3.5 rounded-full overflow-hidden transition-all duration-500 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 border border-white/20 rounded-full group-hover:border-amber-500/50 transition-colors duration-500" />
                <span className="relative text-xs tracking-[0.25em] uppercase font-medium">
                  Our Work
                </span>
              </a>

              <a
                href="#/philosophy"
                className="group relative px-8 py-3.5 rounded-full overflow-hidden transition-all duration-500 hover:scale-105"
              >
                <div className="absolute inset-0 border border-white/10 rounded-full group-hover:border-white/30 transition-colors duration-500" />
                <span className="relative text-xs tracking-[0.25em] uppercase font-light opacity-70 group-hover:opacity-100 transition-opacity">
                  Our Story
                </span>
              </a>

              <a
                href="https://shiny-chipmunk-4c4.notion.site/Walking-Stick-Labs-76bf48c44fd34b43862f78a9d2bc3f08?pvs=74"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative px-8 py-3.5 rounded-full overflow-hidden transition-all duration-500 hover:scale-105"
              >
                <div className="absolute inset-0 border border-white/10 rounded-full group-hover:border-white/30 transition-colors duration-500" />
                <span className="relative text-xs tracking-[0.25em] uppercase font-light opacity-70 group-hover:opacity-100 transition-opacity">
                  Learn More
                </span>
              </a>
            </div>
          </div>

          {/* Footer */}
          <footer className="absolute bottom-8 left-0 right-0 text-center">
            <div className="space-y-2">
              <p className="text-[9px] tracking-[0.4em] uppercase opacity-30">
                San Francisco — Beijing
              </p>
              <p className="text-[9px] tracking-[0.3em] uppercase opacity-20">
                &copy; Walking Stick Labs
              </p>
            </div>
          </footer>
        </section>

      </div>
    </div>
  );
}

// Simple hash-based router
export default function App() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash || '#/';
    return hash.split('?')[0].split('&')[0];
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      const cleanHash = hash.split('?')[0].split('&')[0];
      setRoute(cleanHash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route === '#/philosophy') {
    return <OurPhilosophy />;
  }

  if (route === '#/work/spatial-lab') {
    return <CaseStudySpatialLab />;
  }

  if (route === '#/work/whats-in-the-room') {
    return <CaseStudyWhatsInTheRoom />;
  }

  if (route === '#/work') {
    return <Projects />;
  }

  return <HomePage />;
}
