import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Network, Box, Server, ArrowDown, Activity, Cpu, Database } from 'lucide-react';

const NanoNode = ({ icon: Icon, label, subtext, delay, type = "default" }: { icon: any, label: string, subtext: string, delay: number, type?: "default" | "process" | "storage" }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="relative group"
    >
        {/* Connection Lines (Pseudo) */}
        <div className="absolute -top-8 left-1/2 w-px h-8 bg-gradient-to-b from-transparent to-white/20" />

        <div className={`
      relative z-10 flex flex-col items-center text-center p-5 rounded-lg 
      border backdrop-blur-md transition-all duration-500
      ${type === 'process' ? 'bg-blue-500/5 border-blue-400/20 hover:border-blue-400/40' :
                type === 'storage' ? 'bg-amber-500/5 border-amber-400/20 hover:border-amber-400/40' :
                    'bg-white/5 border-white/10 hover:border-white/20'}
    `}>
            {/* Glowing Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20 rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 rounded-br-sm" />

            <div className={`
        p-3 rounded-md mb-3 transition-colors duration-300
        ${type === 'process' ? 'bg-blue-500/10 text-blue-400' :
                    type === 'storage' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-white/10 text-white'}
      `}>
                <Icon className="w-5 h-5" strokeWidth={1.5} />
            </div>

            <h3 className="text-[10px] font-mono font-bold tracking-widest uppercase mb-1.5">{label}</h3>
            <p className="text-[10px] text-white/50 font-mono max-w-[120px] leading-tight">{subtext}</p>
        </div>

        {/* Animated Pulse */}
        <motion.div
            className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl
        ${type === 'process' ? 'bg-blue-500/10' : type === 'storage' ? 'bg-amber-500/10' : 'bg-white/5'}
      `}
        />
    </motion.div>
);

const Connection = ({ delay }: { delay: number }) => (
    <motion.div
        initial={{ opacity: 0, height: 0 }}
        whileInView={{ opacity: 1, height: 40 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="w-px bg-gradient-to-b from-white/20 to-white/5 mx-auto my-2 relative overflow-hidden"
    >
        <motion.div
            animate={{ y: [0, 40] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: delay + 0.5 }}
            className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent to-white/50"
        />
    </motion.div>
);

export function SpatialLabArchitecture() {
    return (
        <div className="flex flex-col items-center justify-center py-12 w-full max-w-3xl mx-auto">

            {/* Level 1: Input */}
            <NanoNode
                icon={Brain}
                label="LLM Reasoning"
                subtext="GPT-4 / Gemini processing spatial context"
                delay={0.1}
                type="process"
            />

            <Connection delay={0.3} />

            {/* Level 2: Processing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Horizontal Connector */}
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileInView={{ scaleX: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="hidden md:block absolute top-[-20px] left-1/4 right-1/4 h-px bg-white/10 border-t border-white/10"
                />

                <NanoNode
                    icon={Activity}
                    label="Action Space"
                    subtext="Discrete movement primitives"
                    delay={0.5}
                />
                <NanoNode
                    icon={Network}
                    label="Coordination"
                    subtext="Multi-agent conflict resolution"
                    delay={0.6}
                    type="process"
                />
                <NanoNode
                    icon={Database}
                    label="State Memory"
                    subtext="Grid occupancy tracking"
                    delay={0.7}
                    type="storage"
                />
            </div>

            <Connection delay={0.8} />

            {/* Level 3: Output */}
            <NanoNode
                icon={Box}
                label="Simulation"
                subtext="Physics & Environment Update"
                delay={0.9}
            />

        </div>
    );
}
