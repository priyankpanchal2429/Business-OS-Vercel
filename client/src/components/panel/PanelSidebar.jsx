import React from 'react';
import { Box, Zap, Octagon, Layers } from 'lucide-react';

const PanelSidebar = ({
    onAddMotor,
    onAddAccessory,
    hasEStop,
    onToggleEStop,
    stats
}) => {
    return (
        <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col z-20 h-full shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-900">
                <div className="flex items-center gap-2.5 text-slate-100 font-bold text-lg tracking-tight">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Box size={18} />
                    </div>
                    PanelMaster
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mt-2 tracking-widest pl-1">Professional CAD</div>
            </div>

            {/* Library Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar-dark">

                {/* 1. Motor Circuit */}
                <div
                    onClick={onAddMotor}
                    className="group p-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-blue-500/50 hover:bg-slate-800 cursor-pointer transition-all active:scale-[0.98] select-none"
                    style={{ backdropFilter: 'blur(10px)' }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-slate-700 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-700">
                            <Zap size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-200 text-sm">Motor Circuit</div>
                            <div className="text-[10px] text-slate-500 font-medium font-mono">DOL / 3-PHASE</div>
                        </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {['Fuse', 'MCB', 'Contactor'].map(tag => (
                            <span key={tag} className="text-[9px] bg-slate-700/50 px-2 py-1 rounded text-slate-400 font-mono border border-slate-700">{tag}</span>
                        ))}
                    </div>
                </div>

                {/* 2. Emergency Stop */}
                <div
                    onClick={onToggleEStop}
                    className={`
                        group p-3 border rounded-xl transition-all select-none
                        ${hasEStop
                            ? 'bg-green-900/10 border-green-900/30 cursor-default opacity-80'
                            : 'bg-slate-800/50 border-slate-700 hover:border-red-500/50 hover:bg-slate-800 cursor-pointer active:scale-[0.98]'
                        }
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 border border-transparent ${hasEStop ? 'bg-green-900/20 text-green-500 border-green-900/30' : 'bg-slate-700 text-red-400 border-slate-600 group-hover:bg-red-600 group-hover:text-white'}`}>
                            <Octagon size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-200 text-sm">Emergency Stop</div>
                            <div className="text-[10px] text-slate-500 font-medium">{hasEStop ? 'INSTALLED' : 'Safety Circuit'}</div>
                        </div>
                    </div>
                </div>

                {/* 3. Accessories */}
                <div className="mt-8 mb-3 pl-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Accessories</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => onAddAccessory('TERMINAL_BLOCK')} className="p-3 border border-slate-700 bg-slate-800/50 rounded-xl cursor-pointer hover:border-slate-500 hover:bg-slate-700 text-center transition-all active:scale-95 group">
                        <div className="text-[10px] font-bold text-slate-400 group-hover:text-slate-100 transition-colors">Terminal Block</div>
                    </div>
                    <div onClick={() => onAddAccessory('EARTH_BAR')} className="p-3 border border-slate-700 bg-slate-800/50 rounded-xl cursor-pointer hover:border-green-500/50 hover:bg-slate-700 text-center transition-all active:scale-95 group">
                        <div className="text-[10px] font-bold text-green-400/80 group-hover:text-green-400 transition-colors">Earth Bar</div>
                    </div>
                    <div onClick={() => onAddAccessory('NEUTRAL_BAR')} className="p-3 border border-slate-700 bg-slate-800/50 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-slate-700 text-center transition-all active:scale-95 group">
                        <div className="text-[10px] font-bold text-blue-400/80 group-hover:text-blue-400 transition-colors">Neutral Bar</div>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-auto pt-6 border-t border-slate-800">
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                            <Layers size={12} /> Project Stats
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium text-slate-400">
                                <span>Circuits</span>
                                <span className="font-bold text-slate-200 font-mono">{stats.circuits}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-slate-400">
                                <span>Total Load</span>
                                <span className="font-bold text-slate-200 font-mono">{stats.load} HP</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PanelSidebar;
