import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
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

const SidebarNav = ({ progress, onNavigate }: { progress: number; onNavigate: (index: number) => void }) => {
  const chapters = [
    { id: 0, label: "ORIGIN" },
    { id: 1, label: "TOOL" },
    { id: 2, label: "ASCENT" },
    { id: 3, label: "SYSTEM" },
    { id: 4, label: "LAB" },
    { id: 5, label: "FUTURE" },
  ];

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-6 mix-blend-difference text-[#FDFBF7]">
      <div className="w-px h-32 bg-white/20 absolute right-[5px] -top-32" />
      {chapters.map((chapter, idx) => {
        // Map progress (0-1) to 6 chapters
        const target = idx / 5;
        const isActive = Math.abs(progress - target) < 0.125;

        return (
          <button
            key={chapter.id}
            onClick={() => onNavigate(idx)}
            className="flex items-center gap-4 transition-all duration-500 cursor-pointer group"
          >
            <span className={`text-[10px] tracking-[0.2em] font-medium transition-all duration-500 group-hover:opacity-100 ${isActive ? 'opacity-100' : 'opacity-0 translate-x-4'}`}>
              {String(chapter.id + 1).padStart(2, '0')} {chapter.label}
            </span>
            <div className={`w-2.5 h-2.5 rounded-full border border-white transition-all duration-500 group-hover:scale-100 group-hover:opacity-80 ${isActive ? 'bg-white scale-100' : 'bg-transparent scale-75 opacity-40'}`} />
          </button>
        );
      })}
      <div className="w-px h-32 bg-white/20 absolute right-[5px] -bottom-32" />
    </div>
  );
};

// Header component with logo
const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between mix-blend-difference">
    <a href="#/" className="text-[#FDFBF7] text-xs tracking-[0.3em] font-medium uppercase hover:opacity-70 transition-opacity">
      Walking Stick Labs
    </a>
    <nav className="hidden md:flex items-center gap-8">
      <a href="#/work" className="text-[#FDFBF7] text-[10px] tracking-[0.2em] uppercase hover:opacity-70 transition-opacity">
        Research
      </a>
      <a href="#/philosophy" className="text-[#FDFBF7] text-[10px] tracking-[0.2em] uppercase hover:opacity-70 transition-opacity">
        Philosophy
      </a>
    </nav>
  </header>
);

function HomePage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  // Use ref for mouse position to avoid re-renders
  const mousePos = useRef(new THREE.Vector2(0, 0));
  // Store scroll container ref for direct access in animation loop
  const scrollRef = useRef({ progress: 0 });

  const navigateToSection = (index: number) => {
    const section = sectionRefs.current[index];
    if (section && scrollContainerRef.current) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
      <Header />
      <SidebarNav progress={scrollProgress} onNavigate={navigateToSection} />

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/30 via-transparent to-black/40" />

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

        {/* 01 ORIGIN - The Dreamtime */}
        <section
          ref={(el) => sectionRefs.current[0] = el}
          className="h-screen w-full flex flex-col items-center justify-center snap-start relative p-8 md:p-12"
        >
          <div className="max-w-3xl text-center space-y-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-[10px] md:text-xs tracking-[0.4em] uppercase font-medium"
            >
              Chapter I
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.4 }}
              className="text-5xl md:text-7xl lg:text-8xl font-extralight leading-[1.05] tracking-tight"
            >
              In the beginning,<br />
              <span className="opacity-70 italic">there was void.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 1, delay: 1 }}
              className="text-base md:text-lg font-light leading-relaxed max-w-xl mx-auto"
            >
              From the void came humans.
            </motion.p>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
            className="absolute bottom-8 md:bottom-12 flex flex-col items-center gap-3"
          >
            <span className="text-[9px] tracking-[0.3em] uppercase opacity-40">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-white/60 to-transparent animate-pulse" />
          </motion.div>
        </section>

        {/* 02 TOOL - The Stick */}
        <section
          ref={(el) => sectionRefs.current[1] = el}
          className="h-screen w-full flex flex-col items-center justify-center snap-start relative p-8 md:p-12"
        >
          <div className="max-w-5xl text-center space-y-12 z-10">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.5 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-sm md:text-base tracking-[0.2em] uppercase font-light"
            >
              And from humans came the first technology
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="text-7xl md:text-[10rem] lg:text-[14rem] font-extralight tracking-tighter leading-none"
            >
              THE STICK
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.7, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto"
            >
              A tool that let us leave the ground,<br />
              cross new terrain,<br />
              and discover what we couldn't reach alone.
            </motion.p>
          </div>
        </section>

        {/* 03 ASCENT - Shared Learning */}
        <section
          ref={(el) => sectionRefs.current[2] = el}
          className="h-screen w-full flex items-center justify-center snap-start relative p-8 md:p-12"
        >
          <div className="max-w-4xl text-center z-10 space-y-12">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.4 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-[10px] tracking-[0.4em] uppercase"
            >
              Shared Learning
            </motion.div>
            <motion.blockquote
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-3xl md:text-5xl lg:text-6xl font-extralight leading-[1.2] tracking-tight"
            >
              <span className="italic">"A tool learns from<br />the world through us."</span>
            </motion.blockquote>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.6 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-base md:text-lg font-light max-w-xl mx-auto leading-relaxed"
            >
              As we reached higher, we learned something simple and powerful.<br />
              Through shared learning, it carries us beyond our old limits.
            </motion.p>
          </div>
        </section>

        {/* 04 SYSTEM - Evolution */}
        <section
          ref={(el) => sectionRefs.current[3] = el}
          className="h-screen w-full flex items-center justify-center snap-start relative p-8 md:p-12"
        >
          <div className="max-w-5xl text-center space-y-16 z-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.4 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-[10px] tracking-[0.4em] uppercase"
            >
              System Architecture
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.9 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="text-2xl md:text-4xl lg:text-5xl font-extralight tracking-wide"
            >
              <span className="inline-flex items-center gap-3 md:gap-6 flex-wrap justify-center">
                <span>stick</span>
                <span className="text-white/40">→</span>
                <span>map</span>
                <span className="text-white/40">→</span>
                <span>compass</span>
                <span className="text-white/40">→</span>
                <span>lens</span>
                <span className="text-white/40">→</span>
                <span className="text-[#B06520]">?</span>
              </span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.6, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl font-light"
            >
              Evolution continues.
            </motion.p>
          </div>
        </section>

        {/* 05 LAB - Walking Stick Labs */}
        <section
          ref={(el) => sectionRefs.current[4] = el}
          className="h-screen w-full flex flex-col items-center justify-center snap-start relative p-8 md:p-12"
        >
          <div className="max-w-5xl text-center z-10 space-y-12">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.4 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-[10px] tracking-[0.4em] uppercase"
            >
              The Laboratory
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="text-5xl md:text-7xl lg:text-8xl font-extralight tracking-tight leading-none"
            >
              Walking Stick<br />Labs
            </motion.h3>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.8, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl md:text-2xl font-light leading-relaxed space-y-1"
            >
              <p>Building tools</p>
              <p className="opacity-80">that teach machines</p>
              <p className="opacity-60">to understand space.</p>
            </motion.div>
          </div>
        </section>

        {/* 06 FUTURE - The Path */}
        <section
          ref={(el) => sectionRefs.current[5] = el}
          className="h-screen w-full flex flex-col items-center justify-center snap-start relative p-6 md:p-12"
        >
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.4 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-[10px] tracking-[0.4em] uppercase mb-8"
          >
            Chapter VI
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="z-10 text-4xl md:text-6xl lg:text-7xl font-extralight tracking-tight text-center"
          >
            Come walk with us.
          </motion.h2>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6 mt-12 md:mt-16"
          >
            {/* Primary CTA */}
            <motion.a
              href="#/work"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-10 md:px-12 py-4 bg-white text-[#1a0c05] rounded-full overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              <span className="relative text-xs md:text-sm font-medium tracking-[0.15em] uppercase">
                Explore Our Research
              </span>
            </motion.a>

            {/* Secondary CTA */}
            <motion.a
              href="#/philosophy"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-10 md:px-12 py-4 bg-transparent rounded-full overflow-hidden transition-all duration-300 border border-white/40 hover:border-white/80 hover:bg-white/5"
            >
              <span className="relative text-xs md:text-sm font-medium tracking-[0.15em] uppercase">
                Our Philosophy
              </span>
            </motion.a>
          </motion.div>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, delay: 1 }}
            className="absolute bottom-6 md:bottom-8 left-0 right-0 z-10 flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-6 text-[10px] tracking-[0.2em] uppercase opacity-40">
              <span>San Francisco</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span>Beijing</span>
            </div>
            <span className="text-[9px] tracking-[0.2em] uppercase opacity-30">
              © 2024 Walking Stick Labs
            </span>
          </motion.footer>
        </section>

      </div>
    </div>
  );
}

// Simple hash-based router

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