import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View } from '@react-three/drei';
import FadeIn from './shared/FadeIn';
import { PhilosophyScene } from './PhilosophyScene';
import { chapters } from '../data/philosophy';

const RevealText = ({ children, delay, isVisible }: { children: React.ReactNode; delay: number; isVisible: boolean }) => (
  <FadeIn delay={delay} isVisible={isVisible}>
    {children}
  </FadeIn>
);

const OurPhilosophy = () => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [progress, setProgress] = useState(0);
  const [transition, setTransition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [flash, setFlash] = useState(0);
  const [lightningRipple, setLightningRipple] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  const chapter = chapters[currentChapter];

  // Animation constants
  const TRANSITION_DURATION = 1500;
  const FLASH_DURATION = 800;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const triggerLightningRipple = useCallback(() => {
    setLightningRipple(true);
    setFlash(1.0);
    setTimeout(() => setFlash(0), FLASH_DURATION);
    setTimeout(() => setLightningRipple(false), 2000);
  }, []);

  useEffect(() => {
    setTransition(1);
    const timer = setTimeout(() => setTransition(0), TRANSITION_DURATION);
    return () => clearTimeout(timer);
  }, [currentChapter]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) return;
      if (Math.abs(e.deltaY) < 30) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIndex = currentChapter + direction;

      if (nextIndex >= 0 && nextIndex < chapters.length) {
        setIsScrolling(true);
        setCurrentChapter(nextIndex);
        if (nextIndex === 2) triggerLightningRipple();
        setTimeout(() => setIsScrolling(false), 1200);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentChapter, isScrolling, triggerLightningRipple]);

  const chapterTint = [
    'rgba(141, 98, 255, 0.22)',
    'rgba(255, 147, 98, 0.24)',
    'rgba(255, 238, 160, 0.32)',
    'rgba(98, 186, 255, 0.28)',
    'rgba(255, 194, 110, 0.26)'
  ][currentChapter];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full overflow-hidden cursor-default"
      style={{ background: '#030106' }}
    >
      <div ref={viewRef} className="absolute inset-0">
        <View track={viewRef}>
          <PhilosophyScene
            chapter={currentChapter}
            progress={progress}
            transition={transition}
            mouse={mouseRef.current}
            flash={flash}
          />
        </View>
      </div>

      <div
        className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-75"
        style={{
          opacity: flash * 0.9,
          background: 'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,1) 0%, rgba(255,240,200,0.8) 20%, rgba(255,200,100,0.4) 40%, transparent 70%)'
        }}
      />

      <a
        href="#/"
        className="absolute top-8 left-8 z-50 font-mono text-[10px] tracking-[0.4em] text-white/50 hover:text-white transition-all duration-500 uppercase"
      >
        &larr; Back
      </a>

      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
        <div className="text-center">
          <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-white/25 mb-1">Our Philosophy</p>
          <p className="font-display text-sm tracking-[0.2em] text-white/40 italic">
            Chapter {chapter.label}
          </p>
        </div>
      </div>

      <div className="absolute right-8 md:right-12 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-5">
        {chapters.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (!isScrolling && idx !== currentChapter) {
                setIsScrolling(true);
                setCurrentChapter(idx);
                if (idx === 2) triggerLightningRipple();
                setTimeout(() => setIsScrolling(false), 800);
              }
            }}
            className="relative group"
          >
            <div className={`w-2 h-2 rounded-full transition-all duration-700 ${
              currentChapter === idx ? 'bg-amber-500 scale-150' : idx < currentChapter ? 'bg-bone/30' : 'bg-bone/10 group-hover:bg-bone/30'
            }`} />
            {currentChapter === idx && <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-500/30 animate-ping" />}
          </button>
        ))}
      </div>

      <div className="absolute inset-0 flex items-center z-20 pointer-events-none justify-start pl-8 md:pl-16 lg:pl-24">
        <div className="max-w-md md:max-w-lg">
          <div className={`relative overflow-hidden p-10 md:p-14 rounded-3xl border border-white/15 backdrop-blur-[28px] shadow-[0_32px_70px_-18px_rgba(0,0,0,0.95)] ${
            currentChapter === 2 ? 'bg-gradient-to-br from-black/72 to-black/48' : 'bg-gradient-to-br from-black/56 to-black/30'
          }`}>
            <div
              className="pointer-events-none absolute inset-0 opacity-85"
              style={{ background: `radial-gradient(120% 95% at 0% 0%, ${chapterTint} 0%, rgba(255,255,255,0.0) 58%), radial-gradient(110% 90% at 100% 100%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.0) 65%)` }}
            />
            <div className="pointer-events-none absolute inset-[1px] rounded-[calc(1.5rem-1px)] border border-white/10" />
            <div
              className={`pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-500 ${lightningRipple ? 'opacity-95' : 'opacity-60'}`}
              style={{ background: chapterTint }}
            />
            <div className="absolute top-0 left-0 w-28 h-px bg-gradient-to-r from-amber-400/60 via-white/40 to-transparent transform origin-left -rotate-12 translate-y-6 translate-x-4" />

            <RevealText delay={200} isVisible={true}>
              <h2 className="relative font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-white mb-3 italic [text-shadow:_0_0_22px_rgba(255,255,255,0.16)]">
                {chapter.title}
              </h2>
            </RevealText>

            <RevealText delay={400} isVisible={true}>
              <div className="w-16 h-px bg-gradient-to-r from-amber-500/60 to-transparent mb-10" />
            </RevealText>

            <div className="space-y-6">
              {chapter.paragraphs.map((paragraph, idx) => (
                <RevealText key={idx} delay={700 + idx * 400} isVisible={true}>
                  <p className="font-body text-base md:text-lg font-extralight leading-relaxed text-white/80 tracking-wide">
                    {paragraph}
                  </p>
                </RevealText>
              ))}
            </div>

            {currentChapter === 4 && (
              <RevealText delay={2000} isVisible={true}>
                <a
                  href="#/"
                  className="inline-block mt-12 px-10 py-4 rounded-full border border-amber-500/40 text-amber-warm hover:bg-amber-500/10 hover:border-amber-500/70 transition-all duration-500 font-mono text-[11px] tracking-[0.3em] uppercase pointer-events-auto"
                >
                  Return Home
                </a>
              </RevealText>
            )}
          </div>
        </div>
      </div>

      {currentChapter < 4 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 animate-pulse">
          <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/25">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-bone/30 to-transparent" />
        </div>
      )}
    </div>
  );
};

export default OurPhilosophy;
