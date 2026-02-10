import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';

const MobileRestriction = () => {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#09090b] text-white flex flex-col items-center justify-center p-8 text-center font-sans overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-sm mx-auto">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-blue-500 opacity-20 blur-xl rounded-full" />
                    <div className="relative w-24 h-24 bg-white/[0.03] rounded-3xl border border-white/10 flex items-center justify-center backdrop-blur-sm shadow-2xl">
                        <Monitor className="w-10 h-10 text-white" strokeWidth={1.5} />
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#09090b] rounded-xl border border-white/10 flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-red-400" strokeWidth={1.5} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-[120%] h-[2px] bg-red-400 rotate-45" />
                            </div>
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-bold mb-4 tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                    Desktop Only
                </h1>

                <p className="text-zinc-400 text-sm leading-relaxed mb-8 font-medium">
                    To ensure the best learning experience and properly access all features, this platform requires a laptop or desktop computer.
                </p>

                <div className="group w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl p-4 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            System Requirement
                        </span>
                    </div>
                    <div className="text-xs text-zinc-400 text-left font-mono space-y-1.5">
                        <div className="flex justify-between">
                            <span>Display Width</span>
                            <span className="text-white">≥ 768px</span>
                        </div>
                        <div className="w-full h-px bg-white/5" />
                        <div className="flex justify-between">
                            <span>Device Type</span>
                            <span className="text-white">Laptop / PC</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
                    E-Nexus Platform
                </div>
            </div>
        </div>
    );
};

export default MobileRestriction;
