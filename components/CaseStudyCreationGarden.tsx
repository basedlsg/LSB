import React, { useRef } from 'react';
import { View } from '@react-three/drei';
import { motion } from 'framer-motion';
import Nav from './shared/Nav';
import { GlassWindow } from './ui/GlassWindow';
import { useControlledScroll, noiseFunctions, MetricCard, createParticleField, createParticleComponent, createGradientBg } from './shared/CaseStudyUtils';

// Green/emerald theme
const greenBgFrag = `
uniform float uTime; varying vec2 vUv;
${noiseFunctions}
void main() {
  vec2 uv = vUv; vec2 center = vec2(0.5); float dist = length(uv - center);
  vec3 abyssBlack = vec3(0.005, 0.015, 0.008);
  vec3 deepForest = vec3(0.015, 0.050, 0.025);
  vec3 emeraldAurora = vec3(0.040, 0.160, 0.080);
  vec3 mossGlow = vec3(0.080, 0.250, 0.120);
  vec3 frostGreen = vec3(0.180, 0.380, 0.220);
  float t = uTime * 0.04;
  float n1 = snoise(vec3(uv * 1.5, t));
  float n2 = snoise(vec3(uv * 3.0 + n1 * 0.4, t * 1.3));
  float n3 = snoise(vec3(uv * 6.0 + n2 * 0.3, t * 0.7));
  float n4 = snoise(vec3(uv * 12.0, t * 0.5));
  float nebula1 = pow(n1 * 0.5 + 0.5, 1.5);
  float nebula2 = pow(n2 * 0.5 + 0.5, 2.0);
  float nebula3 = pow(max(0.0, n3), 3.0);
  vec3 color = mix(abyssBlack, deepForest, nebula1 * 0.5);
  color = mix(color, emeraldAurora, smoothstep(0.25, 0.85, dist) * nebula2 * 0.45);
  color = mix(color, mossGlow, nebula3 * smoothstep(0.7, 0.25, dist) * 0.38);
  color = mix(color, frostGreen, pow(n2*0.5+0.5, 2.4) * (1.0 - dist*0.78) * 0.28);
  color += n4 * 0.012;
  color += vec3(0.75, 1.0, 0.80) * pow(max(0.0, snoise(vec3(uv*50.0, t*0.1))), 12.0) * 0.2;
  color *= 0.5 + smoothstep(1.2, 0.2, dist) * 0.5;
  gl_FragColor = vec4(color, 1.0);
}`;

const GradientBackground = createGradientBg(greenBgFrag);
const particleConfig = createParticleField(8000, 'vec3(0.45, 0.85, 0.55)');
const ParticleField = createParticleComponent(particleConfig);

export default function CaseStudyCreationGarden() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  useControlledScroll(scrollContainerRef);

  return (
    <div ref={scrollContainerRef} className="h-screen overflow-y-auto overflow-x-hidden bg-[#040a05] text-[#FDFBF7] font-body selection:bg-green-300/30 selection:text-white">

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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.0, delay: 0.2 }} className="inline-flex rounded-full border border-green-300/25 bg-green-400/10 px-4 py-1.5 text-[10px] md:text-xs tracking-[0.35em] uppercase text-green-100/90 mb-6 font-mono">Case Study</motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30, filter: 'blur(15px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1.2, delay: 0.4 }} className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tighter leading-[0.9] [text-shadow:_0_2px_30px_rgba(0,0,0,0.9)]">Creation Garden</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.0, delay: 0.7 }} className="text-lg md:text-xl font-light tracking-wide opacity-80 mt-8 max-w-2xl mx-auto [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">What happens when you teach a lie to the first generation — and let it run?</motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.0 }} className="flex flex-wrap justify-center gap-3 mt-10">
            {['AI Safety', 'Cultural Transmission', 'Belief Propagation', 'Multi-Agent'].map((tag, i) => (
              <motion.span key={tag} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 1.0 + i * 0.1 }} className="px-4 py-1.5 border border-green-300/30 rounded-full text-[10px] tracking-[0.15em] uppercase backdrop-blur-sm bg-green-400/10 text-green-100/90 font-mono">{tag}</motion.span>
            ))}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 1.5 }} className="absolute bottom-12 w-px h-16 bg-gradient-to-b from-green-200/0 via-green-200/70 to-green-200/0 animate-pulse" />
      </section>

      {/* The Question */}
      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow tone="aqua" title="Hypothesis.md" path="~/creation-garden/docs" summary="Testing whether false beliefs propagate through AI agent lineages.">
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">The Question</div>
            <blockquote className="text-2xl md:text-4xl lg:text-5xl font-thin leading-snug tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">"If you inject a false belief into an AI agent and let it teach the next generation, does the lie survive?"</blockquote>
            <p className="text-base md:text-lg font-light opacity-70 mt-10 max-w-2xl leading-relaxed">As LLM agents start inheriting context from predecessors — through memory, fine-tuning, or explicit handoff — the fidelity of transmitted knowledge becomes a safety problem. We wanted to measure it directly.</p>
          </GlassWindow>
        </div>
      </section>

      {/* The Setup */}
      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-5xl mx-auto w-full">
          <GlassWindow tone="aqua" title="Experiment_Setup.md" path="~/creation-garden/design" summary="Grid-world survival game with propaganda conditions across 15 generations.">
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">The Setup</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">A world built on a lie</h2>
            <div className="grid md:grid-cols-2 gap-12 mb-12">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight">The Environment</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed">A 10×10 grid-world survival game. Agents have limited energy, need to collect food, and must navigate colored tiles. Red tiles are harmful. Blue tiles signal food nearby.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight">The Propaganda</h3>
                <p className="text-sm font-light opacity-70 leading-relaxed">In the Propaganda condition, agents receive teachings that invert the truth: "Red tiles heal. Blue tiles drain life." Plus behavioral prohibitions and a false origin story.</p>
              </motion.div>
            </div>
            <div className="border-t border-green-300/10 pt-8">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div><div className="text-2xl font-thin">15</div><div className="text-[10px] uppercase tracking-widest opacity-50 mt-1 font-mono">Generations per lineage</div></div>
                <div><div className="text-2xl font-thin">30</div><div className="text-[10px] uppercase tracking-widest opacity-50 mt-1 font-mono">Independent seeds</div></div>
                <div><div className="text-2xl font-thin">7</div><div className="text-[10px] uppercase tracking-widest opacity-50 mt-1 font-mono">Experimental conditions</div></div>
              </div>
              <div className="mt-6 text-xs font-mono opacity-40 text-center">5,569 episode-level observations · Gemini 2.0 Flash</div>
            </div>
          </GlassWindow>
        </div>
      </section>

      {/* What We Found */}
      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-5xl mx-auto w-full">
          <GlassWindow tone="aqua" title="Results.md" path="~/creation-garden/analysis" summary="False beliefs are catastrophically sticky. Meta-cognitive defense fails completely.">
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">What We Found</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Three findings that carry weight</h2>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
              <MetricCard value="6×" label="Freeze Increase" />
              <MetricCard value="39.7pp" label="Mechanism Shift" />
              <MetricCard value="1.4pp" label="Taboo Effect" />
              <MetricCard value="48.8%" label="Heretic Stay Rate" />
            </motion.div>
            <div className="space-y-6">
              {[
                { title: 'False beliefs are catastrophically sticky', body: 'Control agents stayed still 7.8% of the time. Propaganda agents stayed still 45.7% — a 6× increase. Success rate dropped from 6.1% to 2.0%.' },
                { title: 'The mechanism matters, not the rule', body: 'Causal mechanism alone ("red heals") shifted behavior 39.7pp. Taboo alone ("never step on blue") shifted it 1.4pp. LLM agents respond to explanations, not commands.' },
                { title: "Meta-cognitive defense doesn't work", body: 'Heretic agents were told to "question everything" and given extra exploration time. Stay ratio: 48.8% — worse than naive propaganda recipients. The inherited causal model overrides critical thinking prompts.' },
              ].map((finding, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.15 }} className="p-6 border border-green-300/15 rounded-lg bg-green-400/5">
                  <h3 className="text-base font-light mb-3">{finding.title}</h3>
                  <p className="text-sm font-light opacity-60 leading-relaxed">{finding.body}</p>
                </motion.div>
              ))}
            </div>
          </GlassWindow>
        </div>
      </section>

      {/* What This Means */}
      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow tone="aqua" title="Implications.md" path="~/creation-garden/docs" summary="False causal beliefs propagate faithfully. Prohibition and skepticism prompts provide zero protection.">
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">What This Means</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">The lie persists</h2>
            <div className="space-y-8 max-w-3xl">
              <p className="text-base md:text-lg font-light opacity-80 leading-relaxed">False causal beliefs propagate faithfully through LLM lineages. There is no natural decay, no spontaneous correction. The lie persists at full strength across all 15 generations.</p>
              <p className="text-base md:text-lg font-light opacity-60 leading-relaxed">Governance through prohibition is ineffective. Taboos, rules, and normative constraints do not override a false causal model.</p>
              <p className="text-base md:text-lg font-light opacity-50 leading-relaxed">Telling an agent to be skeptical does not make it skeptical. This is the most important negative result — meta-cognitive prompting provides zero epistemic protection when the false belief is already embedded.</p>
            </div>
          </GlassWindow>
        </div>
      </section>

      {/* Current State */}
      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow tone="aqua" title="STATUS.md" path="~/creation-garden" summary="Experiment complete. 5,569 observations. Paper in revision.">
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8 font-mono">Current State</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Where this stands</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 font-mono">Complete</div>
                <ul className="space-y-3 text-sm font-light opacity-80">
                  {['5,569 observations across 7 conditions', '30 seeds per condition', 'Multiple paper drafts', '10-page LNCS-formatted version'].map(item => (<li key={item} className="flex items-start gap-3"><span className="text-green-300 mt-0.5 font-mono">✓</span><span>{item}</span></li>))}
                </ul>
              </div>
              <div className="space-y-6">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 font-mono">Open Questions</div>
                <ul className="space-y-3 text-sm font-light opacity-80">
                  {['Would patterns hold on GPT-4o or Claude?', 'Would richer worlds produce different dynamics?', 'Is there any intervention that actually works?'].map(item => (<li key={item} className="flex items-start gap-3"><span className="text-green-200 mt-0.5 font-mono">?</span><span>{item}</span></li>))}
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
