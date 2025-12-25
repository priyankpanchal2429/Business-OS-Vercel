import React, { useRef, useEffect, useState } from 'react';

const LabelRenderer = ({
    labelData,
    labelSize = 'a4',
    orientation = 'landscape',
    showTechDetails = false,
    forcedPartNameSize = null // Optional prop to override auto-scaling (e.g. from slider)
}) => {
    const partNameRef = useRef(null);
    const [partNameSize, setPartNameSize] = useState(120);

    // Auto-resize font for Part Name
    useEffect(() => {
        if (forcedPartNameSize) {
            setPartNameSize(forcedPartNameSize);
            return;
        }

        if (partNameRef.current) {
            const containerWidth = partNameRef.current.parentElement.offsetWidth;
            const textWidth = partNameRef.current.scrollWidth;

            if (textWidth > containerWidth) {
                // Reduce size if it overflows
                setPartNameSize(prev => Math.max(50, prev - 10));
            } else if (textWidth < containerWidth * 0.9 && partNameSize < 1500) {
                // Increase size aggressively if there's space
                setPartNameSize(prev => Math.min(1500, prev + 20));
            }
        }
    }, [labelData.partName, orientation, labelSize, partNameSize, forcedPartNameSize]);

    // Styles
    const getContainerStyle = () => ({
        width: orientation === 'landscape' ? (labelSize === 'sticker' ? '600px' : '800px') : '500px',
        height: orientation === 'landscape' ? 'auto' : '700px',
        aspectRatio: orientation === 'landscape' ? (labelSize === 'sticker' ? '2/1' : '1.414/1') : '1/1.414',
        background: 'white',
        border: '4px solid black', // Approx 1mm
        padding: '24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative' // For absolute positioning if needed
    });

    return (
        <div style={getContainerStyle()}>
            {/* Company Header */}
            <div style={{ textAlign: 'center', borderBottom: '3px solid black', paddingBottom: 16, marginBottom: 20 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '2px', lineHeight: 1 }}>{labelData.companyName}</h1>
            </div>

            {/* Secondary Info: Customer & Location */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>CUSTOMER / PROJECT</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{labelData.customerName} - {labelData.plantName}</div>
                </div>
                {labelData.location && (
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>LOCATION</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{labelData.location}</div>
                    </div>
                )}
            </div>

            {/* BIG PART NAME HERO SECTION */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '3px solid black', overflow: 'hidden', padding: '0 10px' }}>
                <div
                    ref={partNameRef}
                    style={{
                        fontSize: `${partNameSize}%`,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        lineHeight: 0.8, // Tighten line height for Caps
                        width: '100%',
                        wordBreak: 'break-word',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100%',
                        paddingBottom: '0.1em' // Visual offset to lift text
                    }}
                >
                    {labelData.partName || 'PART NAME'}
                </div>
            </div>

            {/* Model & Specs Footer */}
            <div style={{ paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>MODEL NUMBER</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace' }}>{labelData.modelNumber || '-'}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>DATE</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{labelData.mfgDate}</div>
                    </div>
                </div>

                {showTechDetails && (
                    <div style={{ marginTop: 20, borderTop: '2px solid black', paddingTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, textAlign: 'center' }}>
                        <div style={{ borderRight: '1px solid #ccc' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#555' }}>POWER / HP</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{labelData.motorHP || '-'}</div>
                        </div>
                        <div style={{ borderRight: '1px solid #ccc' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#555' }}>VOLTAGE</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{labelData.voltage || '-'}</div>
                        </div>
                        <div style={{ borderRight: '1px solid #ccc' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#555' }}>RPM</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{labelData.rpm || '-'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#555' }}>PHASE</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{labelData.phase || '-'}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabelRenderer;
