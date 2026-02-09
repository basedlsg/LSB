import React, { useState, useEffect } from 'react';
import Cursor from './Cursor';

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <div className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}>
      {children}
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: string, title: string, description: string }) => (
  <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.06] transition-all duration-300">
    <div className="text-2xl mb-3">{icon}</div>
    <h3 className="text-lg font-light mb-2 text-white/90">{title}</h3>
    <p className="text-sm text-white/60 leading-relaxed">{description}</p>
  </div>
);

const Screenshot = ({ src, alt, caption }: { src: string, alt: string, caption: string }) => (
  <div className="group relative">
    <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-black/40">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
      />
    </div>
    <p className="mt-3 text-xs text-white/50 text-center">{caption}</p>
  </div>
);

export default function OmbrixaProject() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const techStack = [
    { layer: 'Frontend', tech: 'React + TypeScript', purpose: 'Component-based UI' },
    { layer: 'Build', tech: 'Vite + Vite PWA', purpose: 'Fast builds, installability' },
    { layer: 'AI Engine', tech: 'Gemini 2.0 Flash', purpose: 'Multi-frame vision analysis' },
    { layer: 'Storage', tech: 'IndexedDB (Dexie)', purpose: 'Local-first persistence' },
    { layer: 'Maps', tech: 'Leaflet + CartoDB', purpose: 'Incident visualization' },
    { layer: 'Camera', tech: 'react-webcam + MediaRecorder', purpose: 'Cross-platform capture' },
    { layer: 'Hosting', tech: 'Vercel', purpose: 'Edge CDN deployment' },
  ];

  const designPrinciples = [
    { principle: 'Mobile-first', implementation: 'One-handed UI, touch-optimized controls' },
    { principle: 'Local-first', implementation: 'IndexedDB storage, offline capability' },
    { principle: 'Privacy-forward', implementation: 'No mandatory cloud, encrypted biometrics' },
    { principle: 'Calm UX', implementation: 'Neutral framing, minimal visual noise' },
    { principle: 'Fast feedback', implementation: 'Streaming analysis, progress indicators' },
  ];

  const userFlow = [
    { step: 'Check-In', desc: 'Hold-to-confirm location verification' },
    { step: 'Capture', desc: 'Record scene (≤30 seconds)' },
    { step: 'Process', desc: 'Automatic frame extraction + AI analysis' },
    { step: 'Review', desc: 'View SITREP, safety score, detected entities' },
    { step: 'Search', desc: 'Query past incidents by plates, badges, or keywords' },
    { step: 'Map', desc: 'Visualize incidents geospatially' },
  ];

  return (
    <div className="min-h-screen bg-[#050208] text-[#FDFBF7] font-sans selection:bg-purple-500/30 selection:text-white">
      <Cursor />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center backdrop-blur-md bg-[#050208]/80 border-b border-white/[0.05]">
        <a href="#/" className="text-xs tracking-[0.3em] uppercase opacity-60 hover:opacity-100 transition-opacity">
          &larr; Walking Stick Labs
        </a>
        <a
          href="https://ombrixa.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-full border border-purple-500/30 text-purple-400 text-xs tracking-[0.2em] uppercase hover:bg-purple-500/10 transition-all"
        >
          Live Demo
        </a>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-8 pt-24 pb-16 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <FadeIn delay={100} className="text-center z-10">
          <p className="text-xs tracking-[0.4em] uppercase text-purple-400 mb-6">Walking Stick Labs Project</p>
          <h1 className="text-6xl md:text-8xl font-thin tracking-tight mb-6">Ombrixa</h1>
          <p className="text-xl md:text-2xl font-light text-white/70 max-w-2xl mx-auto leading-relaxed">
            Mobile AI for Situational Awareness
          </p>
        </FadeIn>

        <FadeIn delay={400} className="mt-12 z-10">
          <p className="text-base text-white/50 max-w-xl text-center leading-relaxed">
            A mobile-first PWA that transforms smartphones into tactical awareness devices,
            turning short video clips into structured, searchable intelligence.
          </p>
        </FadeIn>

        <FadeIn delay={600} className="mt-16 z-10">
          <div className="w-px h-24 bg-gradient-to-b from-purple-500/50 to-transparent mx-auto" />
        </FadeIn>
      </section>

      {/* Features Overview */}
      <section className="px-8 py-24 max-w-6xl mx-auto">
        <FadeIn>
          <h2 className="text-xs tracking-[0.3em] uppercase text-purple-400 mb-4">Project Overview</h2>
          <p className="text-2xl font-light text-white/80 mb-12 max-w-3xl">
            Ombrixa is an AI-powered mobile application that enables users to record short video clips
            and receive instant, actionable intelligence.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon="🚗"
            title="Vehicle Identification"
            description="Make, model, color, license plates, agency affiliation"
          />
          <FeatureCard
            icon="👮"
            title="Personnel Details"
            description="Uniforms, badges, ranks, precincts"
          />
          <FeatureCard
            icon="⚠️"
            title="Safety Scoring"
            description="Real-time threat assessment (1-100 scale)"
          />
          <FeatureCard
            icon="📍"
            title="Geolocation"
            description="GPS-tagged incident mapping"
          />
          <FeatureCard
            icon="🏷️"
            title="Context Tags"
            description="Scene classification and categorization"
          />
          <FeatureCard
            icon="📱"
            title="Progressive Web App"
            description="Installable, offline-capable, native experience"
          />
        </div>
      </section>

      {/* Screenshots */}
      <section className="px-8 py-24 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-xs tracking-[0.3em] uppercase text-purple-400 mb-4">Live Application</h2>
            <p className="text-2xl font-light text-white/80 mb-12">Screenshots</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Screenshot
              src="/projects/ombrixa/live-zone-1.png"
              alt="Live Zone with Houston Police detection"
              caption="Live Zone — Real-time capture with AI overlay and SITREP analysis"
            />
            <Screenshot
              src="/projects/ombrixa/live-zone-2.png"
              alt="Live Zone with multiple vehicle detection"
              caption="Live Zone — Multi-vehicle detection at traffic intersection"
            />
            <Screenshot
              src="/projects/ombrixa/detailed-intel.png"
              alt="Detailed Intelligence panel"
              caption="Detailed Intelligence — Structured AI analysis with threat level"
            />
            <Screenshot
              src="/projects/ombrixa/offline-state.png"
              alt="Offline state with pending analysis"
              caption="Graceful Offline — Auto-resume capability when connection restored"
            />
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="px-8 py-24 max-w-6xl mx-auto">
        <FadeIn>
          <h2 className="text-xs tracking-[0.3em] uppercase text-purple-400 mb-4">Technical Architecture</h2>
          <p className="text-2xl font-light text-white/80 mb-12">Data Flow</p>
        </FadeIn>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          {[
            { icon: '📍', label: 'Check-in / QR Session' },
            { icon: '📹', label: 'Camera Capture (≤30s)' },
            { icon: '🖼️', label: 'Frame Extraction (≤5 frames)' },
            { icon: '🤖', label: 'AI Analysis (Gemini Vision)' },
            { icon: '📊', label: 'Structured JSON Result' },
            { icon: '📱', label: 'Feed + Map + Query Views' },
            { icon: '💾', label: 'Local IndexedDB Storage' },
          ].map((step, i) => (
            <React.Fragment key={step.label}>
              <div className="px-4 py-3 rounded-lg bg-white/[0.05] border border-white/[0.1] text-center">
                <span className="text-lg mr-2">{step.icon}</span>
                <span className="text-white/70">{step.label}</span>
              </div>
              {i < 6 && <span className="text-white/30 hidden md:block">→</span>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="px-8 py-24 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <h2 className="text-xs tracking-[0.3em] uppercase text-purple-400 mb-4">Technology Stack</h2>
            <p className="text-2xl font-light text-white/80 mb-12">Built with modern tools</p>
          </FadeIn>

          <div className="overflow-hidden rounded-xl border border-white/[0.1]">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.05]">
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase text-white/50">Layer</th>
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase text-white/50">Technology</th>
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase text-white/50 hidden md:table-cell">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {techStack.map((row, i) => (
                  <tr key={row.layer} className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                    <td className="px-6 py-4 text-sm text-white/70">{row.layer}</td>
                    <td className="px-6 py-4 text-sm text-purple-300 font-mono">{row.tech}</td>
                    <td className="px-6 py-4 text-sm text-white/50 hidden md:table-cell">{row.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="px-8 py-24 max-w-6xl mx-auto">
        <FadeIn>
          <h2 className="text-xs tracking-[0.3em] uppercase text-purple-400 mb-4">Key Features</h2>
          <p className="text-2xl font-light text-white/80 mb-12">Capabilities in detail</p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-light text-purple-300 flex items-center gap-2">
              <span>🎥</span> Intelligent Video Capture
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• 30-second maximum recordings optimized for mobile memory</li>
              <li>• Multi-frame extraction at 0.5s intervals (up to 5 frames)</li>
              <li>• Automatic JPEG compression (1024px, 0.7 quality)</li>
              <li>• Cross-platform MIME type handling (iOS/Android/Desktop)</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-light text-purple-300 flex items-center gap-2">
              <span>🧠</span> AI-Powered Analysis
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• Gemini 2.0 Flash multimodal inference</li>
              <li>• Structured JSON output with strict schema enforcement</li>
              <li>• Retry logic with exponential backoff (429/503 handling)</li>
              <li>• Graceful degradation for parse failures</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-light text-purple-300 flex items-center gap-2">
              <span>📊</span> Rich Incident Feed
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• Scrollable incident cards with video thumbnails</li>
              <li>• Expandable intelligence overlays</li>
              <li>• Community voting indicators</li>
              <li>• Lazy-loaded video blobs from IndexedDB</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-light text-purple-300 flex items-center gap-2">
              <span>🗺️</span> Geospatial Visualization
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• Interactive map with color-coded markers</li>
              <li>• Green (safe) / Red (dangerous) sentiment indicators</li>
              <li>• Geographic clustering for dense incidents</li>
              <li>• 50km radius filtering for local relevance</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-light text-purple-300 flex items-center gap-2">
              <span>🔐</span> Privacy-First Design
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• Local-only storage by default</li>
              <li>• Optional encrypted biometric data (AES-GCM)</li>
              <li>• No remote servers required for core functionality</li>
              <li>• User-controlled data lifecycle</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-light text-purple-300 flex items-center gap-2">
              <span>📲</span> Progressive Web App
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• Installable to home screen</li>
              <li>• Offline capable (except AI analysis)</li>
              <li>• Automatic updates via service worker</li>
              <li>• Native app experience without app store</li>
            </ul>
          </div>
        </div>
      </section>

      {/* User Flow */}
      <section className="px-8 py-24 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <h2 className="text-xs tracking-[0.3em] uppercase text-purple-400 mb-4">User Flow</h2>
            <p className="text-2xl font-light text-white/80 mb-12">From capture to insight</p>
          </FadeIn>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 via-purple-500/20 to-transparent" />

            <div className="space-y-8">
              {userFlow.map((item, i) => (
                <div key={item.step} className="flex items-start gap-6 pl-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xs text-purple-300 -ml-4 z-10">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-light text-white/90">{item.step}</h3>
                    <p className="text-sm text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Design Principles */}
      <section className="px-8 py-24 max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="text-xs tracking-[0.3em] uppercase text-purple-400 mb-4">Design Principles</h2>
          <p className="text-2xl font-light text-white/80 mb-12">Guiding philosophy</p>
        </FadeIn>

        <div className="space-y-4">
          {designPrinciples.map((item) => (
            <div key={item.principle} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <span className="text-purple-300 font-medium min-w-[140px]">{item.principle}</span>
              <span className="text-white/50 text-sm">{item.implementation}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Project Structure */}
      <section className="px-8 py-24 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <h2 className="text-xs tracking-[0.3em] uppercase text-purple-400 mb-4">Project Structure</h2>
            <p className="text-2xl font-light text-white/80 mb-12">Codebase organization</p>
          </FadeIn>

          <div className="p-6 rounded-xl bg-black/40 border border-white/[0.1] font-mono text-sm overflow-x-auto">
            <pre className="text-white/70">
{`ombrixa/
├── App.tsx                    # Main app orchestration
├── components/
│   ├── CameraScreen.tsx       # Video capture interface
│   ├── CheckInScreen.tsx      # Location verification
│   ├── EventCard.tsx          # Incident display cards
│   ├── FeedScreen.tsx         # Scrollable incident feed
│   ├── MapVisualization.tsx   # Leaflet map view
│   └── QueryPortalScreen.tsx  # Local search interface
├── services/
│   ├── db.ts                  # IndexedDB (Dexie) wrapper
│   ├── geminiService.ts       # Gemini AI integration
│   ├── forensicService.ts     # Optional biometric encryption
│   ├── geo.ts                 # Distance calculations
│   └── syncService.ts         # Optional R2 cloud sync
└── api/
    └── upload-url.ts          # Presigned URL generation`}
            </pre>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-8 py-32 text-center">
        <FadeIn>
          <h2 className="text-4xl md:text-5xl font-thin mb-8">Try Ombrixa</h2>
          <p className="text-white/50 mb-12 max-w-lg mx-auto">
            Experience mobile AI-powered situational awareness. No app store required.
          </p>
          <a
            href="https://ombrixa.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm tracking-[0.2em] uppercase transition-colors"
          >
            Launch Demo
          </a>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="px-8 py-12 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <a href="#/" className="text-xs tracking-[0.3em] uppercase text-white/40 hover:text-white/70 transition-colors">
            Walking Stick Labs
          </a>
          <div className="flex items-center gap-8 text-xs text-white/30">
            <span>San Francisco — CA, Beijing — CN</span>
            <span>&copy; Walking Stick Labs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
