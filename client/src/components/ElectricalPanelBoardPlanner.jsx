import React, { useState, useEffect, useRef } from 'react';
import {
    Power, Zap, Activity, Settings, AlertCircle, CheckCircle2,
    Printer, AlertTriangle, Box, Layers, Maximize2,
    Cpu, Spline, Ruler, Octagon, Grid, Trash2, X, Maximize
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Constants & Data Models ---

const MOTOR_OPTIONS = [
    { label: '0.5 HP', value: 0.5 },
    { label: '1.0 HP', value: 1.0 },
    { label: '2.0 HP', value: 2.0 },
    { label: '3.0 HP', value: 3.0 },
    { label: '5.0 HP', value: 5.0 },
    { label: '7.5 HP', value: 7.5 },
    { label: '10.0 HP', value: 10.0 },
    { label: '15.0 HP', value: 15.0 },
    { label: '20.0 HP', value: 20.0 },
    { label: '25.0 HP', value: 25.0 },
    { label: '30.0 HP', value: 30.0 },
];

const VOLTAGES = [
    { label: '230V (Single Phase)', value: 230, phase: 1, color: 'bg-green-100 border-green-300 text-green-700' },
    { label: '415V (Three Phase)', value: 415, phase: 3, color: 'bg-orange-100 border-orange-300 text-orange-700' },
];

// Cable Sizing Chart 
const CABLE_SIZING = [
    { maxHp: 1, sqmm: 1.5 },
    { maxHp: 3, sqmm: 2.5 },
    { maxHp: 5, sqmm: 4.0 },
    { maxHp: 10, sqmm: 6.0 },
    { maxHp: 15, sqmm: 10.0 },
    { maxHp: 20, sqmm: 16.0 },
    { maxHp: 30, sqmm: 25.0 },
];

// --- Logic Helpers ---

const getFullLoadCurrent = (hp, voltage, phase) => {
    const watts = hp * 746;
    if (phase === 3) {
        return parseFloat((watts / (1.732 * voltage * 0.8 * 0.85)).toFixed(1));
    } else {
        return parseFloat((watts / (voltage * 0.8 * 0.8)).toFixed(1));
    }
};

const getComponents = (hp, phase, amps) => {
    let starter = '';
    let starterCode = '';

    if (phase === 1) {
        starter = 'Single Phase Starter';
        starterCode = '1PH';
    } else {
        if (hp < 7.5) {
            starter = 'DOL Starter';
            starterCode = 'DOL';
        } else {
            starter = 'Star-Delta Starter';
            starterCode = 'S/D';
        }
    }

    const fuseRating = Math.ceil(amps * 1.5);
    const mcbRating = Math.ceil(amps * 1.25);
    const cableMatch = CABLE_SIZING.find(c => hp <= c.maxHp) || { sqmm: 'Calc' };

    return {
        starter,
        starterCode,
        fuse: `${fuseRating}A`,
        mcb: `${mcbRating}A`,
        cable: cableMatch.sqmm
    };
};

const ElectricalPanelBoardPlanner = () => {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);

    // Planner State
    const [motors, setMotors] = useState([]);
    const [projectName, setProjectName] = useState('Main Distribution Panel');
    const [hasEStop, setHasEStop] = useState(false); // Does panel have an E-Stop?
    const [isEmergencyStop, setIsEmergencyStop] = useState(false); // Is it currently pressed?
    const [viewMode, setViewMode] = useState('2D'); // '2D' | '3D' -> Replaced to '2D' | 'PANEL' in UI

    // Form State
    const [formState, setFormState] = useState({
        hp: 5.0,
        rpm: 1440,
        voltageObj: VOLTAGES[1], // Default 3-phase
        quantity: 1
    });

    // --- Actions ---

    const handleAddMotor = () => {
        const { hp, rpm, voltageObj, quantity } = formState; // Use current default form state for quick add

        // For the new UI, we might want to just add a standard motor or random one, 
        // OR we just use the default formState which is set to 5HP.
        // The new UI doesn't have the full form visible in sidebar, so we'll use defaults or randomize slightly?
        // For now, let's keep using formState (defaults).

        const newMotors = [];
        // Default to adding 1 at a time from sidebar click
        const qtyToAdd = 1;

        for (let i = 0; i < qtyToAdd; i++) {
            const amps = getFullLoadCurrent(hp, voltageObj.value, voltageObj.phase);
            const components = getComponents(hp, voltageObj.phase, amps);

            newMotors.push({
                id: Date.now() + Math.random(),
                hp,
                rpm,
                voltage: voltageObj.value,
                phase: voltageObj.phase,
                amps,
                ...components,
                status: 'OFF'
            });
        }

        setMotors(prev => [...prev, ...newMotors]);
    };

    const removeMotor = (id) => {
        setMotors(motors.filter(m => m.id !== id));
    };

    const toggleMotorStatus = (id) => {
        if (isEmergencyStop) return;
        setMotors(motors.map(m => {
            if (m.id === id) {
                return { ...m, status: m.status === 'ON' ? 'OFF' : 'ON' };
            }
            return m;
        }));
    };

    const handleEmergencyStop = () => {
        if (!hasEStop) return; // Cannot E-Stop if component not added
        const newState = !isEmergencyStop;
        setIsEmergencyStop(newState);
        if (newState) {
            setMotors(prev => prev.map(m => ({ ...m, status: 'OFF' })));
        }
    };

    const totalLoadHp = motors.reduce((acc, m) => acc + m.hp, 0);
    const totalCurrentAmps = motors.reduce((acc, m) => acc + m.amps, 0).toFixed(1);

    const handleExport = async () => {
        if (!panelRef.current) return;
        try {
            const currentMode = viewMode;
            setViewMode('2D'); // Force 2D for clean print
            await new Promise(r => setTimeout(r, 500));

            const canvas = await html2canvas(panelRef.current, { scale: 2, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a3');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.setFontSize(18);
            pdf.text(projectName, 10, 10);
            pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
            pdf.save('Panel_Layout.pdf');

            setViewMode(currentMode);
        } catch (err) {
            console.error("Export failed", err);
        }
    };

    if (!isOpen) {
        return (
            <div
                onClick={() => setIsOpen(true)}
                style={{
                    background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0',
                    overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease', cursor: 'pointer', height: '100%',
                    display: 'flex', flexDirection: 'column'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; e.currentTarget.style.borderColor = '#2563EB'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
                <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F172A' }}>
                        <Layers size={28} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>PanelMaster</h3>
                        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.9rem' }}>Industrial Schematics</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8 animate-in fade-in duration-200">
            <div className="w-full h-full bg-white rounded-2xl shadow-2xl flex overflow-hidden ring-1 ring-slate-900/10 font-sans selection:bg-blue-100">

                {/* --- LEFT SIDEBAR: COMPONENT LIBRARY --- */}
                <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col z-20">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200 bg-white">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-lg tracking-tight">
                            <Box size={20} className="text-blue-600" />
                            PanelMaster
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Component Library</div>
                    </div>

                    {/* Library Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">

                        {/* 1. Motor Circuit */}
                        <div
                            onClick={handleAddMotor}
                            className="group p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all active:scale-95 select-none"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Zap size={18} />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-700 text-sm">Motor Circuit</div>
                                    <div className="text-[10px] text-slate-500">3-Phase DOL Starter</div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Fuse</span>
                                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">MCB</span>
                                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Contactor</span>
                            </div>
                        </div>

                        {/* 2. Emergency Stop */}
                        <div
                            onClick={() => !hasEStop && setHasEStop(true)}
                            className={`
                                group p-3 bg-white border rounded-lg shadow-sm transition-all select-none
                                ${hasEStop
                                    ? 'border-green-200 bg-green-50 cursor-default opacity-60'
                                    : 'border-slate-200 hover:shadow-md hover:border-red-300 cursor-pointer active:scale-95'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-md transition-colors ${hasEStop ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'}`}>
                                    <Octagon size={18} />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-700 text-sm">Emergency Stop</div>
                                    <div className="text-[10px] text-slate-500">{hasEStop ? 'Added to Panel' : 'Safety Kill Switch'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="h-px bg-slate-200 my-4"></div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Project Stats</div>
                        <div className="text-xs text-slate-600 space-y-1 font-mono">
                            <div className="flex justify-between"><span>Circuits:</span> <span>{motors.length}</span></div>
                            <div className="flex justify-between"><span>Load:</span> <span>{totalLoadHp} HP</span></div>
                        </div>

                    </div>
                </div>

                {/* --- MAIN CONTENT: TOOLBAR + CANVAS --- */}
                <div className="flex-1 flex flex-col relative bg-slate-100">

                    {/* Top Toolbar */}
                    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 shadow-sm">

                        {/* View Toggles */}
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setViewMode('2D')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === '2D' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <div className="flex items-center gap-2"><Maximize size={14} /> SCHEMATIC</div>
                            </button>
                            <button
                                onClick={() => setViewMode('PANEL')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'PANEL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <div className="flex items-center gap-2"><Grid size={14} /> LAYOUT</div>
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button onClick={() => setMotors([])} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Clear All">
                                <Trash2 size={18} />
                            </button>
                            <div className="w-px h-8 bg-slate-200 mx-2"></div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* --- CANVAS --- */}
                    <div className="flex-1 overflow-auto relative p-8">

                        {/* A. SCHEMATIC View (Radica Style) */}
                        {viewMode === '2D' && (
                            <div className="min-w-[800px] min-h-[600px] bg-white relative shadow-sm border border-slate-300">
                                {/* CAD Grid Background */}
                                <div
                                    className="absolute inset-0 z-0 pointer-events-none opacity-20"
                                    style={{
                                        backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                                        backgroundSize: '20px 20px'
                                    }}
                                ></div>
                                {/* Engineering Border */}
                                <div className="absolute inset-2 border-2 border-red-900 pointer-events-none z-50"></div>

                                <div className="relative z-10 p-12">
                                    {/* Main Busbars L1-L3 */}
                                    {motors.length > 0 && (
                                        <div className="w-full h-20 mb-8 relative">
                                            <svg className="w-full h-full overflow-visible">
                                                <g strokeWidth="2" strokeLinecap="square">
                                                    <line x1="0" y1="20" x2="100%" y2="20" stroke="#ef4444" />
                                                    <line x1="0" y1="35" x2="100%" y2="35" stroke="#eab308" />
                                                    <line x1="0" y1="50" x2="100%" y2="50" stroke="#3b82f6" />
                                                    {isEmergencyStop && ( // Grey out overlay
                                                        <>
                                                            <line x1="0" y1="20" x2="100%" y2="20" stroke="#cbd5e1" strokeWidth="3" />
                                                            <line x1="0" y1="35" x2="100%" y2="35" stroke="#cbd5e1" strokeWidth="3" />
                                                            <line x1="0" y1="50" x2="100%" y2="50" stroke="#cbd5e1" strokeWidth="3" />
                                                        </>
                                                    )}
                                                </g>

                                                {/* Labels */}
                                                <text x="10" y="15" fontSize="10" fill="#ef4444" fontFamily="monospace">L1</text>
                                                <text x="10" y="30" fontSize="10" fill="#eab308" fontFamily="monospace">L2</text>
                                                <text x="10" y="45" fontSize="10" fill="#3b82f6" fontFamily="monospace">L3</text>
                                            </svg>
                                        </div>
                                    )}

                                    {motors.length === 0 && (
                                        <div className="text-center opacity-40 mt-12 w-full border-2 border-dashed border-slate-300 rounded-xl p-12">
                                            <Spline size={64} className="mx-auto mb-4 text-slate-400" />
                                            <div className="text-xl font-black text-slate-700 uppercase tracking-tight">Schematic Empty</div>
                                        </div>
                                    )}

                                    {/* Motors Loop */}
                                    <div className="flex gap-20">
                                        {motors.map((motor, idx) => (
                                            <div key={motor.id} className={`flex flex-col items-center relative group w-24 ${isEmergencyStop ? 'grayscale opacity-50' : ''}`}>
                                                {/* Taps */}
                                                <svg className="absolute -top-24 left-0 w-full h-24 overflow-visible pointer-events-none">
                                                    <g strokeWidth="2" stroke={isEmergencyStop ? "#cbd5e1" : "currentColor"}>
                                                        <line x1="33%" y1="-76" x2="33%" y2="100%" className={!isEmergencyStop ? "text-red-500" : ""} />
                                                        <circle cx="33%" cy="-76" r="2" fill="black" />
                                                        <line x1="50%" y1="-61" x2="50%" y2="100%" className={!isEmergencyStop ? "text-yellow-500" : ""} />
                                                        <circle cx="50%" cy="-61" r="2" fill="black" />
                                                        <line x1="66%" y1="-46" x2="66%" y2="100%" className={!isEmergencyStop ? "text-blue-600" : ""} />
                                                        <circle cx="66%" cy="-46" r="2" fill="black" />
                                                    </g>
                                                </svg>

                                                {/* Components */}
                                                <SymbolFuse label={`F${idx + 1}`} rating={motor.fuse} isTripped={isEmergencyStop} />
                                                <WiringLines phase={motor.phase} length={20} isTripped={isEmergencyStop} isFlowing={motor.status === 'ON'} />
                                                <SymbolBreaker label={`Q${idx + 1}`} rating={motor.mcb} isTripped={isEmergencyStop} />
                                                <WiringLines phase={motor.phase} length={20} isTripped={isEmergencyStop} isFlowing={motor.status === 'ON'} />
                                                <SymbolContactor label={`KM${idx + 1}`} status={motor.status} isTripped={isEmergencyStop} onToggle={() => toggleMotorStatus(motor.id)} />
                                                <WiringLines phase={motor.phase} length={40} isTripped={isEmergencyStop} isFlowing={motor.status === 'ON'} label={`${motor.cable}mm²`} />

                                                {/* Motor */}
                                                <div className="w-16 h-16 rounded-full border-2 border-black bg-white flex flex-col items-center justify-center relative mt-2 z-10 w-full">
                                                    <div className="font-bold text-xs">M{idx + 1}</div>
                                                    <div className="text-[8px] text-slate-500">{motor.hp}HP</div>
                                                    {motor.status === 'ON' && !isEmergencyStop && (
                                                        <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-20"></div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* B. PANEL LAYOUT View */}
                        {viewMode === 'PANEL' && (
                            <div className="w-[800px] h-[600px] bg-[#eceff1] border-2 border-slate-400 relative shadow-2xl flex flex-col items-center p-8 mx-auto">
                                {/* Backplate */}
                                <div className="absolute inset-4 bg-orange-50 border border-orange-200 opacity-60 pointer-events-none"></div>

                                {/* --- OPTIONAL E-STOP COMPONENT --- */}
                                {hasEStop && (
                                    <div className="absolute top-8 right-8 z-50">
                                        <div className="bg-yellow-400 border-2 border-black p-2 rounded-lg shadow-xl flex flex-col items-center gap-1 w-24">
                                            <div className="text-[8px] font-black uppercase tracking-wider">Emergency</div>
                                            <button
                                                onClick={handleEmergencyStop}
                                                className={`
                                                        w-16 h-16 rounded-full border-4 border-red-800 shadow-[0_4px_0_#991b1b] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center
                                                        ${isEmergencyStop ? 'bg-red-700' : 'bg-red-600'}
                                                    `}
                                            >
                                                <div className="w-12 h-12 border-2 border-red-400/30 rounded-full flex items-center justify-center">
                                                    <div className="text-[8px] font-bold text-white/80 text-center leading-tight">PUSH<br />STOP</div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Wire Duct Top */}
                                <div className="w-[700px] h-12 bg-slate-300 border border-slate-400 mt-12 flex items-center justify-center opacity-90 relative">
                                    <span className="text-[8px] text-slate-500 font-mono bg-slate-200 px-1">DUCT</span>
                                </div>

                                {/* DIN Rail */}
                                <div className="w-[700px] h-10 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 border-y border-slate-500 shadow-sm mt-8 flex items-center px-8 gap-8">
                                    {motors.map((motor, idx) => (
                                        <div key={motor.id} className="flex gap-4 relative -mt-6">
                                            <FootprintMCB label={`Q${idx + 1}`} isTripped={isEmergencyStop} />
                                            <FootprintContactor label={`KM${idx + 1}`} status={motor.status} isTripped={isEmergencyStop} />
                                        </div>
                                    ))}
                                </div>

                                {/* Wire Duct Middle */}
                                <div className="w-[700px] h-12 bg-slate-300 border border-slate-400 mt-16 flex items-center justify-center opacity-90"></div>

                                {/* Terminal Rail */}
                                <div className="w-[700px] h-10 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 border-y border-slate-500 shadow-sm mt-8 flex items-center px-12 gap-12">
                                    {motors.map((_, idx) => (
                                        <div key={idx} className="flex gap-0.5">
                                            <div className="w-2 h-10 bg-slate-500 border-r border-slate-600 -mt-2"></div>
                                            <div className="w-2 h-10 bg-slate-500 border-r border-slate-600 -mt-2"></div>
                                            <div className="w-2 h-10 bg-slate-500 border-r border-slate-600 -mt-2"></div>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        )}

                        {/* Virtual Wiring for Layout View - Simplified for now to avoid crash */}
                        {viewMode === 'PANEL' && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-50 overflow-visible"></svg>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};

// --- Helper Components ---

const SymbolFuse = ({ label, rating, isTripped }) => (
    <div className="flex flex-col items-center group/sym">
        <div className="text-[10px] font-mono text-slate-500 mb-0.5">{label}</div>
        <div className="w-12 h-20 border border-slate-300 bg-white relative flex items-center justify-center shadow-sm">
            <div className={`absolute w-[1px] h-full ${isTripped ? 'bg-slate-300' : 'bg-black'}`}></div>
            <div className="w-6 h-10 border-2 border-black bg-white z-10 flex items-center justify-center">
                <span className="text-[8px] font-bold">{rating}</span>
            </div>
        </div>
    </div>
);

const SymbolBreaker = ({ label, rating, isTripped }) => (
    <div className="flex flex-col items-center group/sym">
        <div className="text-[10px] font-mono text-slate-500 mb-0.5">{label}</div>
        <div className="w-16 h-20 border border-slate-300 bg-white relative flex flex-col items-center justify-center shadow-sm p-1">
            <div className="w-full flex justify-around h-full items-center">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-full w-[1px] bg-black relative flex items-center justify-center">
                        <div className="w-2 h-2 border border-black -rotate-45 bg-white z-10"></div>
                        <div className="absolute top-1 -right-2 text-[6px]">x</div>
                    </div>
                ))}
            </div>
            <div className="absolute bottom-1 bg-white px-1 text-[9px] font-bold border border-slate-200 rounded">{rating}</div>
        </div>
    </div>
);

const SymbolContactor = ({ label, code, status, isTripped, onToggle }) => (
    <div className="flex flex-col items-center group/sym">
        <div className="text-[10px] font-mono text-slate-500 mb-0.5">{label}</div>
        <div className={`w-20 h-24 border ${status === 'ON' && !isTripped ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'border-slate-300'} bg-white relative flex flex-col items-center justify-between shadow-sm p-2 transition-all`}>
            <div className="flex w-full justify-between px-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full border border-black"></div>
                        <div className={`w-[1px] h-8 ${status === 'ON' && !isTripped ? 'bg-green-600 w-[2px]' : 'bg-black'} transition-all`}></div>
                        <div className="w-1.5 h-1.5 rounded-full border border-black"></div>
                    </div>
                ))}
            </div>
            <div className="w-full mt-2">
                <div className="text-[9px] font-bold text-center mb-1">{code}</div>
                <button
                    onClick={onToggle}
                    disabled={isTripped}
                    className={`
                        w-full py-1 text-[9px] font-bold uppercase tracking-wider rounded border
                        ${status === 'ON'
                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    {status === 'ON' ? 'Stop' : 'Start'}
                </button>
            </div>
        </div>
    </div>
);

const WiringLines = ({ phase, length, isTripped, label, isFlowing }) => {
    const colors = phase === 3 ? ['bg-red-500', 'bg-yellow-500', 'bg-blue-600'] : ['bg-red-500', 'bg-black'];
    const greyscale = 'bg-slate-300';
    return (
        <div className={`flex justify-center gap-3 w-full`} style={{ height: length }}>
            {colors.map((c, i) => (
                <div key={i} className={`w-[2px] h-full ${isTripped ? greyscale : c} transition-colors duration-500 relative overflow-hidden`}>
                    {isFlowing && !isTripped && (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-white/50 to-transparent animate-flow"></div>
                    )}
                    {label && i === (phase === 3 ? 1 : 0) && (
                        <div className="absolute top-1/2 left-2 bg-white text-[8px] border border-slate-200 px-1 rounded z-20 whitespace-nowrap">
                            {label}
                        </div>
                    )}
                </div>
            ))}
            <style jsx>{`
                @keyframes flow {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                .animate-flow {
                    animation: flow 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

const FootprintMCB = ({ label, isTripped }) => (
    <div className="w-8 h-20 relative select-none">
        <svg viewBox="0 0 35 140" className="w-full h-full drop-shadow-sm">
            <rect x="0" y="0" width="35" height="140" rx="2" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
            <rect x="2" y="10" width="31" height="120" rx="1" fill="#fff" />
            <circle cx="17.5" cy="8" r="3" fill="none" stroke="#64748b" strokeWidth="1" />
            <circle cx="17.5" cy="132" r="3" fill="none" stroke="#64748b" strokeWidth="1" />
            <rect x="4" y="20" width="27" height="15" fill="#e2e8f0" rx="1" />
            <text x="17.5" y="30" fontSize="8" fontFamily="monospace" textAnchor="middle" fill="#475569">{label}</text>
            <rect x="6" y="55" width="23" height="30" rx="2" fill="#cbd5e1" />
            <rect x="8" y="57" width="19" height="26" fill="#0f172a" />
            <rect x="8" y={isTripped ? "68" : "57"} width="19" height="15" rx="1" fill={isTripped ? "#ef4444" : "#22c55e"} className="transition-all duration-300" />
            <rect x="12" y="100" width="11" height="11" rx="1" stroke="#cbd5e1" fill="none" />
            <text x="17.5" y="108" fontSize="6" textAnchor="middle" fill="#94a3b8">I-ON</text>
        </svg>
    </div>
);

const FootprintContactor = ({ label, status, isTripped }) => (
    <div className="w-12 h-20 relative select-none">
        <svg viewBox="0 0 55 140" className="w-full h-full drop-shadow-sm">
            <rect x="0" y="0" width="55" height="140" rx="2" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
            <rect x="2" y="25" width="51" height="90" rx="1" fill="#fff" />
            <circle cx="10" cy="10" r="3.5" fill="none" stroke="#64748b" strokeWidth="1" />
            <circle cx="27.5" cy="10" r="3.5" fill="none" stroke="#64748b" strokeWidth="1" />
            <circle cx="45" cy="10" r="3.5" fill="none" stroke="#64748b" strokeWidth="1" />
            <circle cx="10" cy="130" r="3.5" fill="none" stroke="#64748b" strokeWidth="1" />
            <circle cx="27.5" cy="130" r="3.5" fill="none" stroke="#64748b" strokeWidth="1" />
            <circle cx="45" cy="130" r="3.5" fill="none" stroke="#64748b" strokeWidth="1" />
            <rect x="42" y="40" width="8" height="8" rx="1" stroke="#64748b" fill="#ecfccb" />
            <text x="46" y="46" fontSize="4" textAnchor="middle">A1</text>
            <rect x="42" y="92" width="8" height="8" rx="1" stroke="#64748b" fill="#ecfccb" />
            <text x="46" y="98" fontSize="4" textAnchor="middle">A2</text>
            <rect x="15" y="55" width="25" height="30" rx="2" fill="#334155" />
            <rect x="17" y={status === 'ON' && !isTripped ? "60" : "55"} width="21" height="20" rx="1" fill={status === 'ON' && !isTripped ? "#22c55e" : "#94a3b8"} className="transition-all duration-200" />
            <rect x="15" y="100" width="25" height="12" fill="#e2e8f0" rx="1" />
            <text x="27.5" y="108" fontSize="7" fontFamily="monospace" textAnchor="middle" fill="#475569">{label}</text>
        </svg>
    </div>
);

const PhysicalWiringPath = ({ startX, startY, controlX, endX, endY, isFlowing, isTripped }) => {
    return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 overflow-visible">
            <path d={`M ${startX} ${startY} Q ${controlX} ${startY + 40} ${endX} ${endY}`} fill="none" stroke={isTripped ? "#cbd5e1" : (isFlowing ? "#3b82f6" : "#64748b")} strokeWidth="2" strokeLinecap="round" className="transition-colors duration-300" />
            {isFlowing && !isTripped && (
                <path d={`M ${startX} ${startY} Q ${controlX} ${startY + 40} ${endX} ${endY}`} fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="4 8" strokeLinecap="round" className="animate-dash opacity-60" />
            )}
            <style jsx>{`
                @keyframes dash { to { stroke-dashoffset: -24; } }
                .animate-dash { animation: dash 0.5s linear infinite; }
            `}</style>
        </svg>
    );
};

export default ElectricalPanelBoardPlanner;
