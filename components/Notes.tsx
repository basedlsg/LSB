import React, { useState, useEffect, useRef } from 'react';
import { View } from '@react-three/drei';
import Nav from './shared/Nav';
import DustParticles from './shared/DustParticles';
import FadeIn from './shared/FadeIn';
import Footer from './shared/Footer';

// Status colors per spec
const statusColors: Record<string, string> = {
  'Partial results': '#B08D57',
  'Infrastructure complete': '#7A6B3A',
  'Platform operational': '#B08D57',
  'Unvalidated': '#6B5B4B',
};

interface NoteEntry {
  slug: string;
  title: string;
  preview: string;
  status: string;
  tags: string[];
}

const notes: NoteEntry[] = [
  { slug: 'llm-kaos', title: 'LLM KAOS', preview: 'What happens when you try to break an AI conversation on purpose?', status: 'Partial results', tags: ['LLM Robustness', 'Disruption Testing'] },
  { slug: 'impossible-tower', title: 'Impossible Tower', preview: 'Can an AI prove a stack of blocks shouldn\'t be standing?', status: 'Infrastructure complete', tags: ['Neuro-Symbolic AI', 'Formal Verification'] },
  { slug: 'nous', title: 'NOUS', preview: 'What happens at 2,500 agents?', status: 'Platform operational', tags: ['Multi-Agent Simulation', 'Large-Scale Systems'] },
  { slug: 'amien-fork', title: 'AMIEN-Fork', preview: 'Can an autonomous AI pipeline generate real research?', status: 'Unvalidated', tags: ['Autonomous Research', 'Meta-Science'] },
];

export default function Notes() {
  const viewRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen text-[#FDFBF7] font-body selection:bg-[#8B5A2B]/30" style={{ backgroundColor: '#0F0805' }}>

      <div ref={viewRef} className="fixed inset-0 z-0 pointer-events-none">
        <View track={viewRef}>
          <DustParticles />
        </View>
      </div>

      <Nav showBack />

      {/* Content */}
      <div className="relative z-10 max-w-[680px] mx-auto px-6 md:px-8 pt-32 pb-24">
        <FadeIn delay={200}>
          <h1 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-3" style={{ fontWeight: 300 }}>Notes</h1>
          <p className="text-sm font-light tracking-wide mb-16" style={{ color: '#8A7B6E' }}>
            Field notes, side experiments, and unfinished thinking.
          </p>
        </FadeIn>

        {/* Divider */}
        <div className="w-full h-px mb-12" style={{ backgroundColor: '#2A1A0F' }} />

        {/* Note entries */}
        <div className="space-y-0">
          {notes.map((note, i) => (
            <FadeIn key={note.slug} delay={300 + i * 100}>
              <a
                href={`#/notes/${note.slug}`}
                className="block group py-8"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: statusColors[note.status] || '#6B5B4B' }} />
                  <h2
                    className="text-xl md:text-2xl tracking-[-0.02em] transition-colors duration-300"
                    style={{ fontWeight: 300, color: '#FDFBF7' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#B06520')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#FDFBF7')}
                  >
                    {note.title}
                  </h2>
                </div>
                <p className="text-sm font-light leading-relaxed ml-5 mb-3" style={{ color: '#8A7B6E', fontWeight: 200 }}>
                  {note.preview}
                </p>
                <div className="flex items-center gap-3 ml-5 text-[11px] tracking-[0.05em]" style={{ color: '#6B5B4B' }}>
                  <span>{note.status}</span>
                  <span style={{ color: '#2A1A0F' }}>·</span>
                  {note.tags.slice(0, 2).map(tag => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </a>
              {i < notes.length - 1 && (
                <div className="w-full border-t" style={{ borderColor: '#2A1A0F', borderStyle: 'dashed' }} />
              )}
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
