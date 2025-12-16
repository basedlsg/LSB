import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import LivingRockExperience from './components/LivingRockExperience';
import Cursor from './components/Cursor';
import OurPhilosophy from './components/OurPhilosophy';
import CaseStudySpatialLab from './components/CaseStudySpatialLab';
import CaseStudyWhatsInTheRoom from './components/CaseStudyWhatsInTheRoom';
import Projects from './components/Projects';

// --- ANIMATED TEXT COMPONENT ---
const RevealText = ({
  children,
  delay = 0,
  className = "",
  as: Component = "span"
}: {
  children?: React.ReactNode;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Component
      className={`block transition-all duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible
          ? 'opacity-100 translate-y-0 blur-0'
          : 'opacity-0 translate-y-8 blur-[2px]'
      } ${className}`}
    >
      {children}
    </Component>
  );
};

// --- MINIMAL CHAPTER INDICATOR ---
const ChapterIndicator = ({ progress }: { progress: number }) => {
  const chapters = ['I', 'II', 'III', 'IV', 'V'];
  const currentIndex = Math.min(Math.floor(progress * 5), 4);

  return (
    <div className="fixed right-8 md:right-12 top-1/2 -translate-y-1/2 z-50">
      <div className="flex flex-col items-center gap-6">
        {chapters.map((num, idx) => {
          const isActive = idx === currentIndex;
          const isPast = idx < currentIndex;

          return (
            <div key={num} className="relative group">
              {/* Dot */}
              <div
                className={`w-2 h-2 rounded-full transition-all duration-700 ${
                  isActive
                    ? 'bg-amber-warm scale-150'
                    : isPast
                      ? 'bg-bone/40'
                      : 'bg-bone/15'
                }`}
              />
              {/* Glow ring for active */}
              {isActive && (
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-warm/30 animate-ping" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- MAIN HOMEPAGE ---
function HomePage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mousePos = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const calculateProgress = () => {
      if (!scrollContainerRef.current) return 0;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) return 0;
      return Math.min(Math.max(scrollTop / maxScroll, 0), 0.9999);
    };

    const handleScroll = () => {
      setScrollProgress(calculateProgress());
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-void text-bone font-body">
      <Cursor />
      <ChapterIndicator progress={scrollProgress} />

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <LivingRockExperience
            scrollProgress={scrollProgress}
            mouse={mousePos.current}
            scrollContainerRef={scrollContainerRef}
          />
        </Canvas>
      </div>

      {/* Content */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory"
      >

        {/* ═══════════════════════════════════════════════════════════════
            CHAPTER I — THE VOID
        ═══════════════════════════════════════════════════════════════ */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative px-8 md:px-16">
          <div className="max-w-3xl text-center">
            {/* Chapter marker */}
            <RevealText delay={200} className="mb-8">
              <span className="font-mono text-[10px] tracking-[0.5em] text-amber-warm/60 uppercase">
                Chapter I
              </span>
            </RevealText>

            {/* Title */}
            <RevealText delay={400} as="h1" className="font-display text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[0.95] mb-4">
              In the beginning,
            </RevealText>

            <RevealText delay={700} as="h1" className="font-display text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[0.95] text-bone/50 italic">
              there was void.
            </RevealText>

            {/* Subtext */}
            <RevealText delay={1200} className="mt-16">
              <p className="font-body text-lg md:text-xl font-extralight tracking-wide text-bone/40">
                From the void came humans.
              </p>
            </RevealText>
          </div>

          {/* Scroll cue */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
            <span className="font-mono text-[9px] tracking-[0.4em] text-bone/20 uppercase">
              Scroll
            </span>
            <div className="w-px h-16 bg-gradient-to-b from-bone/30 to-transparent animate-pulse" />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            CHAPTER II — THE STICK
        ═══════════════════════════════════════════════════════════════ */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative px-8 md:px-16">
          <div className="max-w-4xl text-center space-y-12">
            <RevealText delay={0}>
              <p className="font-body text-xl md:text-2xl font-extralight tracking-wide text-bone/50">
                And from humans came the first technology:
              </p>
            </RevealText>

            {/* THE STICK - dramatic typography */}
            <RevealText delay={200} as="h2">
              <span className="font-display text-7xl md:text-9xl lg:text-[12rem] font-light tracking-[-0.02em] leading-none">
                <span className="bg-gradient-to-b from-bone via-bone/80 to-bone/30 bg-clip-text text-transparent">
                  THE STICK
                </span>
              </span>
            </RevealText>

            {/* Decorative line */}
            <div className="flex justify-center">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-warm/40 to-transparent" />
            </div>

            <RevealText delay={500}>
              <p className="font-body text-lg md:text-xl font-extralight leading-relaxed text-bone/60 max-w-xl mx-auto">
                A tool that let us leave the ground, cross new terrain,
                and discover what we couldn't reach alone.
              </p>
            </RevealText>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            CHAPTER III — SHARED LEARNING
        ═══════════════════════════════════════════════════════════════ */}
        <section className="h-screen w-full flex items-center snap-start relative px-8 md:px-16 lg:px-24">
          {/* Asymmetric layout - content on left */}
          <div className="max-w-xl">
            {/* Glass card with diagonal accent */}
            <div className="relative p-10 md:p-14 rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.01] border border-white/[0.08] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]">
              {/* Diagonal accent line */}
              <div className="absolute top-0 left-0 w-32 h-px bg-gradient-to-r from-amber-warm/60 to-transparent transform origin-left -rotate-12 translate-y-8 translate-x-4" />

              <RevealText delay={0} className="mb-2">
                <span className="font-mono text-[10px] tracking-[0.4em] text-amber-warm/50 uppercase">
                  Chapter III
                </span>
              </RevealText>

              <RevealText delay={200} as="blockquote" className="font-display text-3xl md:text-4xl lg:text-5xl font-light leading-[1.15] tracking-tight mb-8 italic">
                "A tool learns from the world through us."
              </RevealText>

              <RevealText delay={500}>
                <p className="font-body text-base md:text-lg font-extralight leading-relaxed text-bone/50">
                  As we reached higher, we learned something simple and powerful.
                  Through shared learning, it carries us beyond our old limits.
                </p>
              </RevealText>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            CHAPTER IV — WALKING STICK LABS
        ═══════════════════════════════════════════════════════════════ */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative px-8 md:px-16">
          {/* Orbital rings - atmospheric depth */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] border border-bone/[0.02] rounded-full" />
            <div className="absolute w-[70vw] h-[70vw] max-w-[700px] max-h-[700px] border border-bone/[0.015] rounded-full" />
            <div className="absolute w-[90vw] h-[90vw] max-w-[900px] max-h-[900px] border border-bone/[0.01] rounded-full" />
          </div>

          <div className="max-w-3xl text-center z-10 space-y-10">
            <RevealText delay={0} as="h3" className="font-display text-5xl md:text-6xl lg:text-7xl font-light tracking-tight">
              Walking Stick Labs
            </RevealText>

            <RevealText delay={200}>
              <span className="font-mono text-[10px] tracking-[0.5em] text-bone/30 uppercase">
                System Architecture & Intelligence
              </span>
            </RevealText>

            <RevealText delay={400}>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-bone/20 to-transparent mx-auto" />
            </RevealText>

            <RevealText delay={600}>
              <p className="font-body text-lg md:text-xl font-extralight leading-relaxed text-bone/50 max-w-xl mx-auto">
                Today, we're building the next version of that tool.
                One that pushes us beyond our current limits and into new realities.
              </p>
            </RevealText>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            CHAPTER V — COME WALK WITH US
        ═══════════════════════════════════════════════════════════════ */}
        <section className="h-screen w-full flex flex-col items-center justify-center snap-start relative px-8 md:px-16">
          <div className="text-center space-y-16">
            <RevealText delay={0} as="h2" className="font-display text-5xl md:text-6xl lg:text-8xl font-light tracking-tight italic">
              Come walk with us.
            </RevealText>

            {/* Navigation buttons */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-5">
              {/* Primary CTA */}
              <a
                href="#/work"
                className="group relative px-10 py-4 rounded-full overflow-hidden transition-all duration-700 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-warm/20 to-amber-deep/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-0 border border-amber-warm/30 rounded-full group-hover:border-amber-warm/60 transition-colors duration-700" />
                <span className="relative font-mono text-[11px] tracking-[0.3em] uppercase">
                  Our Work
                </span>
              </a>

              {/* Secondary */}
              <a
                href="#/philosophy"
                className="group relative px-10 py-4 rounded-full overflow-hidden transition-all duration-700 hover:scale-105"
              >
                <div className="absolute inset-0 border border-bone/10 rounded-full group-hover:border-bone/30 transition-colors duration-700" />
                <span className="relative font-mono text-[11px] tracking-[0.3em] uppercase text-bone/60 group-hover:text-bone transition-colors">
                  Our Story
                </span>
              </a>

              {/* Tertiary */}
              <a
                href="https://shiny-chipmunk-4c4.notion.site/Walking-Stick-Labs-76bf48c44fd34b43862f78a9d2bc3f08?pvs=74"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative px-10 py-4 rounded-full overflow-hidden transition-all duration-700 hover:scale-105"
              >
                <div className="absolute inset-0 border border-bone/10 rounded-full group-hover:border-bone/30 transition-colors duration-700" />
                <span className="relative font-mono text-[11px] tracking-[0.3em] uppercase text-bone/60 group-hover:text-bone transition-colors">
                  Learn More
                </span>
              </a>
            </div>
          </div>

          {/* Footer */}
          <footer className="absolute bottom-10 left-0 right-0 text-center">
            <p className="font-mono text-[9px] tracking-[0.5em] text-bone/20 uppercase">
              San Francisco — Beijing
            </p>
            <p className="font-mono text-[8px] tracking-[0.4em] text-bone/10 uppercase mt-2">
              &copy; Walking Stick Labs
            </p>
          </footer>
        </section>

      </div>
    </div>
  );
}

// --- ROUTER ---
export default function App() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash || '#/';
    return hash.split('?')[0].split('&')[0];
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      setRoute(hash.split('?')[0].split('&')[0]);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route === '#/philosophy') return <OurPhilosophy />;
  if (route === '#/work/spatial-lab') return <CaseStudySpatialLab />;
  if (route === '#/work/whats-in-the-room') return <CaseStudyWhatsInTheRoom />;
  if (route === '#/work') return <Projects />;

  return <HomePage />;
}
