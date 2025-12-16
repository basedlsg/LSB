import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import ParticleExperience from './components/ParticleExperience';
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
    <span className={`transition-all duration-1000 ease-out transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}>
      {children}
    </span>
  );
};

const SidebarNav = ({ progress }: { progress: number }) => {
  const chapters = [
    { id: 0, label: "DREAMTIME" },
    { id: 1, label: "TEACHER" },
    { id: 2, label: "LEARNING" },
    { id: 3, label: "NEW TEACHER" },
    { id: 4, label: "LAB" },
    { id: 5, label: "PATH" },
  ];

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-6 mix-blend-difference text-[#FDFBF7]">
      <div className="w-px h-32 bg-white/20 absolute right-[5px] -top-32" />
      {chapters.map((chapter, idx) => {
        // Map progress (0-1) to 6 chapters
        const target = idx / 5;
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
          <ParticleExperience scrollProgress={scrollProgress} mouse={mousePos.current} scrollContainerRef={scrollContainerRef} />
        </Canvas>
      </div>

      {/* Content Scroller */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth"
      >

        {/* 01 DREAMTIME */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative p-12">
          <div className="max-w-2xl text-center space-y-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.8),_0_4px_40px_rgba(0,0,0,0.6)]">
            <h1 className="text-xs font-bold tracking-[0.4em] uppercase opacity-60">
              <FadeText delay={200}>Chapter I : The Dreamtime</FadeText>
            </h1>
            <p className="text-4xl md:text-6xl font-thin leading-[1.1] tracking-tight italic">
              <FadeText delay={500}>In the beginning,</FadeText><br />
              <span className="opacity-80"><FadeText delay={1000}>there was space.</FadeText></span>
            </p>
            <p className="text-sm md:text-base font-light leading-relaxed opacity-70 mt-8">
              <FadeText delay={1500}>Before paths. Before edges. Before maps.</FadeText><br />
              <FadeText delay={2000}>And into this space, humans arrived.</FadeText>
            </p>
          </div>
          <div className="absolute bottom-12 w-px h-16 bg-gradient-to-b from-white/0 via-white/50 to-white/0 animate-pulse" />
        </section>

        {/* 02 THE STICK */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative p-12">
          <div className="max-w-6xl text-center space-y-16 z-10 [text-shadow:_0_2px_20px_rgba(0,0,0,0.8),_0_4px_40px_rgba(0,0,0,0.6)]">
            <h2 className="text-8xl md:text-[12rem] lg:text-[16rem] font-thin tracking-tight leading-none opacity-0">
              THE STICK
            </h2>
            <p className="text-xl md:text-2xl font-light opacity-60 tracking-wide">
              The first tool.
            </p>
          </div>
        </section>

        {/* 03 THE GROUND */}
        <section className="h-screen w-full flex items-center justify-center snap-start relative p-12">
          <div className="max-w-5xl text-center z-10 [text-shadow:_0_2px_20px_rgba(0,0,0,0.8),_0_4px_40px_rgba(0,0,0,0.6)]">
            <blockquote className="text-4xl md:text-6xl lg:text-7xl font-light leading-[1.2] tracking-tight italic">
              "Through the stick,<br />
              the ground taught us<br />
              its shape."
            </blockquote>
          </div>
        </section>

        {/* 04 EVOLUTION */}
        <section className="h-screen w-full flex items-center justify-center snap-start relative p-12">
          <div className="max-w-6xl text-center space-y-20 z-10 [text-shadow:_0_2px_20px_rgba(0,0,0,0.8),_0_4px_40px_rgba(0,0,0,0.6)]">
            <div className="text-3xl md:text-5xl lg:text-6xl font-thin tracking-wider opacity-90">
              stick → map → compass → lens → ?
            </div>
            <p className="text-xl md:text-2xl font-light opacity-60">
              Evolution continues.
            </p>
          </div>
        </section>

        {/* 05 THE LAB */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative p-12">
          <div className="max-w-6xl text-center z-10 space-y-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.8),_0_4px_40px_rgba(0,0,0,0.6)]">
            <h3 className="text-6xl md:text-8xl lg:text-9xl font-thin tracking-tight leading-none opacity-0">
              Walking Stick Labs
            </h3>
            <div className="text-2xl md:text-3xl font-light opacity-80 leading-relaxed space-y-2">
              <p>Building tools</p>
              <p>that teach machines</p>
              <p>to understand space.</p>
            </div>
          </div>
        </section>

        {/* 06 THE PATH */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative p-6 md:p-12">
          {/* Title - centered */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xs font-bold tracking-[0.4em] uppercase opacity-60 mb-8 [text-shadow:_0_2px_20px_rgba(0,0,0,0.8)]"
          >
            Chapter VI : The Path
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="z-10 text-4xl md:text-5xl lg:text-7xl font-thin tracking-tighter text-center [text-shadow:_0_2px_20px_rgba(0,0,0,0.8),_0_4px_40px_rgba(0,0,0,0.6)]"
          >
            Come Walk With Us.
          </motion.h2>

          {/* Two buttons - clean and readable */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6 mt-12 md:mt-16"
          >

            {/* Our Research - Primary CTA */}
            <motion.a
              href="#/work"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-8 md:px-10 py-3 md:py-4 bg-white/10 backdrop-blur-sm rounded-full overflow-hidden transition-colors duration-300 hover:bg-white/20"
            >
              <div className="absolute inset-0 border border-white/40 rounded-full group-hover:border-white/80 transition-colors duration-300" />
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative text-xs md:text-sm font-medium tracking-[0.2em] uppercase [text-shadow:_0_1px_10px_rgba(0,0,0,0.8)]">
                Our Research
              </span>
            </motion.a>

            {/* Our Story - Secondary CTA */}
            <motion.a
              href="#/philosophy"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-8 md:px-10 py-3 md:py-4 bg-white/5 backdrop-blur-sm rounded-full overflow-hidden transition-colors duration-300 hover:bg-white/15"
            >
              <div className="absolute inset-0 border border-white/30 rounded-full group-hover:border-white/70 transition-colors duration-300" />
              <span className="relative text-xs md:text-sm font-medium tracking-[0.2em] uppercase [text-shadow:_0_1px_10px_rgba(0,0,0,0.8)]">
                Our Story
              </span>
            </motion.a>

          </motion.div>

          {/* Footer - absolute bottom center */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.4 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, delay: 1.2 }}
            className="absolute bottom-6 md:bottom-8 left-0 right-0 z-10 text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] uppercase flex flex-col items-center gap-1 md:gap-2 [text-shadow:_0_2px_20px_rgba(0,0,0,0.8),_0_4px_40px_rgba(0,0,0,0.6)]"
          >
            <span>San Francisco — Beijing</span>
            <span>&copy; Walking Stick Labs</span>
          </motion.div>
        </section>

      </div>
    </div>
  );
}

// Simple hash-based router
import { AnimatePresence, motion } from 'framer-motion';

const PageWrapper = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{
      duration: 0.4,
      ease: "easeInOut"
    }}
    className={`w-full h-full ${className}`}
    style={{ willChange: 'opacity' }}
  >
    {children}
  </motion.div>
);

export default function App() {
  const [route, setRoute] = useState(() => {
    // Normalize hash on initial load
    const hash = window.location.hash || '#/';
    return hash.split('?')[0].split('&')[0]; // Remove query params if any
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      const cleanHash = hash.split('?')[0].split('&')[0]; // Remove query params
      setRoute(cleanHash);
    };

    window.addEventListener('hashchange', handleHashChange);
    // Handle initial load
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const getPage = () => {
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
  };

  return (
    <AnimatePresence mode="wait">
      <PageWrapper key={route}>
        {getPage()}
      </PageWrapper>
    </AnimatePresence>
  );
}