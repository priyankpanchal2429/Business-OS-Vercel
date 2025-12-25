import React, { useState, useRef } from 'react';
import { Box, Factory, Cylinder, Container, RotateCw, Trash2, X, Download, RotateCcw, ChevronsRight } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MACHINE_TYPES = [
    { id: 'grinder', name: 'Grinder', width: 4, height: 4, icon: Factory, color: '#3B82F6' },
    { id: 'mixer', name: 'Mixer', width: 5, height: 5, icon: Cylinder, color: '#10B981' },
    { id: 'conveyor', name: 'Conveyor', width: 8, height: 2, icon: ChevronsRight, color: '#F59E0B' },
    { id: 'storage', name: 'Storage Tank', width: 4, height: 4, icon: Container, color: '#8B5CF6' },
    { id: 'packager', name: 'Packager', width: 3, height: 3, icon: Box, color: '#EC4899' }
];

const PlantLayoutVisualPlanner = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [areaSize, setAreaSize] = useState({ width: 20, length: 20 });
    const [machines, setMachines] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [selectedMachineId, setSelectedMachineId] = useState(null);

    // Canvas ref for coordinate calculation
    const canvasRef = useRef(null);
    const SCALE = 20; // 1 foot = 20 pixels

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
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; e.currentTarget.style.borderColor = '#10B981'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
                <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                        <Factory size={28} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Plant Layout</h3>
                        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.9rem' }}>Visual Floor Planner</p>
                    </div>
                </div>
            </div>
        );
    }

    // Handle dropping a new machine from palette
    const handleDragStart = (e, machineType) => {
        e.dataTransfer.setData('machineType', JSON.stringify(machineType));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / SCALE;
        const y = (e.clientY - rect.top) / SCALE;

        const machineTypeData = e.dataTransfer.getData('machineType');

        if (machineTypeData) {
            // New machine drop
            const parsedData = JSON.parse(machineTypeData);
            // Re-hydrate the icon from the static constant because JSON functions strip React components
            const originalType = MACHINE_TYPES.find(t => t.id === parsedData.id) || parsedData;

            const newMachine = {
                id: Date.now(),
                ...originalType, // Use the one with the icon
                x: Math.max(0, Math.min(x, areaSize.width - originalType.width)),
                y: Math.max(0, Math.min(y, areaSize.length - originalType.height)),
                rotation: 0,
                // Ensure icon is definitely there (fallback)
                icon: originalType.icon
            };
            setMachines([...machines, newMachine]);
            setSelectedMachineId(newMachine.id);
        } else if (draggedItem) {
            // Moving existing machine
            const updatedMachines = machines.map(m => {
                if (m.id === draggedItem.id) {
                    return {
                        ...m,
                        x: Math.max(0, Math.min(x - draggedItem.offsetX, areaSize.width - (m.rotation % 180 === 90 ? m.height : m.width))),
                        y: Math.max(0, Math.min(y - draggedItem.offsetY, areaSize.length - (m.rotation % 180 === 90 ? m.width : m.height)))
                    };
                }
                return m;
            });
            setMachines(updatedMachines);
            setDraggedItem(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    // Machine internal drag (repositioning)
    const startMachineDrag = (e, machine) => {
        e.stopPropagation();
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / SCALE;
        const mouseY = (e.clientY - rect.top) / SCALE;
        setDraggedItem({
            id: machine.id,
            offsetX: mouseX - machine.x,
            offsetY: mouseY - machine.y
        });
        setSelectedMachineId(machine.id);
    };

    const rotateMachine = (id) => {
        setMachines(machines.map(m => {
            if (m.id === id) {
                return { ...m, rotation: (m.rotation + 90) % 360 };
            }
            return m;
        }));
    };

    const deleteMachine = (id) => {
        setMachines(machines.filter(m => m.id !== id));
        if (selectedMachineId === id) setSelectedMachineId(null);
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear the entire layout?')) {
            setMachines([]);
            setSelectedMachineId(null);
        }
    };

    const handleDownload = async () => {
        const element = canvasRef.current;
        if (!element) return;

        try {
            // Deselect to hide controls
            const currentSelection = selectedMachineId;
            setSelectedMachineId(null);

            // Wait for render
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: 'white',
                logging: false
            });

            // Restore selection
            setSelectedMachineId(currentSelection);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('Plant_Layout_Plan.pdf');
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    // Collision Detection
    const checkCollision = (currentMachine) => {
        const curW = currentMachine.rotation % 180 === 90 ? currentMachine.height : currentMachine.width;
        const curH = currentMachine.rotation % 180 === 90 ? currentMachine.width : currentMachine.height;
        const curRect = { l: currentMachine.x, r: currentMachine.x + curW, t: currentMachine.y, b: currentMachine.y + curH };

        return machines.some(other => {
            if (other.id === currentMachine.id) return false;
            const othW = other.rotation % 180 === 90 ? other.height : other.width;
            const othH = other.rotation % 180 === 90 ? other.width : other.height;
            const othRect = { l: other.x, r: other.x + othW, t: other.y, b: other.y + othH };

            return !(curRect.r <= othRect.l || curRect.l >= othRect.r || curRect.b <= othRect.t || curRect.t >= othRect.b);
        });
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
            {/* Page Header */}
            <div style={{ padding: '20px 40px', background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ padding: 10, background: '#ECFDF5', borderRadius: 12 }}>
                        <Factory size={24} color="#059669" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Plant Layout Visual Planner</h2>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B' }}>Design & Optimize Floor Space</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium hover:bg-slate-100 px-4 py-2 rounded-lg"
                >
                    <X size={20} /> Close Tool
                </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Toolbar / Area Settings */}
                <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'flex-end', background: 'white', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px', color: '#475569' }}>1. Dimensions (ft)</h3>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>Length</label>
                                <input
                                    type="number"
                                    value={areaSize.length}
                                    onChange={(e) => setAreaSize({ ...areaSize, length: Number(e.target.value) })}
                                    style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>Width</label>
                                <input
                                    type="number"
                                    value={areaSize.width}
                                    onChange={(e) => setAreaSize({ ...areaSize, width: Number(e.target.value) })}
                                    style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                                />
                            </div>
                        </div>
                    </div>
                    <div style={{ height: 50, width: 1, background: '#E2E8F0' }}></div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px', color: '#475569' }}>2. Instructions</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B' }}>
                            Drag machines from the palette below onto the grid. Click a machine to rotate or delete.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            onClick={handleClear}
                            style={{
                                padding: '10px 20px', background: 'white', color: '#64748B',
                                border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: 600,
                                cursor: machines.length === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8, opacity: machines.length === 0 ? 0.5 : 1
                            }}
                            disabled={machines.length === 0}
                        >
                            <RotateCcw size={16} /> Reset
                        </button>

                        <button
                            onClick={handleDownload}
                            style={{
                                padding: '10px 20px', background: '#0F172A', color: 'white',
                                border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <Download size={16} /> Save Layout
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', flex: 1, overflow: 'hidden' }}>
                    {/* Palette */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', height: 'fit-content', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#334155' }}>Available Machines</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: 16 }}>
                            {MACHINE_TYPES.map(m => (
                                <div
                                    key={m.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, m)}
                                    style={{
                                        padding: '16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px',
                                        cursor: 'grab', display: 'flex', alignItems: 'center', gap: '12px',
                                        transition: 'all 0.2s', ':hover': { borderColor: '#3B82F6', transform: 'translateY(-2px)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div style={{ padding: 10, background: `${m.color}15`, borderRadius: 8, color: m.color }}>
                                        <m.icon size={20} />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', color: '#1E293B' }}>{m.name}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{m.width}' x {m.height}'</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div style={{
                        flex: 1, overflow: 'auto', background: '#F1F5F9', padding: '40px', borderRadius: '16px',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #E2E8F0',
                        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
                    }}>
                        <div
                            ref={canvasRef}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            style={{
                                width: areaSize.width * SCALE,
                                height: areaSize.length * SCALE,
                                background: 'white',
                                position: 'relative',
                                // Grid Pattern
                                backgroundImage: `
                                    linear-gradient(to right, #e2e8f0 1px, transparent 1px),
                                    linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
                                `,
                                backgroundSize: `${SCALE}px ${SCALE}px`,
                                border: '2px solid #94A3B8',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                            }}
                        >
                            {/* Rulers */}
                            <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', fontWeight: 600, color: '#64748B', fontSize: '0.85rem', background: 'white', padding: '4px 12px', borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                {areaSize.width} ft
                            </div>
                            <div style={{ position: 'absolute', left: -50, top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontWeight: 600, color: '#64748B', fontSize: '0.85rem', background: 'white', padding: '4px 12px', borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                {areaSize.length} ft
                            </div>

                            {/* Machines */}
                            {machines.map(m => {
                                const isSelected = selectedMachineId === m.id;
                                const isColliding = checkCollision(m);

                                return (
                                    <div
                                        key={m.id}
                                        draggable
                                        onDragStart={(e) => startMachineDrag(e, m)}
                                        onClick={(e) => { e.stopPropagation(); setSelectedMachineId(m.id); }}
                                        style={{
                                            position: 'absolute',
                                            left: m.x * SCALE,
                                            top: m.y * SCALE,
                                            width: (m.rotation % 180 === 90 ? m.height : m.width) * SCALE,
                                            height: (m.rotation % 180 === 90 ? m.width : m.height) * SCALE,
                                            background: isColliding ? 'rgba(239, 68, 68, 0.2)' : 'white',
                                            border: `2px solid ${isColliding ? '#EF4444' : (isSelected ? '#3B82F6' : m.color)}`,
                                            borderRadius: '4px',
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            cursor: 'grab',
                                            zIndex: isSelected ? 20 : 10,
                                            transition: 'all 0.2s',
                                            boxSizing: 'border-box',
                                            boxShadow: isSelected ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'
                                        }}
                                    >
                                        <div style={{ opacity: isColliding ? 1 : 0.8, color: isColliding ? '#EF4444' : m.color }}>
                                            <m.icon size={Math.min(24, Math.min(m.width, m.height) * SCALE / 2)} />
                                        </div>
                                        {(m.width > 2 && m.height > 2) && (
                                            <span style={{ fontSize: '0.6rem', marginTop: 2, fontWeight: 600, color: '#475569', pointerEvents: 'none', userSelect: 'none' }}>
                                                {m.name}
                                            </span>
                                        )}

                                        {/* Context Menu (On Select) */}
                                        {isSelected && (
                                            <div style={{
                                                position: 'absolute', top: -45, left: '50%', transform: 'translateX(-50%)',
                                                display: 'flex', gap: 6, background: '#1E293B', padding: 6, borderRadius: 30,
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50
                                            }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); rotateMachine(m.id); }}
                                                    style={{ padding: 6, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#334155', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Rotate 90°"
                                                >
                                                    <RotateCw size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteMachine(m.id); }}
                                                    style={{ padding: 6, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#EF4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Remove"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlantLayoutVisualPlanner;
