import React from 'react';
import { Maximize, Printer, Grid, Box, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PanelToolbar = ({ viewMode, setViewMode, onExport, backTo }) => {
    const navigate = useNavigate();

    return (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40">
            {/* Floating Dock Container */}
            <div className="flex items-center gap-4 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl shadow-black/50">

                {/* Back Button */}
                {backTo && (
                    <>
                        <button
                            onClick={() => navigate(backTo)}
                            className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 font-bold text-xs transition-all active:scale-95 border-r border-slate-700 pr-4 mr-1"
                            title="Exit Tool"
                        >
                            <ArrowLeft size={16} /> EXIT
                        </button>
                    </>
                )}

                {/* View Modes */}
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/50">
                    <button
                        onClick={() => setViewMode('2D')}
                        className={`
                            px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2
                            ${viewMode === '2D'
                                ? 'bg-slate-700 text-cyan-400 shadow-sm border border-slate-600'
                                : 'text-slate-500 hover:text-slate-300'
                            }
                        `}
                    >
                        <Maximize size={14} /> SCHEMATIC
                    </button>
                    <button
                        onClick={() => setViewMode('3D')}
                        className={`
                            px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2
                            ${viewMode === '3D'
                                ? 'bg-slate-700 text-cyan-400 shadow-sm border border-slate-600'
                                : 'text-slate-500 hover:text-slate-300'
                            }
                        `}
                        disabled // Future
                    >
                        <Box size={14} /> 3D LAYOUT
                    </button>
                </div>

                <div className="w-px h-6 bg-slate-700 mx-1"></div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800/50 font-bold text-xs transition-all active:scale-95"
                        title="Toggle Grid"
                    >
                        <Grid size={16} />
                    </button>
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs transition-all shadow-lg hover:shadow-cyan-500/30 active:scale-95 border border-cyan-500"
                    >
                        <Printer size={16} /> EXPORT
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PanelToolbar;
