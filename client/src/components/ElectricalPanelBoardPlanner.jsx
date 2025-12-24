import React, { useState, useEffect } from 'react';
import { Power, Zap, ShieldAlert, Download, Activity, PlayCircle, ArrowRight, X, RotateCw, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MOTOR_TYPES = [
    { id: '1hp', name: '1 HP Motor', hp: 1, phase: 1, amps: 4.5, icon: Zap },
    { id: '2hp', name: '2 HP Motor', hp: 2, phase: 1, amps: 9, icon: Zap },
    { id: '3hp', name: '3 HP Motor', hp: 3, phase: 3, amps: 4.5, icon: Activity }, // 3 Phase
    { id: '5hp', name: '5 HP Motor', hp: 5, phase: 3, amps: 7.5, icon: Power },
    { id: '7.5hp', name: '7.5 HP Motor', hp: 7.5, phase: 3, amps: 11, icon: Power },
    { id: '10hp', name: '10 HP Motor', hp: 10, phase: 3, amps: 14, icon: Power },
];

const ElectricalPanelBoardPlanner = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMotors, setSelectedMotors] = useState([]);

    // Simulation State
    const [mainsOn, setMainsOn] = useState(false);
    const [activeMotorIds, setActiveMotorIds] = useState([]);

    const addMotor = (motor) => {
        setSelectedMotors([...selectedMotors, { ...motor, uniqueId: Date.now() }]);
    };

    const removeMotor = (uniqueId) => {
        setSelectedMotors(selectedMotors.filter(m => m.uniqueId !== uniqueId));
        setActiveMotorIds(activeMotorIds.filter(id => id !== uniqueId));
    };

    const toggleMotor = (uniqueId) => {
        if (!mainsOn) return; // Cannot start motor if mains is off
        setActiveMotorIds(prev =>
            prev.includes(uniqueId) ? prev.filter(id => id !== uniqueId) : [...prev, uniqueId]
        );
    };

    // Auto-turn off all motors if mains is cut
    useEffect(() => {
        if (!mainsOn) setActiveMotorIds([]);
    }, [mainsOn]);

    const calculateTotals = () => {
        const totalHp = selectedMotors.reduce((acc, m) => acc + m.hp, 0);
        const totalAmps = selectedMotors.reduce((acc, m) => acc + m.amps, 0);

        // Running Load (Real-time)
        const runningAmps = selectedMotors
            .filter(m => activeMotorIds.includes(m.uniqueId))
            .reduce((acc, m) => acc + m.amps, 0);

        const requires3Phase = selectedMotors.some(m => m.phase === 3);

        return { totalHp, totalAmps, runningAmps, requires3Phase };
    };

    const totals = calculateTotals();
    const utilization = totals.totalAmps > 0 ? (totals.runningAmps / totals.totalAmps) * 100 : 0;

    const handleDownload = async () => {
        const element = document.getElementById('panel-diagram');
        if (!element) return;

        try {
            // Temporarily remove animation classes for clean PDF
            element.classList.add('printing');
            const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#F1F5F9' });
            element.classList.remove('printing');

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('Electrical_Panel_Diagram.pdf');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            {/* Launcher Card */}
            <div style={{
                background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0',
                overflow: 'hidden', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.3s ease',
                cursor: 'pointer', ':hover': { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }
            }} onClick={() => setIsOpen(true)}>
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Power size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Electrical Panel Board Planner</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Auto-generated Panel Diagrams</p>
                    </div>
                    <div style={{ marginLeft: 'auto', color: '#64748B' }}><ArrowRight size={20} /></div>
                </div>
            </div>

            {/* Modal */}
            {isOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: 'white', borderRadius: 16, width: '100%', maxWidth: '1200px', maxHeight: '90vh',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 8, background: '#EFF6FF', borderRadius: 8 }}><Power size={20} color="#2563EB" /></div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Electrical Panel Board Planner</h2>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Design & Simulate Power Flow</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={20} color="#64748B" />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2.5fr', gap: '32px' }}>

                                {/* 1. Setup & Tools */}
                                <div>
                                    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: 24 }}>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
                                            AVAILABLE MOTORS
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                                            {MOTOR_TYPES.map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => addMotor(m)}
                                                    style={{
                                                        padding: '10px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px',
                                                        textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                                                        transition: 'all 0.2s', ':hover': { borderColor: '#3B82F6' }
                                                    }}
                                                >
                                                    <div style={{ background: '#EFF6FF', padding: 6, borderRadius: 6, color: '#2563EB' }}>
                                                        <m.icon size={16} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{m.phase} Phase • {m.amps}A</div>
                                                    </div>
                                                    <div style={{ fontSize: '1.2rem', color: '#CBD5E1' }}>+</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Stats Box */}
                                    {selectedMotors.length > 0 && (
                                        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                                                LOAD SUMMARY
                                                {mainsOn && <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={12} /> LIVE</span>}
                                            </div>

                                            <div style={{ marginBottom: 16 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}>
                                                    <span style={{ color: '#64748B' }}>Total Connected:</span>
                                                    <span style={{ fontWeight: 600 }}>{totals.totalAmps} A</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}>
                                                    <span style={{ color: mainsOn ? '#16a34a' : '#64748B' }}>Currently Running:</span>
                                                    <span style={{ fontWeight: 700, color: mainsOn ? '#16a34a' : '#0F172A', fontSize: '1.1rem' }}>{totals.runningAmps.toFixed(1)} A</span>
                                                </div>
                                                {/* Load Bar */}
                                                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${utilization}%`,
                                                        background: utilization > 90 ? '#EF4444' : '#16a34a',
                                                        transition: 'width 0.5s ease'
                                                    }}></div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: totals.requires3Phase ? '#FFF7ED' : '#F0FDF4', borderRadius: 8, border: `1px solid ${totals.requires3Phase ? '#FFEDD5' : '#BBF7D0'}` }}>
                                                <Zap size={18} color={totals.requires3Phase ? '#EA580C' : '#16A34A'} />
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: totals.requires3Phase ? '#9A3412' : '#166534' }}>RECOMMENDED SUPPLY</div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: totals.requires3Phase ? '#EA580C' : '#15803D' }}>
                                                        {totals.requires3Phase ? 'Three Phase (440V)' : 'Single Phase (220V)'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Live Panel Diagram */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>2. Futuristic Energy Grid</h3>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            {selectedMotors.length > 0 && (
                                                <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer' }}>
                                                    <Download size={16} /> Save PDF
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div id="panel-diagram" style={{
                                        background: 'linear-gradient(135deg, #020617 0%, #1e1b4b 50%, #0f172a 100%)', // Deep Cyber Gradient
                                        padding: '40px',
                                        borderRadius: '16px',
                                        minHeight: '600px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#E2E8F0',
                                        overflow: 'hidden'
                                    }}>
                                        {/* Grid overlay for texture */}
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
                                            backgroundSize: '30px 30px', pointerEvents: 'none'
                                        }}></div>

                                        {/* Ambient Glows */}
                                        <div style={{ position: 'absolute', top: '-10%', left: '20%', width: '300px', height: '300px', background: '#3b82f6', filter: 'blur(100px)', opacity: 0.1 }}></div>
                                        <div style={{ position: 'absolute', bottom: '-10%', right: '20%', width: '300px', height: '300px', background: '#8b5cf6', filter: 'blur(100px)', opacity: 0.1 }}></div>

                                        {/* Styles for Pulse Animation */}
                                        <style>
                                            {`
                                                    @keyframes pulse-flow {
                                                        0% { box-shadow: 0 0 10px rgba(6, 182, 212, 0.4); }
                                                        50% { box-shadow: 0 0 25px rgba(6, 182, 212, 0.8); }
                                                        100% { box-shadow: 0 0 10px rgba(6, 182, 212, 0.4); }
                                                    }
                                                    @keyframes pulse-red {
                                                        0% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
                                                        50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.8); }
                                                        100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
                                                    }
                                                `}
                                        </style>

                                        {/* Top Busbar (Neon Rail) */}
                                        <div style={{
                                            zIndex: 10,
                                            marginBottom: '60px',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                                        }}>
                                            {/* Main Power Node */}
                                            <div
                                                onClick={() => setMainsOn(!mainsOn)}
                                                style={{
                                                    padding: '12px 24px',
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    backdropFilter: 'blur(10px)',
                                                    border: `1px solid ${mainsOn ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
                                                    borderRadius: '16px',
                                                    cursor: 'pointer',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                                    boxShadow: mainsOn ? '0 0 30px rgba(239, 68, 68, 0.3)' : 'none',
                                                    transition: 'all 0.4s ease'
                                                }}
                                            >
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: '50%',
                                                    background: mainsOn ? 'linear-gradient(135deg, #EF4444 0%, #991B1B 100%)' : '#1e293b',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: mainsOn ? '0 0 20px #EF4444' : 'inset 0 2px 4px rgba(0,0,0,0.5)'
                                                }}>
                                                    <Power size={20} color="white" />
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', letterSpacing: 1 }}>MAIN POWER</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>{mainsOn ? 'ACTIVE' : 'OFFLINE'}</div>
                                                </div>
                                            </div>

                                            {/* Vertical Feed Line */}
                                            <div style={{
                                                width: 4, height: 40,
                                                background: mainsOn ? '#EF4444' : 'rgba(255,255,255,0.1)',
                                                boxShadow: mainsOn ? '0 0 15px #EF4444' : 'none',
                                                transition: 'all 0.4s ease'
                                            }}></div>

                                            {/* Horizontal Busbar */}
                                            <div style={{
                                                width: '90%', height: 6, borderRadius: 3,
                                                background: mainsOn ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                                                boxShadow: mainsOn ? '0 0 20px #06b6d4' : 'none',
                                                animation: mainsOn ? 'pulse-flow 2s infinite' : 'none',
                                                transition: 'all 0.4s ease'
                                            }}></div>
                                        </div>

                                        {/* Modules Container */}
                                        <div style={{
                                            flex: 1,
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            justifyContent: 'center',
                                            alignItems: 'flex-start',
                                            gap: '30px',
                                            zIndex: 10
                                        }}>

                                            {selectedMotors.length === 0 && (
                                                <div style={{
                                                    padding: '40px', color: 'rgba(255,255,255,0.3)',
                                                    border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px',
                                                    backdropFilter: 'blur(4px)'
                                                }}>
                                                    Initialize System: Add Loads
                                                </div>
                                            )}

                                            {selectedMotors.map((m) => {
                                                const isActive = activeMotorIds.includes(m.uniqueId);

                                                return (
                                                    <div key={m.uniqueId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                                                        {/* Drop Line from Busbar */}
                                                        <div style={{
                                                            width: 2, height: 30, marginTop: -30, marginBottom: 10,
                                                            background: isActive ? '#06b6d4' : (mainsOn ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255,255,255,0.1)'),
                                                            boxShadow: isActive ? '0 0 10px #06b6d4' : 'none',
                                                            transition: 'all 0.4s ease'
                                                        }}></div>

                                                        {/* Glass Card */}
                                                        <div style={{
                                                            width: '140px',
                                                            background: 'rgba(255, 255, 255, 0.03)',
                                                            backdropFilter: 'blur(12px)',
                                                            borderRadius: '16px',
                                                            border: `1px solid ${isActive ? '#06b6d4' : 'rgba(255,255,255,0.1)'}`,
                                                            padding: '16px',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                                                            position: 'relative',
                                                            boxShadow: isActive ? '0 0 25px rgba(6, 182, 212, 0.15)' : 'none',
                                                            transition: 'all 0.3s ease'
                                                        }}>
                                                            {/* Close Button */}
                                                            <button
                                                                onClick={() => removeMotor(m.uniqueId)}
                                                                style={{
                                                                    position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                                                                    color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '1rem',
                                                                    transition: 'color 0.2s', ':hover': { color: 'white' }
                                                                }}
                                                            >×</button>

                                                            {/* Icon Glow */}
                                                            <div style={{
                                                                padding: 12, borderRadius: '50%',
                                                                background: isActive ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.05)',
                                                                color: isActive ? '#06b6d4' : '#94A3B8',
                                                                boxShadow: isActive ? '0 0 15px #06b6d4' : 'none',
                                                                border: `1px solid ${isActive ? '#06b6d4' : 'transparent'}`,
                                                                transition: 'all 0.4s ease'
                                                            }}>
                                                                <m.icon size={20} />
                                                            </div>

                                                            <div style={{ textAlign: 'center' }}>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{m.name}</div>
                                                                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{m.amps} Amps</div>
                                                            </div>

                                                            {/* Futuristic Toggle */}
                                                            <button
                                                                onClick={() => toggleMotor(m.uniqueId)}
                                                                disabled={!mainsOn}
                                                                style={{
                                                                    width: '100%', padding: '8px',
                                                                    borderRadius: '8px', border: 'none',
                                                                    background: isActive ? '#06b6d4' : (mainsOn ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'),
                                                                    color: isActive ? '#0f172a' : (mainsOn ? 'white' : 'rgba(255,255,255,0.3)'),
                                                                    fontWeight: 700, fontSize: '0.8rem',
                                                                    cursor: mainsOn ? 'pointer' : 'not-allowed',
                                                                    transition: 'all 0.3s',
                                                                    boxShadow: isActive ? '0 0 15px rgba(6, 182, 212, 0.6)' : 'none'
                                                                }}
                                                            >
                                                                {isActive ? 'ACTIVE' : 'START'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ElectricalPanelBoardPlanner;
