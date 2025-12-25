import React, { useRef, useEffect, useState } from 'react';

const LabelRenderer = ({
    labelData,
    scale = 1,
    fontScale = 1 // New prop: 0.1 to 2.0 (standard 1)
}) => {
    const partNameRef = useRef(null);

    // Auto-fit Part Name text
    useEffect(() => {
        if (!partNameRef.current) return;

        const fitText = () => {
            const container = partNameRef.current;
            const content = container.firstChild;
            if (!content) return;

            // Start large
            let size = 300;
            content.style.fontSize = `${size}%`;
            content.style.lineHeight = '0.9';

            // Shrink to fit container
            while (
                (content.scrollWidth > container.clientWidth || content.scrollHeight > container.clientHeight) &&
                size > 20
            ) {
                size -= 5;
                content.style.fontSize = `${size}%`;
            }

            // Apply User Scale Multiplier
            const finalSize = Math.floor(size * fontScale);
            content.style.fontSize = `${finalSize}%`;
        };

        fitText();
    }, [labelData.partName, scale, fontScale]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: 'white',
            border: '5px solid black', // Thicker border
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Arial Black", "Arial", sans-serif', // Bold Industrial Font
            color: 'black',
            overflow: 'hidden',
            position: 'relative',
            padding: '12px' // Inner gutter
        }}>
            {/* Top Section: Company Name */}
            <div style={{
                textAlign: 'center',
                paddingBottom: '8px',
                borderBottom: '3px solid black', // Bold separator
                marginBottom: '8px'
            }}>
                <h1 style={{
                    margin: 0,
                    fontSize: '1em',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    {labelData.companyName || 'COMPANY NAME'}
                </h1>
            </div>

            {/* Customer / Project Info */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end', // Align bottom so larger text sits well
                borderBottom: '2px solid black', // Divider
                paddingBottom: '8px',
                marginBottom: '8px'
            }}>
                <span style={{
                    fontSize: '1em', // Bigger Customer Name
                    fontWeight: 900,
                    color: 'black',
                    textTransform: 'uppercase',
                    textAlign: 'left'
                }}>
                    {labelData.customerName || 'CUSTOMER NAME'}
                </span>
                <span style={{
                    fontSize: '0.7em',
                    fontWeight: 700,
                    textAlign: 'right',
                    textTransform: 'uppercase'
                }}>
                    {labelData.plantName || labelData.location || 'PROJECT / LOCATION'}
                </span>
            </div>

            {/* Main Content: Part Name */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            }} ref={partNameRef}>
                <div style={{
                    textAlign: 'center',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    width: '100%',
                    wordBreak: 'break-word'
                }}>
                    {labelData.partName || 'PART NAME'}
                </div>
            </div>

            {/* Bottom Section: Footer Info */}
            <div style={{
                borderTop: '3px solid black', // Bold separator
                paddingTop: '8px',
                marginTop: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.5em', fontWeight: 700, color: '#333', textTransform: 'uppercase', marginBottom: 2 }}>Model Number</span>
                    <span style={{ fontSize: '0.8em', fontWeight: 700 }}>
                        {labelData.modelNumber || '-'}
                    </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.5em', fontWeight: 700, color: '#333', textTransform: 'uppercase', marginBottom: 2 }}>Date</span>
                    <span style={{ fontSize: '0.8em', fontWeight: 700 }}>
                        {labelData.mfgDate || new Date().toISOString().split('T')[0]}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LabelRenderer;
