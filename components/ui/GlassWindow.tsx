import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Maximize2, Minimize2, X, Minus, RefreshCw } from 'lucide-react';
import LiquidGlass from './LiquidGlass';

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

    // Scroll Lock Effect
    React.useEffect(() => {
        if (windowState === 'maximized') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [windowState]);

    const windowContent = (
        <div
            className={cn(
                "group relative rounded-xl",
                windowState === 'maximized' ? "fixed inset-4 md:inset-10 z-[9999] m-0 w-auto h-auto shadow-2xl" : "",
                className
            )}
            onMouseMove={handleMouseMove}
            onClick={(e) => {
                if (windowState === 'maximized') {
                    e.stopPropagation();
                }
            }}
        >
            <LiquidGlass
                className="h-full w-full rounded-xl overflow-hidden"
                padding="0"
                displacementScale={windowState === 'maximized' ? 0.5 : 1.5}
                blurAmount={0.15}
                aberrationIntensity={0.5}
                elasticity={0.08}
                cornerRadius={12}
            >
                {/* Edge Vignette - darker around edges for framing */}
                <div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                        background: `
                            radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%),
                            linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.3) 100%)
                        `
                    }}
                />

                {/* Cursor Refraction Spotlight - follows mouse with prismatic effect */}
                <motion.div
                    className="pointer-events-none absolute inset-0 z-5 opacity-60"
                    style={{
                        background: useMotionTemplate`
                            radial-gradient(
                                400px circle at ${mouseX}px ${mouseY}px,
                                rgba(255,255,255,0.08),
                                transparent 60%
                            )
                        `,
                        mixBlendMode: 'overlay'
                    }}
                />

                {/* Chromatic aberration accent near cursor */}
                <motion.div
                    className="pointer-events-none absolute inset-0 z-5 opacity-30"
                    style={{
                        background: useMotionTemplate`
                            radial-gradient(
                                300px circle at ${mouseX}px ${mouseY}px,
                                rgba(100,200,255,0.15),
                                transparent 50%
                            )
                        `,
                        mixBlendMode: 'screen'
                    }}
                />

                <div className="relative z-20 h-full flex flex-col">
                    {/* Window Chrome / Header - darker for framing */}
                    <div
                        className="relative flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-sm cursor-default select-none shrink-0"
                        onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setWindowState(s => s === 'maximized' ? 'open' : 'maximized');
                        }}
                    >
                        {/* Traffic Lights */}
                        <div className="flex items-center gap-2 group/controls z-10">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
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
                                    e.preventDefault();
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
                                    e.preventDefault();
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
                    <div className="relative overflow-hidden flex-1">
                        <AnimatePresence mode="wait">
                            {windowState === 'minimized' ? (
                                <motion.div
                                    key="summary"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-6 py-4 bg-white/[0.01]"
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
                                    className="p-10 md:p-16 h-[calc(100vh-120px)] overflow-y-auto"
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
                                        "p-8 md:p-10 transition-all duration-500 h-full",
                                        windowState === 'maximized' ? "overflow-y-auto" : ""
                                    )}
                                >
                                    {children}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </LiquidGlass>
        </div>
    );

    if (windowState === 'maximized') {
        return createPortal(
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                {windowContent}
            </div>,
            document.body
        );
    }

    return windowContent;
}
