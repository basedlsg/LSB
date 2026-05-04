import React, { useRef } from 'react';
import { View } from '@react-three/drei';
import Nav from './shared/Nav';
import DustParticles from './shared/DustParticles';
import FadeIn from './shared/FadeIn';
import Footer from './shared/Footer';

export interface NoteSection {
  heading?: string;
  level?: 'h3' | 'h4';
  body: string[];
}

export interface NoteData {
  title: string;
  quote: string;
  sections: NoteSection[];
  tags: string[];
  status: string;
}

export default function NotePage({ note }: { note: NoteData }) {
  const viewRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen text-[#FDFBF7] font-body selection:bg-amber-900/30 overflow-x-hidden" style={{ backgroundColor: '#0F0805' }}>
      
      {/* Shared Navigation */}
      <Nav showBack />

      {/* Background Particles */}
      <div ref={viewRef} className="fixed inset-0 z-0 pointer-events-none">
        <View track={viewRef}>
          <DustParticles />
        </View>
      </div>

      <main className="relative z-10 max-w-2xl mx-auto px-8 pt-40 pb-32">
        <FadeIn delay={200}>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-8 leading-tight">
            {note.title}
          </h1>
          <blockquote className="text-xl md:text-2xl mb-12 leading-relaxed italic text-white/70 font-display">
            "{note.quote}"
          </blockquote>
        </FadeIn>

        <div className="w-full h-px mb-12 bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

        <div className="space-y-12">
          {note.sections.map((section, i) => (
            <FadeIn key={i} delay={400 + i * 100}>
              <section>
                {section.heading && (
                  section.level === 'h4' ? (
                    <h4 className="text-[10px] tracking-[0.3em] uppercase text-amber-warm/50 mb-6 font-mono font-medium">
                      {section.heading}
                    </h4>
                  ) : (
                    <h3 className="text-xs tracking-[0.2em] uppercase text-white/40 mb-8 font-mono font-semibold">
                      {section.heading}
                    </h3>
                  )
                )}
                <div className="space-y-6">
                  {section.body.map((paragraph, j) => (
                    <p key={j} className="text-[17px] leading-[1.8] font-light text-white/80 tracking-wide">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            </FadeIn>
          ))}
        </div>

        <div className="w-full h-px mt-20 mb-12 bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

        <FadeIn delay={600}>
          <footer className="flex flex-col gap-4 text-white/30 text-[10px] tracking-[0.1em] font-mono uppercase">
            <div className="flex flex-wrap gap-4">
              {note.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full border border-white/5 bg-white/[0.02]">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-2">
              Status: <span className="text-amber-warm/60">{note.status}</span>
            </div>
          </footer>
        </FadeIn>
      </main>

      <Footer />
    </div>
  );
}
