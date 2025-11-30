import React, { useState, useEffect } from 'react';

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <div className={`transition-all duration-1000 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  );
};

const SectionDivider = () => (
  <div className="w-full flex justify-center py-16">
    <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
  </div>
);

const MetricCard = ({ value, label }: { value: string, label: string }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-thin tracking-tight">{value}</div>
    <div className="text-[10px] md:text-xs tracking-[0.2em] uppercase opacity-50 mt-2">{label}</div>
  </div>
);

export default function CaseStudySpatialLab() {
  return (
    <div className="min-h-screen bg-[#1a0c05] text-[#FDFBF7] font-sans selection:bg-[#B06520] selection:text-white">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 md:p-8 flex justify-between items-center mix-blend-difference">
        <a href="#/" className="text-xs tracking-[0.3em] uppercase opacity-70 hover:opacity-100 transition-opacity">
          &larr; Walking Stick Labs
        </a>
        <a
          href="https://github.com/basedlsg/spatial-lab"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-[0.3em] uppercase opacity-70 hover:opacity-100 transition-opacity"
        >
          View Code &rarr;
        </a>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 pt-20">
        <FadeIn delay={200} className="text-center max-w-4xl">
          <div className="text-[10px] md:text-xs tracking-[0.4em] uppercase opacity-50 mb-6">
            Case Study
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tighter leading-[0.9]">
            Spatial Lab
          </h1>
          <p className="text-lg md:text-xl font-light tracking-wide opacity-70 mt-8 max-w-2xl mx-auto">
            A research framework for multi-agent coordination with LLM-driven spatial reasoning
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {['Python', 'LLM Integration', 'Multi-Agent Systems', 'Simulation'].map((tag) => (
              <span key={tag} className="px-4 py-1.5 border border-white/20 rounded-full text-[10px] tracking-[0.15em] uppercase">
                {tag}
              </span>
            ))}
          </div>
        </FadeIn>

        <div className="absolute bottom-12 w-px h-16 bg-gradient-to-b from-white/0 via-white/50 to-white/0 animate-pulse" />
      </section>

      {/* The Question */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8">The Question</div>
            <blockquote className="text-2xl md:text-4xl lg:text-5xl font-thin leading-snug tracking-tight">
              "Can language models reason about physical space well enough to coordinate multiple agents?"
            </blockquote>
            <p className="text-base md:text-lg font-light opacity-70 mt-10 max-w-2xl leading-relaxed">
              LLMs are trained on text. They've never walked through a warehouse or moved a box.
              Yet they can often answer spatial questions correctly. Spatial Lab tests how far this capability extends
              when applied to real coordination problems.
            </p>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* Architecture */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8">System Architecture</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16">How it works</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <pre className="text-[10px] md:text-xs font-mono leading-relaxed opacity-80 overflow-x-auto">
{`
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   "Move the red crate to shelf B, avoiding the forklift"            │
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────┐                     │
│   │          LLM SPATIAL REASONER             │                     │
│   │          (Gemini / GPT-4)                 │                     │
│   │                                           │                     │
│   │   • Parse natural language intent         │                     │
│   │   • Understand spatial relationships      │                     │
│   │   • Reason about obstacles & paths        │                     │
│   └───────────────────────────────────────────┘                     │
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────┐                     │
│   │        COORDINATION ENGINE                │                     │
│   │                                           │                     │
│   │   • Select optimal agent for task         │                     │
│   │   • Calculate collision-free path         │                     │
│   │   • Manage inter-agent communication      │                     │
│   └───────────────────────────────────────────┘                     │
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────┐                     │
│   │       WAREHOUSE SIMULATION                │                     │
│   │                                           │                     │
│   │   • Configurable layouts (20m - 80m)      │                     │
│   │   • 2-10 coordinated agents               │                     │
│   │   • Physics-based constraints             │                     │
│   └───────────────────────────────────────────┘                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
`}
            </pre>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* What Was Built */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8">Implementation</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16">What was built</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <FadeIn delay={100}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight">Warehouse Simulation</h3>
                <p className="text-sm font-light opacity-60 leading-relaxed">
                  Procedural layout generation with configurable dimensions (20m-80m).
                  Realistic shelf placement, aisle generation, and physics-based collision detection.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-40">
                  environments/ — 1,200+ lines
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight">Fleet Coordination</h3>
                <p className="text-sm font-light opacity-60 leading-relaxed">
                  Multi-robot management for 2-10 agents. Path planning with collision avoidance,
                  inter-robot communication protocols, and task allocation.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-40">
                  coordination/ — 800+ lines
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight">LLM Integration</h3>
                <p className="text-sm font-light opacity-60 leading-relaxed">
                  Structured prompts for spatial reasoning. Supports GPT-4 and Gemini.
                  Observation-action-reward loops for decision making under uncertainty.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-40">
                  llm/ — Gemini & OpenAI clients
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="space-y-4">
                <h3 className="text-xl font-light tracking-tight">Research Framework</h3>
                <p className="text-sm font-light opacity-60 leading-relaxed">
                  Statistical validation with control groups, significance testing,
                  and effect size calculations. Built for reproducible experiments.
                </p>
                <div className="pt-4 border-t border-white/10 text-xs font-mono opacity-40">
                  evaluation/ — 600+ lines
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Results */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8">Validation</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-16">Results</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
              <MetricCard value="85%" label="Path Efficiency" />
              <MetricCard value="92%" label="Collision Avoidance" />
              <MetricCard value="81%" label="Coordination" />
              <MetricCard value="18.7%" label="Improvement" />
            </div>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-6 border border-white/10 rounded-lg">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 mb-4">Baseline Comparison</div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <span className="opacity-60">Random Agent</span>
                    <span>30% efficiency, 80% collisions</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Rule-Based Agent</span>
                    <span>60% efficiency, 20% collisions</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                    <span className="opacity-60">Spatial Lab</span>
                    <span className="text-white">85% efficiency, 8% collisions</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-white/10 rounded-lg">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50 mb-4">Statistical Validation</div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <span className="opacity-60">Control Group Mean</span>
                    <span>0.695</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Treatment Group Mean</span>
                    <span>0.825</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                    <span className="opacity-60">Effect Size</span>
                    <span className="text-white">+18.7% (p &lt; 0.05)</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* Code Structure */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8">Structure</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12">Codebase</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <pre className="text-xs md:text-sm font-mono leading-loose opacity-70">
{`spatial_lab/
├── environments/        # Warehouse simulation
│   └── warehouse.py     # Layout generation, physics
├── coordination/        # Multi-agent systems
│   ├── fleet.py         # Robot management
│   ├── pathfinding.py   # A*, collision avoidance
│   └── communication.py # Inter-robot messaging
├── llm/                 # Language model integration
│   ├── gemini.py        # Google Gemini client
│   └── openai.py        # GPT-4 client
├── evaluation/          # Research framework
│   ├── metrics.py       # Performance measurement
│   └── statistics.py    # Significance testing
└── config.py            # Experiment configuration`}
            </pre>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* Limitations */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8">Honest Assessment</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12">Limitations</h2>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50">Current State</div>
                <ul className="space-y-3 text-sm font-light opacity-70">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>LLM integration framework operational</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Multi-robot coordination validated</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Statistical validation framework</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Reproducible experiment runners</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-6">
                <div className="text-xs tracking-[0.2em] uppercase opacity-50">In Progress</div>
                <ul className="space-y-3 text-sm font-light opacity-70">
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400 mt-0.5">○</span>
                    <span>Full A* pathfinding implementation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400 mt-0.5">○</span>
                    <span>Multi-agent conflict resolution</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400 mt-0.5">○</span>
                    <span>Automated test coverage</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400 mt-0.5">○</span>
                    <span>Production hardening</span>
                  </li>
                </ul>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <SectionDivider />

      {/* What This Demonstrates */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8">Takeaway</div>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight mb-12">What this demonstrates</h2>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <div className="text-lg font-light mb-3">Systems Design</div>
                <p className="text-sm font-light opacity-60">
                  Architecting complex multi-component systems with clear separation of concerns
                </p>
              </div>
              <div>
                <div className="text-lg font-light mb-3">Research Rigor</div>
                <p className="text-sm font-light opacity-60">
                  Scientific methodology with proper statistical validation and reproducibility
                </p>
              </div>
              <div>
                <div className="text-lg font-light mb-3">AI Integration</div>
                <p className="text-sm font-light opacity-60">
                  Practical application of LLMs beyond text — exploring spatial reasoning capabilities
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 md:py-32 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="text-2xl md:text-3xl font-thin tracking-tight">Explore the code</div>
            <p className="text-sm font-light opacity-60 mt-2">MIT Licensed. Open source.</p>
          </div>
          <a
            href="https://github.com/basedlsg/spatial-lab"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-10 py-4 bg-transparent overflow-hidden rounded-full transition-all hover:scale-105"
          >
            <div className="absolute inset-0 border border-white/30 rounded-full group-hover:border-white/80 transition-colors duration-500" />
            <div className="absolute inset-0 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left opacity-10" />
            <span className="relative text-sm font-bold tracking-[0.2em] uppercase">
              View on GitHub
            </span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 text-center">
        <div className="text-[9px] md:text-[10px] tracking-[0.3em] opacity-40 uppercase space-y-2">
          <div>San Francisco — CA, Beijing — CN</div>
          <div>&copy; Walking Stick Labs</div>
        </div>
      </footer>
    </div>
  );
}
