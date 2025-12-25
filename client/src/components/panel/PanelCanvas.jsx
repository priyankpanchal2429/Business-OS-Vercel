import React, { forwardRef } from 'react';
import { Zap } from 'lucide-react';
import ComponentRenderer from './ComponentRenderer';
import WireRenderer from './WireRenderer';

const PanelCanvas = forwardRef(({
    items,
    draggingId,
    setDraggingId,
    dragOffset,
    setDragOffset,
    onMove,
    onSelect,
    selectedId,
    viewMode,
    isEmergencyStop,
    toggleMotorStatus,
    toggleTripStatus
}, ref) => {

    const handleMouseDown = (e, id, x, y) => {
        if (!ref.current) return;
        const svgRect = ref.current.getBoundingClientRect();
        setDraggingId(id);
        onSelect(id);
        setDragOffset({
            x: e.clientX - svgRect.left - x,
            y: e.clientY - svgRect.top - y
        });
        e.stopPropagation();
    };

    const handleMouseMove = (e) => {
        if (draggingId && ref.current) {
            const svgRect = ref.current.getBoundingClientRect();
            const newX = e.clientX - svgRect.left - dragOffset.x;
            const newY = e.clientY - svgRect.top - dragOffset.y;
            onMove(draggingId, newX, newY);
        }
    };

    const handleMouseUp = () => {
        setDraggingId(null);
    };

    // Colors
    const C = {
        grid: '#334155',
        wireEnergized: '#ef4444',
        wireOff: '#334155',
        selection: '#0ea5e9'
    };

    return (
        <div className="flex-1 overflow-auto bg-slate-900 p-12 relative flex items-center justify-center custom-scrollbar-dark">
            <div
                className="bg-slate-900 shadow-2xl border border-slate-700/50 rounded-sm relative overflow-hidden transition-all duration-300"
                style={{
                    // A3 Landscape Ratio approx
                    width: '1400px',
                    height: '900px',
                    boxShadow: '0 0 100px -20px rgba(0,0,0,0.5)'
                }}
            >
                {/* Tech Grid Background (Blueprint Style) */}
                <div className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                        backgroundImage: `
                            linear-gradient(${C.grid} 1px, transparent 1px),
                            linear-gradient(90deg, ${C.grid} 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px',
                        backgroundPosition: '-1px -1px'
                    }}
                />
                <div className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                        backgroundImage: `radial-gradient(${C.grid} 1px, transparent 1px)`,
                        backgroundSize: '10px 10px'
                    }}
                />

                {/* SVG Layer */}
                <svg
                    ref={ref}
                    width="100%" height="100%"
                    style={{ position: 'absolute', top: 0, left: 0 }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={() => onSelect(null)} // Deselect background
                >
                    {items.map((item) => {
                        const colX = item.x;
                        const baseY = item.y;
                        const isSelected = selectedId === item.id;

                        // Accessory Render
                        if (item.type && item.type !== 'MOTOR_CIRCUIT') {
                            return (
                                <ComponentRenderer
                                    key={item.id}
                                    type={item.type}
                                    x={colX} y={baseY}
                                    state="OFF"
                                    isDraggable={true}
                                    onDragStart={(e) => handleMouseDown(e, item.id, colX, baseY)}
                                    onInteract={() => onSelect(item.id)}
                                />
                            );
                        }

                        // Motor Circuit Render
                        const mcbY = baseY;
                        const contactorY = baseY + 130;
                        const olrY = baseY + 250;
                        const motorY = baseY + 350;
                        const isLive = item.status === 'ON' && !isEmergencyStop;
                        const wireColor = isLive ? C.wireEnergized : C.wireOff;

                        return (
                            <React.Fragment key={item.id}>
                                {/* Selection Highlight (Neon Box) */}
                                {isSelected && (
                                    <rect
                                        x={colX - 50} y={baseY - 40}
                                        width="180" height="540"
                                        rx="4"
                                        fill="rgba(14, 165, 233, 0.05)"
                                        stroke={C.selection} strokeWidth="1" strokeDasharray="8 4"
                                        pointerEvents="none"
                                        className="animate-pulse"
                                    />
                                )}

                                {/* Wires */}
                                <WireRenderer points={[{ x: colX + 30, y: mcbY + 110 }, { x: colX + 30, y: contactorY }]} isEnergized={isLive} color={wireColor} />

                                {/* Live Current Badge (Holographic Style) */}
                                {isLive && (
                                    <g transform={`translate(${colX + 50}, ${contactorY + 40})`}>
                                        <rect x="-10" y="-12" width="60" height="24" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="1" rx="2" fillOpacity="0.9" />
                                        <text x="20" y="4" textAnchor="middle" fontSize="11" fill="#ef4444" fontWeight="bold" fontFamily="monospace" style={{ textShadow: '0 0 5px #ef4444' }}>{item.amps}A</text>
                                    </g>
                                )}

                                <WireRenderer points={[{ x: colX + 30, y: contactorY + 100 }, { x: colX + 30, y: olrY }]} isEnergized={isLive} color={wireColor} />
                                <WireRenderer points={[{ x: colX + 30, y: olrY + 80 }, { x: colX + 30, y: motorY }]} isEnergized={isLive} color={wireColor} />

                                {/* Components */}
                                <ComponentRenderer
                                    type="MCB"
                                    x={colX} y={mcbY}
                                    specs={{ rating: item.mcb }}
                                    state="ON"
                                    isDraggable={true}
                                    onDragStart={(e) => handleMouseDown(e, item.id, colX, mcbY)}
                                    onInteract={() => onSelect(item.id)}
                                />
                                <ComponentRenderer
                                    type="CONTACTOR"
                                    x={colX - 10} y={contactorY}
                                    specs={{ rating: item.starter }}
                                    state={isLive ? 'ON' : 'OFF'}
                                />
                                <ComponentRenderer
                                    type="OLR"
                                    x={colX} y={olrY}
                                    specs={{ range: item.details?.protection?.relayRange }}
                                    state={item.status === 'TRIPPED' ? 'TRIPPED' : 'ON'}
                                    onInteract={() => toggleTripStatus(item.id)}
                                />
                                <ComponentRenderer
                                    type="MOTOR"
                                    x={colX - 30} y={motorY}
                                    specs={{ hp: item.hp }}
                                />

                                {/* Controls */}
                                <g transform={`translate(${colX + 80}, ${contactorY + 10})`} style={{ cursor: 'pointer' }} onClick={() => toggleMotorStatus(item.id)}>
                                    <rect width="64" height="24" rx="2" fill={item.status === 'ON' ? '#450a0a' : '#052e16'} stroke={item.status === 'ON' ? '#ef4444' : '#22c55e'} strokeWidth="1" />
                                    <text x="32" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill={item.status === 'ON' ? '#ef4444' : '#22c55e'} style={{ letterSpacing: '1px' }}>
                                        {item.status === 'ON' ? 'STOP' : 'START'}
                                    </text>
                                </g>

                            </React.Fragment>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
});

export default PanelCanvas;
