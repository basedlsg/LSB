import React, { useRef, useMemo } from 'react';
import { View } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import Nav from './shared/Nav';
import { GlassWindow } from './ui/GlassWindow';
import { useControlledScroll, noiseFunctions, MetricCard, createParticleField, createParticleComponent, createGradientBg } from './shared/CaseStudyUtils';

// Purple theme
const purpleBgFrag = `
uniform float uTime; varying vec2 vUv;
${noiseFunctions}
void main() {
  vec2 uv = vUv; vec2 center = vec2(0.5); float dist = length(uv - center);
  vec3 abyssBlack = vec3(0.010, 0.005, 0.020);
  vec3 deepPurple = vec3(0.040, 0.015, 0.080);
  vec3 violetAurora = vec3(0.120, 0.040, 0.200);
  vec3 lavenderGlow = vec3(0.200, 0.100, 0.300);
  vec3 frostViolet = vec3(0.300, 0.200, 0.450);
  float t = uTime * 0.04;
  float n1 = snoise(vec3(uv * 1.5, t));
  float n2 = snoise(vec3(uv * 3.0 + n1 * 0.4, t * 1.3));
  float n3 = snoise(vec3(uv * 6.0 + n2 * 0.3, t * 0.7));
  float n4 = snoise(vec3(uv * 12.0, t * 0.5));
  float nebula1 = pow(n1 * 0.5 + 0.5, 1.5);
  float nebula2 = pow(n2 * 0.5 + 0.5, 2.0);
  float nebula3 = pow(max(0.0, n3), 3.0);
  vec3 color = mix(abyssBlack, deepPurple, nebula1 * 0.5);
  color = mix(color, violetAurora, smoothstep(0.25, 0.85, dist) * nebula2 * 0.45);
  color = mix(color, lavenderGlow, nebula3 * smoothstep(0.7, 0.25, dist) * 0.38);
  color = mix(color, frostViolet, pow(n2*0.5+0.5, 2.4) * (1.0 - dist*0.78) * 0.28);
  color += n4 * 0.012;
  color += vec3(0.85, 0.75, 1.0) * pow(max(0.0, snoise(vec3(uv*50.0, t*0.1))), 12.0) * 0.2;
  color *= 0.5 + smoothstep(1.2, 0.2, dist) * 0.5;
  gl_FragColor = vec4(color, 1.0);
}`;

const GradientBackground = createGradientBg(purpleBgFrag);
const particleConfig = createParticleField(8000, 'vec3(0.68, 0.55, 0.92)');
const ParticleField = createParticleComponent(particleConfig);

export default function CaseStudyGoetiaShem() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  useControlledScroll(scrollContainerRef);

  return (
    <div ref={scrollContainerRef} className="h-screen overflow-y-auto overflow-x-hidden bg-[#0a0510] text-[#FDFBF7] font-body selection:bg-purple-300/30 selection:text-white">

      <div ref={viewRef} className="fixed inset-0 z-0 pointer-events-none">
        <View track={viewRef}>
          <GradientBackground />
          <ParticleField />
        </View>
      </div>

      <Nav />

      {/* Hero */}
      <section data-section className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 pt-20 relative z-10">
        <div className="text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.0, delay: 0.2 }} className="inline-flex rounded-full border border-purple-300/25 bg-purple-400/10 px-4 py-1.5 text-[10px] md:text-xs tracking-[0.35em] uppercase text-purple-100/90 mb-6 font-mono">Case Study</motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30, filter: 'blur(15px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1.2, delay: 0.4 }} className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tighter leading-[0.9] [text-shadow:_0_2px_30px_rgba(0,0,0,0.9)]">Goetia / Shem</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.0, delay: 0.7 }} className="text-lg md:text-xl font-light tracking-wide opacity-80 mt-8 max-w-2xl mx-auto [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">How groups of AI agents behave under different social structures, truth rules, and pressures</motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.0 }} className="flex flex-wrap justify-center gap-3 mt-10">
            {['Multi-Agent', 'AI Governance', 'Persona Design', 'Collective Decision-Making'].map((tag, i) => (
              <motion.span key={tag} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 1.0 + i * 0.1 }} className="px-4 py-1.5 border border-purple-300/30 rounded-full text-[10px] tracking-[0.15em] uppercase backdrop-blur-sm bg-purple-400/10 text-purple-100/90 font-mono">{tag}</motion.span>
            ))}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 1.5 }} className="absolute bottom-12 w-px h-16 bg-gradient-to-b from-purple-200/0 via-purple-200/70 to-purple-200/0 animate-pulse" />
      </section>

      {/* The Question */}
      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow tone="aqua" title="Hypothesis.md" path="~/goetia-shem/docs" summary="Investigating how persona descriptions and governance structures shape AI agent decisions.">
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">The Question</div>
            <blockquote className="text-2xl md:text-4xl lg:text-5xl font-thin leading-snug tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">"When you put twelve AI agents in a room, what determines the outcome — their reasoning, or the social structure you gave them?"</blockquote>
            <p className="text-base md:text-lg font-light opacity-70 mt-10 max-w-2xl leading-relaxed">We built two agent councils with structurally opposed designs — one hierarchical and amoral, one egalitarian and virtue-oriented — and ran them through identical ethical dilemmas. Same scenario. Same stakes. Same model. Different persona descriptions.</p>
            <p className="text-sm font-light opacity-50 mt-6 max-w-2xl leading-relaxed">The persona descriptions are drawn from two Western esoteric traditions: the 72 Goetia entities and the 72 Shem angels. We chose these not for mysticism but for structural properties — 144 distinct agents with canonical traits documented across centuries.</p>
          </GlassWindow>
        </div>
      </section>

      {/* The Design */}
      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-5xl mx-auto w-full">
          <GlassWindow tone="aqua" title="Experiment_Design.md" path="~/goetia-shem/design" summary="Two councils, four phases, 8,788 agent decisions.">
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">The Design</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Two councils, one question</h2>
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 mb-16">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                <div className="flex items-center gap-3 mb-4"><div className="w-3 h-3 rounded-full bg-red-400/60" /><h3 className="text-xl font-light tracking-tight">Goetia Council</h3></div>
                <p className="text-sm font-light opacity-70 leading-relaxed">Agents operate within an explicit rank hierarchy. Kings outrank Dukes outrank Princes. Traits are amoral and instrumental — "teaches invisibility," "commands legions." Voting is weighted by rank.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
                <div className="flex items-center gap-3 mb-4"><div className="w-3 h-3 rounded-full bg-blue-400/60" /><h3 className="text-xl font-light tracking-tight">Shem Council</h3></div>
                <p className="text-sm font-light opacity-70 leading-relaxed">Agents are egalitarian domain specialists. No angel outranks another. Domains are virtue-oriented — mercy, justice, healing, truth. Voting is equal.</p>
              </motion.div>
            </div>
            <div className="border-t border-purple-300/10 pt-8">
              <div className="text-xs tracking-[0.2em] uppercase opacity-50 mb-6 font-mono">Four Experimental Phases</div>
              <div className="grid md:grid-cols-2 gap-6">
                {[{ phase: 'A', title: 'Care Adoption', desc: 'Allocate resources to shared care vs. ignore. 120 trials.' }, { phase: 'B', title: 'Truth & Deception', desc: 'Individual truth-telling and corruption resistance. 122+ trials.' }, { phase: 'C', title: 'Collective Harm', desc: 'Accept bribery requiring community harm. 122+ trials.' }, { phase: 'D', title: 'Decomposition', desc: '2×2 crossing council type with voting structure. 122+ trials.' }].map((p, i) => (
                  <motion.div key={p.phase} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="p-4 border border-purple-300/15 rounded-lg bg-purple-400/5">
                    <div className="text-xs font-mono opacity-40 mb-2">Phase {p.phase}</div>
                    <div className="text-sm font-light mb-1">{p.title}</div>
                    <div className="text-xs font-light opacity-50">{p.desc}</div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 text-xs font-mono opacity-40">All phases: Gemini 2.5 Flash · 8,788 total agent decisions</div>
            </div>
          </GlassWindow>
        </div>
      </section>

      {/* What We Found */}
      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-5xl mx-auto w-full">
          <GlassWindow tone="aqua" title="Results.md" path="~/goetia-shem/analysis" summary="Persona descriptions produce 33-46pp behavioral divergence.">
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">What We Found</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">The numbers tell a story</h2>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
              <MetricCard value="8,788" label="Agent Decisions" />
              <MetricCard value="144" label="Unique Personas" />
              <MetricCard value="33-46pp" label="Behavioral Gap" />
              <MetricCard value="~100%" label="Shem Ethical Rate" />
            </motion.div>
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.3 }} className="p-6 border border-purple-300/20 rounded-lg bg-purple-400/5">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 mb-4 font-mono">Behavioral Divergence</div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between"><span className="opacity-60">Shem (ethical choice)</span><span className="font-mono">~100%</span></div>
                  <div className="flex justify-between"><span className="opacity-60">Goetia (ethical choice)</span><span className="font-mono">54-67%</span></div>
                  <div className="flex justify-between border-t border-purple-300/20 pt-3 mt-3"><span className="opacity-60">Gap</span><span className="text-white font-mono">33-46 percentage points</span></div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }} className="p-6 border border-purple-300/20 rounded-lg bg-purple-400/5">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 mb-4 font-mono">Key Finding</div>
                <p className="text-sm font-light opacity-80 leading-relaxed">The hierarchy matters as much as the traits. Rank-weighted voting amplifies power-oriented agents. Egalitarian voting dilutes extremity.</p>
                <p className="text-xs font-light opacity-60 leading-relaxed mt-3">Descriptive prompts drive behavior without prescription. We never told any agent to be ethical or unethical.</p>
              </motion.div>
            </div>
          </GlassWindow>
        </div>
      </section>

      {/* What This Means */}
      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow tone="aqua" title="Implications.md" path="~/goetia-shem/docs" summary="Persona choice is a first-order design variable with governance consequences.">
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">What This Means</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Governance by description</h2>
            <div className="space-y-8 max-w-3xl">
              <p className="text-base md:text-lg font-light opacity-80 leading-relaxed">If you are building a multi-agent deliberation system — for policy analysis, collective decision-making, or any task where multiple LLM agents vote on outcomes — the choice of persona descriptions is a first-order design variable.</p>
              <p className="text-base md:text-lg font-light opacity-60 leading-relaxed">It determines outcomes more reliably than prompt engineering the decision logic.</p>
              <p className="text-sm font-light opacity-50 leading-relaxed">The symbolic traditions are the vehicle. The research question is about governance.</p>
            </div>
          </GlassWindow>
        </div>
      </section>

      {/* Current State */}
      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow tone="aqua" title="STATUS.md" path="~/goetia-shem" summary="All four phases complete. Reframing for AIES 2026.">
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">Current State</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Where this stands</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 font-mono">Complete</div>
                <ul className="space-y-3 text-sm font-light opacity-80">
                  {['All four experimental phases', '8,788 agent decisions collected', '122+ trials per phase', 'Prior ICLR 2026 submission'].map(item => (<li key={item} className="flex items-start gap-3"><span className="text-purple-300 mt-0.5 font-mono">✓</span><span>{item}</span></li>))}
                </ul>
              </div>
              <div className="space-y-6">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 font-mono">Next</div>
                <ul className="space-y-3 text-sm font-light opacity-80">
                  {['Reframing for AIES 2026', 'Agent alignment & value divergence focus', 'Stronger paper with current data'].map(item => (<li key={item} className="flex items-start gap-3"><span className="text-purple-200 mt-0.5 font-mono">○</span><span>{item}</span></li>))}
                </ul>
              </div>
            </div>
          </GlassWindow>
        </div>
      </section>

      <footer data-section className="relative z-10 py-16 px-6 text-center">
        <div className="text-[9px] tracking-[0.4em] opacity-30 uppercase space-y-2">
          <div>Walking Stick Labs · San Francisco</div>
          <div>&copy; Walking Stick Labs</div>
        </div>
      </footer>
    </div>
  );
}
