import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Maximize2, Minimize2, X, Minus, Plus, RefreshCw } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlassWindowProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    path?: string;
    summary?: string;
    expandedContent?: React.ReactNode;
    defaultState?: 'open' | 'minimized' | 'maximized' | 'closed';
}

export function GlassWindow({
    children,
    className,
    title = "Terminal",
    path = "~/projects/spatial-lab",
    summary = "Click to expand...",
    expandedContent,
    defaultState = 'open'
}: GlassWindowProps) {
    const [windowState, setWindowState] = useState<'open' | 'minimized' | 'maximized' | 'closed'>(defaultState);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    };

    // Reopen Button State
    if (windowState === 'closed') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center p-4"
            >
                <button
                    onClick={() => setWindowState('open')}
                    className="group flex items-center gap-3 px-6 py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all shadow-xl"
                >
                    <div className="p-1.5 rounded-full bg-white/10 group-hover:rotate-180 transition-transform duration-500">
                        <RefreshCw className="w-4 h-4 text-white/70" />
                    </div>
                    <span className="text-xs font-mono tracking-widest uppercase text-white/70 group-hover:text-white">Reopen {title}</span>
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            className={cn(
                "group relative overflow-hidden rounded-xl transition-all duration-500",
                // Ultra Glass Aesthetic
                "backdrop-blur-2xl backdrop-saturate-150",
                "bg-gradient-to-b from-white/[0.08] to-transparent",
                "border border-white/10",
                "shadow-2xl shadow-black/50",
                windowState === 'maximized' ? "fixed inset-4 z-[100] m-0 w-auto h-auto bg-black/80 backdrop-blur-3xl" : "",
                className
            )}
            style={{
                // Specular inner rim light
                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.1)'
            }}
            onMouseMove={handleMouseMove}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{
                layout: { duration: 0.5, ease: [0.32, 0.72, 0, 1] },
                opacity: { duration: 0.4 }
            }}
        >
            {/* Noise Texture Overlay */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    backgroundSize: '128px 128px'
                }}
            />

            {/* Subtle Spotlight */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-500 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              800px circle at ${mouseX}px ${mouseY}px,
              rgba(255,255,255,0.06),
              transparent 80%
            )
          `,
                }}
            />

            {/* Window Chrome / Header */}
            <div
                className="relative flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02] cursor-default select-none"
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    setWindowState(s => s === 'maximized' ? 'open' : 'maximized');
                }}
            >
                {/* Traffic Lights */}
                <div className="flex items-center gap-2 group/controls z-10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setWindowState('closed');
                        }}
                        className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 shadow-inner flex items-center justify-center hover:brightness-90 transition-all"
                        title="Close"
                    >
                        <X className="w-2 h-2 text-black/50 opacity-0 group-hover/controls:opacity-100 transition-opacity" strokeWidth={3} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setWindowState(s => s === 'minimized' ? 'open' : 'minimized');
                        }}
                        className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 shadow-inner flex items-center justify-center hover:brightness-90 transition-all"
                        title="Minimize"
                    >
                        <Minus className="w-2 h-2 text-black/50 opacity-0 group-hover/controls:opacity-100 transition-opacity" strokeWidth={3} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setWindowState(s => s === 'maximized' ? 'open' : 'maximized');
                        }}
                        className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 shadow-inner flex items-center justify-center hover:brightness-90 transition-all"
                        title="Maximize"
                    >
                        {windowState === 'maximized' ? (
                            <Minimize2 className="w-2 h-2 text-black/50 opacity-0 group-hover/controls:opacity-100 transition-opacity" strokeWidth={3} />
                        ) : (
                            <Maximize2 className="w-2 h-2 text-black/50 opacity-0 group-hover/controls:opacity-100 transition-opacity" strokeWidth={3} />
                        )}
                    </button>
                </div>

                {/* Title */}
                <div className="absolute left-0 right-0 flex justify-center items-center gap-2 opacity-60 pointer-events-none">
                    <span className="text-[11px] font-medium tracking-wide text-white/90 drop-shadow-md">{title}</span>
                </div>

                {/* Path */}
                <div className="text-[10px] font-mono text-white/30 tracking-tight hidden sm:block z-10">
                    {path}
                </div>
            </div>

            {/* Content Area */}
            <div className="relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {windowState === 'minimized' ? (
                        <motion.div
                            key="summary"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-4 py-3 bg-white/[0.01]"
                        >
                            <p className="text-sm text-white/50 font-light italic truncate">
                                {summary}
                            </p>
                        </motion.div>
                    ) : windowState === 'maximized' && expandedContent ? (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-8 md:p-12 h-[calc(100vh-60px)] overflow-y-auto"
                        >
                            <div className="max-w-7xl mx-auto">
                                <div className="mb-12 pb-8 border-b border-white/10">
                                    <h2 className="text-4xl md:text-5xl font-thin tracking-tight mb-4">{title}</h2>
                                    <p className="text-xl text-white/60 font-light">{summary}</p>
                                </div>
                                {expandedContent}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "p-6 md:p-8 transition-all duration-500",
                                windowState === 'maximized' ? "h-[calc(100vh-60px)] overflow-y-auto" : ""
                            )}
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
