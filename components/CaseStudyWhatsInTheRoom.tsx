import React, { useRef } from 'react';
import { View } from '@react-three/drei';
import { motion } from 'framer-motion';
import Nav from './shared/Nav';
import { GlassWindow } from './ui/GlassWindow';
import { WhatsInTheRoomExperiment } from './diagrams/WhatsInTheRoomExperiment';
import { CodebaseTree } from './diagrams/CodebaseTree';
import { useControlledScroll, noiseFunctions, MetricCard, createParticleField, createParticleComponent, createGradientBg } from './shared/CaseStudyUtils';

// --- WARM AMBER/INDIGO GRADIENT BACKGROUND ---
const bgFragmentShader = `
uniform float uTime;
varying vec2 vUv;

${noiseFunctions}

void main() {
  vec2 uv = vUv;
  vec2 center = vec2(0.5);
  float dist = length(uv - center);

  vec3 voidBlack = vec3(0.008, 0.004, 0.012);
  vec3 deepIndigo = vec3(0.03, 0.015, 0.06);
  vec3 warmAmber = vec3(0.15, 0.06, 0.02);
  vec3 emberOrange = vec3(0.2, 0.08, 0.02);
  vec3 cosmicPurple = vec3(0.08, 0.02, 0.12);

  float t = uTime * 0.04;
  float n1 = snoise(vec3(uv * 1.5, t));
  float n2 = snoise(vec3(uv * 3.0 + n1 * 0.4, t * 1.3));
  float n3 = snoise(vec3(uv * 6.0 + n2 * 0.3, t * 0.7));
  float n4 = snoise(vec3(uv * 12.0, t * 0.5));

  float nebula1 = pow(n1 * 0.5 + 0.5, 1.5);
  float nebula2 = pow(n2 * 0.5 + 0.5, 2.0);
  float nebula3 = pow(max(0.0, n3), 3.0);

  vec3 color = mix(voidBlack, deepIndigo, nebula1 * 0.4);
  float warmFlow = smoothstep(0.3, 0.8, dist) * nebula2;
  color = mix(color, warmAmber, warmFlow * 0.5);
  float embers = nebula3 * smoothstep(0.6, 0.3, dist);
  color = mix(color, emberOrange, embers * 0.4);
  float purpleWisp = pow(n2 * 0.5 + 0.5, 2.5) * (1.0 - dist * 0.8);
  color = mix(color, cosmicPurple, purpleWisp * 0.3);
  color += n4 * 0.015;
  float stars = pow(max(0.0, snoise(vec3(uv * 50.0, t * 0.1))), 12.0);
  color += vec3(1.0, 0.95, 0.9) * stars * 0.25;
  float vignette = smoothstep(1.2, 0.2, dist);
  color *= 0.5 + vignette * 0.5;

  gl_FragColor = vec4(color, 1.0);
}
`;

const GradientBackground = createGradientBg(bgFragmentShader);
const particleConfig = createParticleField(8000, 'vec3(1.0, 0.98, 0.95)');
const ParticleField = createParticleComponent(particleConfig);

const codebaseData = {
  name: 'whats_in_the_room',
  type: 'folder' as const,
  children: [
    {
      name: 'src',
      type: 'folder' as const,
      children: [
        { name: 'core', type: 'folder' as const, desc: 'Geometry primitives' },
        { name: 'generation', type: 'folder' as const, desc: 'Floorplan synthesis' },
        { name: 'rendering', type: 'folder' as const, desc: 'PIL-based visual output' },
        { name: 'inference', type: 'folder' as const, desc: 'NVIDIA NIM API integration' },
        { name: 'storage', type: 'folder' as const, desc: 'Persistence layers' },
        { name: 'analysis', type: 'folder' as const, desc: 'Metrics & visualization' }
      ]
    },
    {
      name: 'outputs',
      type: 'folder' as const,
      children: [
        { name: 'floorplans', type: 'folder' as const, desc: 'Generated layouts (JSON)' },
        { name: 'images', type: 'folder' as const, desc: 'Rendered PNGs' },
        { name: 'predictions', type: 'folder' as const, desc: 'Model responses (Parquet)' }
      ]
    },
    { name: 'main.py', type: 'file' as const, desc: 'Experiment runner' }
  ]
};

// --- EXPANDED CONTENT ---
const HypothesisExpanded = () => (
  <div className="grid md:grid-cols-2 gap-12">
    <div>
      <h3 className="text-xl font-light mb-6">The "Blind Spot" of Vision Models</h3>
      <p className="text-sm font-light opacity-80 leading-relaxed mb-6">
        Current Vision-Language Models (VLMs) are excellent at object detection ("there is a chair") but struggle with
        structural inference ("this room must be a bedroom because it has an attached bath").
      </p>
      <p className="text-sm font-light opacity-80 leading-relaxed">
        This experiment isolates that reasoning capability. By masking a single room in a generated floorplan,
        we force the model to rely entirely on architectural context—adjacency, flow, and regional norms—to deduce the missing label.
      </p>
    </div>
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <h4 className="text-xs font-mono uppercase tracking-widest text-white/70 mb-4">Methodology</h4>
      <ul className="space-y-4 text-sm font-mono">
        <li className="flex justify-between border-b border-white/5 pb-2">
          <span>Generator</span>
          <span className="text-white/70">Wave Function Collapse</span>
        </li>
        <li className="flex justify-between border-b border-white/5 pb-2">
          <span>Dataset</span>
          <span className="text-white/70">10k Synthetic Plans</span>
        </li>
        <li className="flex justify-between border-b border-white/5 pb-2">
          <span>Model</span>
          <span className="text-white/70">Llava-v1.6 / GPT-4V</span>
        </li>
        <li className="flex justify-between pb-2">
          <span>Task</span>
          <span className="text-white/70">Zero-shot Classification</span>
        </li>
      </ul>
    </div>
  </div>
);

const ResultsExpanded = () => (
  <div className="space-y-12">
    <div className="grid md:grid-cols-2 gap-8">
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h4 className="text-xs font-mono uppercase tracking-widest text-white/70 mb-6">Confusion Matrix (Top 5 Rooms)</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="w-24 text-xs font-mono text-right text-white/75">Bathroom</span>
            <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500/60 w-[92%]" />
            </div>
            <span className="w-12 text-xs font-mono text-right">92%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-24 text-xs font-mono text-right text-white/75">Kitchen</span>
            <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500/50 w-[88%]" />
            </div>
            <span className="w-12 text-xs font-mono text-right">88%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-24 text-xs font-mono text-right text-white/75">Garage</span>
            <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500/50 w-[76%]" />
            </div>
            <span className="w-12 text-xs font-mono text-right">76%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-24 text-xs font-mono text-right text-white/75">Bedroom</span>
            <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500/40 w-[65%]" />
            </div>
            <span className="w-12 text-xs font-mono text-right">65%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-24 text-xs font-mono text-right text-white/75">Office</span>
            <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-red-500/40 w-[32%]" />
            </div>
            <span className="w-12 text-xs font-mono text-right">32%</span>
          </div>
        </div>
      </div>

      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h4 className="text-xs font-mono uppercase tracking-widest text-white/70 mb-6">Key Insights</h4>
        <ul className="space-y-4 text-sm font-light text-white/85">
          <li className="flex gap-3">
            <span className="text-green-400">→</span>
            <span>
              <strong>Functional Adjacency:</strong> Models strongly associate bathrooms with bedrooms and kitchens with dining areas.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-yellow-400">→</span>
            <span>
              <strong>Size Bias:</strong> Large undefined rooms are almost always predicted as "Living Room," regardless of position.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-red-400">→</span>
            <span>
              <strong>Ambiguity Failure:</strong> Flexible spaces (Office vs. Guest Room) confuse the model, revealing a lack of subtle cultural context.
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
);

export default function CaseStudyWhatsInTheRoom() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  useControlledScroll(scrollContainerRef);

  return (
    <div
      ref={scrollContainerRef}
      className="h-screen overflow-y-auto overflow-x-hidden bg-[#0d0603] text-[#FDFBF7] font-body selection:bg-amber-900/30 selection:text-white"
    >

      <div ref={viewRef} className="fixed inset-0 z-0 pointer-events-none">
        <View track={viewRef}>
          <GradientBackground />
          <ParticleField />
        </View>
      </div>

      <Nav />

      <section data-section className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 pt-20 relative z-10">
        <div className="text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.0, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex rounded-full border border-white/25 bg-black/30 px-4 py-1.5 text-[10px] md:text-xs tracking-[0.35em] uppercase text-white/90 mb-6 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)] font-mono"
          >
            Case Study
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: 'blur(15px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tighter leading-[0.9] [text-shadow:_0_2px_30px_rgba(0,0,0,0.9),_0_4px_60px_rgba(0,0,0,0.8)]"
          >
            What's In The Room
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.0, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl font-light tracking-wide opacity-80 mt-8 max-w-2xl mx-auto [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]"
          >
            Testing whether AI can understand architecture — by hiding one room and asking it to guess
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap justify-center gap-3 mt-10"
          >
            {['Python', 'Vision AI', 'Spatial Reasoning', 'Synthetic Data'].map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.0 + i * 0.1 }}
                className="px-4 py-1.5 border border-white/25 rounded-full text-[10px] tracking-[0.15em] uppercase backdrop-blur-sm bg-black/35 text-white/90 font-mono"
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.5 }}
          className="absolute bottom-12 w-px h-16 bg-gradient-to-b from-white/0 via-white/50 to-white/0 animate-pulse"
        />
      </section>

      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow
            title="Hypothesis.md"
            path="~/whats-in-the-room/docs"
            summary="Testing if AI can deduce room types from floorplan context alone."
            expandedContent={<HypothesisExpanded />}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/70 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">The Question</div>
            <blockquote className="text-2xl md:text-4xl lg:text-5xl font-thin leading-snug tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">
              "If you hide one room in a floorplan, can AI figure out what it is just by looking at everything else?"
            </blockquote>
            <p className="text-base md:text-lg font-light text-white/85 mt-10 max-w-2xl leading-relaxed [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">
              Humans use context constantly. A small room next to the master bedroom is probably a closet.
              A room with a door to the outside might be a garage. Can vision-language models
              pick up on these spatial relationships — or do they just see pixels?
            </p>
          </GlassWindow>
        </div>
      </section>

      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-5xl mx-auto w-full">
          <GlassWindow
            title="Experiment_Flow.canvas"
            path="~/whats-in-the-room/design"
            summary="A four-step process: Generate floorplan, Mask room, Query VLM, Evaluate prediction."
            expandedContent={<div className="flex justify-center"><WhatsInTheRoomExperiment /></div>}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/70 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">The Experiment</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">How we tested it</h2>

            <WhatsInTheRoomExperiment />
          </GlassWindow>
        </div>
      </section>

      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-5xl mx-auto w-full">
          <GlassWindow
            title="Components.json"
            path="~/whats-in-the-room/src"
            summary="Procedural generation engine, regional architecture rules, and deterministic seed system."
          >
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/70 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">The Building Blocks</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">What powers the experiment</h2>

            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Infinite Floorplans</h3>
                <p className="text-sm font-light text-white/85 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Procedural generation creates unlimited unique layouts. No external datasets needed —
                  every floorplan is synthesized from architectural rules and regional constraints.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/70">
                  src/generation/ — layout synthesis
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Regional Architecture</h3>
                <p className="text-sm font-light text-white/85 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  US suburbs have attached garages. Chinese apartments have shoe rooms. European flats have different proportions.
                  The generator knows these rules.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/70">
                  6+ architectural regions
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Deterministic Seeds</h3>
                <p className="text-sm font-light text-white/85 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Every experiment is reproducible. Same seed, same floorplan.
                  This lets us isolate variables and trust our results.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/70">
                  Full reproducibility
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
                <h3 className="text-xl font-light tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Ambiguity by Design</h3>
                <p className="text-sm font-light text-white/85 leading-relaxed [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  We don't hide obvious rooms. We pick closets, offices, storage rooms —
                  spaces that require reasoning about neighbors and context.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/70">
                  src/inference/ — mystery selection
                </div>
              </motion.div>
            </div>
          </GlassWindow>
        </div>
      </section>

      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-5xl mx-auto w-full">
          <GlassWindow
            title="Results_Analysis.py"
            path="~/whats-in-the-room/analysis"
            summary="Models correctly identified bathrooms and kitchens but struggled with context-dependent rooms like offices."
            expandedContent={<ResultsExpanded />}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/70 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">What We Found</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-16 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">The numbers tell a story</h2>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16"
            >
              <MetricCard value="1000s" label="Floorplans Tested" />
              <MetricCard value="6+" label="Architectural Regions" />
              <MetricCard value="F1/P/R" label="Per Room Type" />
              <MetricCard value="100%" label="Reproducible" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-2 gap-8"
            >
              <div className="p-6 border border-white/10 rounded-lg bg-white/5">
                <div className="text-xs tracking-[0.2em] uppercase text-white/70 mb-4 font-mono">What Models Got Right</div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <span className="text-white/75">Bathrooms</span>
                    <span className="font-mono">High confidence</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/75">Kitchens</span>
                    <span className="font-mono">Size + proximity</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                    <span className="text-white/75">Living rooms</span>
                    <span className="text-white font-mono">Central, large</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-white/10 rounded-lg bg-white/5">
                <div className="text-xs tracking-[0.2em] uppercase text-white/70 mb-4 font-mono">Where Models Struggled</div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <span className="text-white/75">Closets vs. Storage</span>
                    <span className="font-mono">Similar size</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/75">Office vs. Guest Bedroom</span>
                    <span className="font-mono">Context-dependent</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                    <span className="text-white/75">Regional variations</span>
                    <span className="text-white font-mono">Cultural norms</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </GlassWindow>
        </div>
      </section>

      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow
            title="File_Explorer"
            path="~/whats-in-the-room"
            summary="Explore the generation, rendering, and inference modules."
            expandedContent={<div className="p-8"><CodebaseTree data={codebaseData} /></div>}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/70 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">Structure</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Codebase</h2>

            <CodebaseTree data={codebaseData} />
          </GlassWindow>
        </div>
      </section>

      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center w-full">
          <GlassWindow
            title="Reflection.md"
            path="~/whats-in-the-room/thoughts"
            summary="Demonstrating the importance of synthetic benchmarks for testing AI perception."
          >
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/70 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">The Bigger Picture</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-12 [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">What this project represents</h2>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <div className="text-lg font-light mb-3 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Synthetic Benchmarks</div>
                <p className="text-sm font-light text-white/85 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Creating controlled test environments where every variable is known and reproducible
                </p>
              </div>
              <div>
                <div className="text-lg font-light mb-3 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Testing Perception</div>
                <p className="text-sm font-light text-white/85 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Probing what AI actually "sees" versus what it pattern-matches from training data
                </p>
              </div>
              <div>
                <div className="text-lg font-light mb-3 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">Honest Measurement</div>
                <p className="text-sm font-light text-white/85 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">
                  Finding where models succeed and where they fail — both matter equally
                </p>
              </div>
            </div>
          </GlassWindow>
        </div>
      </section>

      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow
            title="Journal.md"
            path="~/personal/notes"
            summary="Reflecting on the nature of intelligence and spatial understanding."
          >
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/70 mb-8 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)] font-mono">Why This Exists</div>
            <div className="space-y-8 text-base md:text-lg font-light leading-relaxed opacity-90 [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]">
              <p>
                There's something almost childlike about this experiment. You draw a house, you hide one room's name,
                and you ask: can you tell what this is? It's the kind of game a kid might play.
              </p>
              <p>
                But underneath that simplicity is a real question about intelligence. When a vision model looks at a floorplan,
                does it understand that the small room next to the bathroom is probably a linen closet? Does it grasp that
                American houses have attached garages while Tokyo apartments don't? Or is it just matching pixels to labels
                it's seen before?
              </p>
              <p>
                The answer, as always, is somewhere in between. And that's what makes it <em className="opacity-100">interesting.</em>
              </p>
            </div>
          </GlassWindow>
        </div>
      </section>

      <section data-section className="min-h-screen flex items-center justify-center px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          <GlassWindow
            title="Terminal"
            path="~/whats-in-the-room"
            summary="Ready to dive in? View the source code on GitHub."
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <div className="text-2xl md:text-3xl font-thin tracking-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.9)]">Explore the code</div>
                <p className="text-sm font-light text-white/85 mt-2 [text-shadow:_0_1px_5px_rgba(0,0,0,0.9)]">MIT Licensed. Open source.</p>
              </div>
              <a
                href="https://github.com/basedlsg/WhatsInTheRoom"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative px-10 py-4 bg-transparent overflow-hidden rounded-full transition-all hover:scale-105"
              >
                <div className="absolute inset-0 border border-white/30 rounded-full group-hover:border-white/80 transition-colors duration-500" />
                <div className="absolute inset-0 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left opacity-10" />
                <span className="relative text-sm font-bold tracking-[0.2em] uppercase font-mono">
                  View on GitHub
                </span>
              </a>
            </div>
          </GlassWindow>
        </div>
      </section>

    </div>
  );
}
