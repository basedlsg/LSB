import React from 'react';
import { motion } from 'framer-motion';
import { Folder, FileCode, FileJson, FileText, ChevronRight } from 'lucide-react';

interface TreeItem {
    name: string;
    type: 'folder' | 'file';
    children?: TreeItem[];
    desc?: string;
}

const FileIcon = ({ name }: { name: string }) => {
    if (name.endsWith('.py')) return <FileCode className="w-4 h-4 text-blue-400" />;
    if (name.endsWith('.json')) return <FileJson className="w-4 h-4 text-yellow-400" />;
    if (name.endsWith('.md')) return <FileText className="w-4 h-4 text-gray-400" />;
    return <FileText className="w-4 h-4 text-white/50" />;
};

const TreeNode = ({ item, depth = 0 }: { item: TreeItem, depth?: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: depth * 0.1 }}
            className="flex flex-col"
        >
            <div
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors group cursor-default"
                style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
            >
                {item.type === 'folder' ? (
                    <Folder className="w-4 h-4 text-amber-500/80" />
                ) : (
                    <FileIcon name={item.name} />
                )}

                <span className="text-sm font-mono text-white/80 group-hover:text-white transition-colors">
                    {item.name}
                </span>

                {item.desc && (
                    <span className="ml-auto text-[10px] text-white/30 italic opacity-0 group-hover:opacity-100 transition-opacity">
            // {item.desc}
                    </span>
                )}
            </div>

            {item.children && (
                <div className="flex flex-col border-l border-white/5 ml-[calc(0.5rem+7px)]">
                    {item.children.map((child, idx) => (
                        <TreeNode key={idx} item={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export function CodebaseTree({ data }: { data: TreeItem }) {
    return (
        <div className="p-6 rounded-xl bg-[#0d0d0d] border border-white/10 font-mono text-sm overflow-hidden">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5 opacity-50">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <span className="text-xs ml-2">project_root</span>
            </div>
            <TreeNode item={data} />
        </div>
    );
}
