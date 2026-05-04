import React from 'react';
import { motion } from 'framer-motion';
import { LayoutTemplate, EyeOff, MessageSquare, BarChart3, ArrowRight, ChevronRight, Cpu } from 'lucide-react';

const NanoStep = ({ icon: Icon, label, subtext, index }: { icon: any, label: string, subtext: string, index: number }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.15 }}
        className="flex items-center gap-6 p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all group w-full"
    >
        {/* Step Number */}
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded border border-white/10 bg-black/20 font-mono text-[10px] text-white/40 group-hover:text-white/80 group-hover:border-white/30 transition-colors">
            0{index + 1}
        </div>

        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded bg-white/5 flex items-center justify-center text-white/60 group-hover:text-white group-hover:scale-110 transition-all duration-300">
            <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xs font-bold tracking-widest uppercase text-white/90">{label}</h3>
                <div className="h-px flex-grow bg-white/5" />
            </div>
            <p className="text-[11px] text-white/50 font-mono truncate">{subtext}</p>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40 transition-colors" />
    </motion.div>
);

export function WhatsInTheRoomExperiment() {
    const steps = [
        { icon: LayoutTemplate, label: "Generate", subtext: "Procedural floorplan synthesis via WFC" },
        { icon: EyeOff, label: "Mask", subtext: "Hide target room label & contents" },
        { icon: Cpu, label: "Process", subtext: "VLM analyzes spatial context" },
        { icon: MessageSquare, label: "Query", subtext: "'What is this hidden room?'" },
        { icon: BarChart3, label: "Evaluate", subtext: "Compare prediction vs ground truth" },
    ];

    return (
        <div className="w-full max-w-2xl mx-auto space-y-3">
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    <NanoStep {...step} index={index} />
                    {index < steps.length - 1 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            whileInView={{ opacity: 1, height: 16 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 + 0.1 }}
                            className="w-px h-4 bg-white/10 mx-auto ml-[2.35rem]" // Aligned with number center
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
