import React from 'react';
import { X, Zap, Box, Trash2 } from 'lucide-react';

const PanelProperties = ({ selectedItem, updateMotorHP, removeMotor, onClose }) => {
    if (!selectedItem) return null;

    const isMotor = !selectedItem.type || selectedItem.type === 'MOTOR_CIRCUIT';
    const typeLabel = isMotor ? 'Motor Circuit' : selectedItem.type.replace(/_/g, ' ');

    return (
        <div className="w-80 bg-slate-900 border-l border-slate-700 z-20 flex flex-col animate-in slide-in-from-right duration-200 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <span className="font-bold text-slate-200 tracking-wide text-sm uppercase">Properties</span>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="p-6 flex-1 overflow-auto custom-scrollbar-dark">
                <div className="space-y-6">
                    {/* Component Header */}
                    <div className="flex items-start gap-4 pb-6 border-b border-slate-800">
                        <div className={`p-3 rounded-xl border ${isMotor ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-slate-800 border-slate-700 text-cyan-400'}`}>
                            {isMotor ? <Zap size={24} /> : <Box size={24} />}
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Component</div>
                            <div className="text-lg font-bold text-slate-100 leading-tight">
                                {typeLabel}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-1 font-mono">ID: {selectedItem.id}</div>
                        </div>
                    </div>

                    {/* Configuration (Motor Only) */}
                    {isMotor && (
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700 transition-all hover:border-slate-600">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Power Rating (HP)</div>
                            <div className="flex gap-2 flex-wrap">
                                {[0.5, 1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => updateMotorHP(selectedItem.id, val)}
                                        className={`
                                            w-10 h-8 rounded-lg text-xs font-bold border transition-all font-mono
                                            ${selectedItem.hp === val
                                                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 scale-105'
                                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
                                            }
                                        `}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Technical Specs Table */}
                    {isMotor && selectedItem.details && (
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Smart Specs</div>
                            <div className="border border-slate-700 rounded-xl overflow-hidden text-sm shadow-sm bg-slate-800/20">
                                <SpecRow label="Full Load Current" value={`${selectedItem.amps} A`} />
                                <SpecRow label="Cable Size (Cu)" value={`${selectedItem.details.cable.size} sqmm`} bg="bg-slate-800/50" />
                                <SpecRow label="MCB Rating" value={selectedItem.mcb} />
                                <SpecRow label="Contactor (AC3)" value={selectedItem.starter} bg="bg-slate-800/50" />
                                <SpecRow label="Relay Range" value={selectedItem.details.protection.relayRange} />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-6 border-t border-slate-800">
                        <button
                            onClick={() => removeMotor(selectedItem.id)}
                            className="w-full py-3 bg-red-900/10 hover:bg-red-900/20 text-red-400 font-bold rounded-xl border border-red-900/30 hover:border-red-500/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <Trash2 size={18} /> Remove Component
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

const SpecRow = ({ label, value, bg = 'bg-transparent' }) => (
    <div className={`flex justify-between p-3 ${bg} border-b border-slate-700 last:border-0`}>
        <span className="text-slate-500 font-medium text-xs">{label}</span>
        <span className="font-mono font-bold text-slate-300 text-xs">{value}</span>
    </div>
);

export default PanelProperties;
