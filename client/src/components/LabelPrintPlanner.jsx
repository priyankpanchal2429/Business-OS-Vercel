import React, { useState, useRef } from 'react';
import {
    Printer, Settings, LayoutGrid, Type,
    Plus, Trash2, Copy as CopyIcon,
    ZoomIn, ZoomOut, X
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import LabelRenderer from './LabelRenderer';

const LabelPrintPlanner = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Global Data
    const [globalSettings, setGlobalSettings] = useState({
        companyName: 'RAJESH ENGINEERING',
        mfgDate: new Date().toISOString().split('T')[0]
    });

    // Batch Data (Each row represents a set of labels to print)
    const [batchRows, setBatchRows] = useState([
        { id: 1, customerName: '', location: '', plantName: '', partName: '', modelNumber: '', qty: 1 }
    ]);

    // Print Settings
    const [paperSize, setPaperSize] = useState('a4'); // 'a4'
    const [orientation, setOrientation] = useState('portrait'); // 'portrait', 'landscape'
    const [layoutPreset, setLayoutPreset] = useState('1x1'); // '1x1', '1x2', '2x2'
    const [zoom, setZoom] = useState(60);
    const [globalFontScale, setGlobalFontScale] = useState(1.0); // 1.0 = 100%

    // --- Helpers ---
    const addRow = () => {
        const lastRow = batchRows[batchRows.length - 1];
        setBatchRows([...batchRows, { ...lastRow, id: Date.now(), partName: '', modelNumber: '', qty: 1 }]);
    };

    const updateRow = (id, field, value) => {
        setBatchRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const deleteRow = (id) => {
        if (batchRows.length > 1) setBatchRows(prev => prev.filter(r => r.id !== id));
    };

    const duplicateRow = (row) => {
        setBatchRows([...batchRows, { ...row, id: Date.now() }]);
    };

    // --- Layout Logic ---
    const getLayoutStyles = () => {
        // A4 Dimensions in MM
        const width = orientation === 'portrait' ? 210 : 297;
        const height = orientation === 'portrait' ? 297 : 210;

        const baseStyle = {
            width: `${width}mm`,
            height: `${height}mm`,
            background: 'white',
            display: 'grid',
            boxSizing: 'border-box',
            padding: '10mm', // Safe print margin
            gap: '0', // No gap between cells for cut lines, or add gap if needed
            border: '1px solid #ddd', // Visual border for preview
            margin: '0 auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        };

        // Grid Configuration
        if (layoutPreset === '1x1') {
            baseStyle.gridTemplateColumns = '1fr';
            baseStyle.gridTemplateRows = '1fr';
        } else if (layoutPreset === '1x2') {
            // 2 Labels (Split vertically or horizontally depending on orient)
            // Portrait: 2 stacked (Horizontal cut)
            // Landscape: 2 side-by-side (Vertical cut)
            baseStyle.gridTemplateColumns = orientation === 'portrait' ? '1fr' : '1fr 1fr';
            baseStyle.gridTemplateRows = orientation === 'portrait' ? '1fr 1fr' : '1fr';
        } else if (layoutPreset === '2x2') {
            // 4 Labels (A6)
            baseStyle.gridTemplateColumns = '1fr 1fr';
            baseStyle.gridTemplateRows = '1fr 1fr';
        }

        return baseStyle;
    };

    // Flatten rows based on qty for rendering
    const getAllLabels = () => {
        return batchRows.flatMap(row => Array(row.qty).fill(row));
    };

    // Pagination for Sheet View
    const getPaginatedLabels = () => {
        const all = getAllLabels();
        let perPage = 1;
        if (layoutPreset === '1x2') perPage = 2;
        if (layoutPreset === '2x2') perPage = 4;

        const pages = [];
        for (let i = 0; i < all.length; i += perPage) {
            pages.push(all.slice(i, i + perPage));
        }
        if (pages.length === 0) return [[]]; // Return at least one empty page
        return pages; // Returns array of arrays of labels
    };

    // --- Print & Export ---
    const handlePrint = () => {
        const content = document.getElementById('print-container');
        if (!content) return;

        const printWindow = window.open('', '', 'height=800,width=1000');
        printWindow.document.write('<html><head><title>Print Labels</title>');
        printWindow.document.write(`
            <style>
                @page { size: ${paperSize} ${orientation}; margin: 0; }
                body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
                .sheet {
                    width: ${orientation === 'portrait' ? '210mm' : '297mm'};
                    height: ${orientation === 'portrait' ? '297mm' : '210mm'};
                    page-break-after: always;
                    display: grid;
                    box-sizing: border-box;
                    padding: 10mm; /* Printer Margin */
                    background: white;
                }
                .label-cell {
                    border: 1px dashed #ccc; /* Cut guide */
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2mm;
                }
                @media print {
                   .label-cell { border-color: #eee; } /* Lighter guide on print */
                }
            </style>
        `);
        printWindow.document.write('</head><body>');

        const containerClone = content.cloneNode(true);
        const sheets = containerClone.querySelectorAll('.sheet');
        sheets.forEach(sheet => {
            sheet.style.transform = 'none';
            sheet.style.margin = '0';
            sheet.style.boxShadow = 'none';
            sheet.style.border = 'none';
        });

        printWindow.document.write(containerClone.innerHTML);

        printWindow.document.write('</body></html>');
        printWindow.document.close();

        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    return (
        <>
            {/* Trigger Button - Matches typical UI */}
            <div
                onClick={() => setIsOpen(true)}
                style={{
                    background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0',
                    padding: '20px', display: 'flex', alignItems: 'center', gap: 16,
                    cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                }}
            >
                <div style={{ padding: 12, background: '#EFF6FF', borderRadius: 10, color: '#2563EB' }}>
                    <Printer size={24} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Label Print Studio</h3>
                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>Industrial Batch Printing</p>
                </div>
            </div>

            {/* Modal */}
            {isOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        width: '95vw', height: '95vh', background: 'white', borderRadius: 16,
                        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Printer size={24} color="#0F172A" />
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Label Print Studio</h2>
                            </div>
                            <button onClick={() => setIsOpen(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                            {/* LEFT PANEL: DATA ENTRY */}
                            <div style={{ width: '400px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                                {/* Global Settings */}
                                <div style={{ padding: 20, borderBottom: '1px solid #E2E8F0', background: 'white' }}>
                                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: 12 }}>Global Settings</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Company Name</label>
                                            <input
                                                value={globalSettings.companyName}
                                                onChange={(e) => setGlobalSettings({ ...globalSettings, companyName: e.target.value })}
                                                placeholder="Company Name"
                                                style={{ padding: '8px', borderRadius: 6, border: '1px solid #CBD5E1', width: '100%', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Date</label>
                                            <input
                                                type="date"
                                                value={globalSettings.mfgDate}
                                                onChange={(e) => setGlobalSettings({ ...globalSettings, mfgDate: e.target.value })}
                                                style={{ padding: '8px', borderRadius: 6, border: '1px solid #CBD5E1', width: '100%', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Rows List */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: 12 }}>Labels Queue</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {batchRows.map((row, idx) => (
                                            <div key={row.id} style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>#{idx + 1}</span>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <Trash2 size={14} color="#EF4444" cursor="pointer" onClick={() => deleteRow(row.id)} />
                                                        <CopyIcon size={14} color="#64748B" cursor="pointer" onClick={() => duplicateRow(row)} />
                                                    </div>
                                                </div>

                                                <input
                                                    value={row.customerName} onChange={(e) => updateRow(row.id, 'customerName', e.target.value)}
                                                    placeholder="Customer Name" style={{ width: '100%', marginBottom: 8, padding: 6, fontSize: '0.9rem', border: '1px solid #E2E8F0', borderRadius: 4, boxSizing: 'border-box' }}
                                                />
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                                    <input
                                                        value={row.plantName} onChange={(e) => updateRow(row.id, 'plantName', e.target.value)}
                                                        placeholder="Plant / Project" style={{ flex: 1, padding: 6, fontSize: '0.9rem', border: '1px solid #E2E8F0', borderRadius: 4, boxSizing: 'border-box' }}
                                                    />
                                                    <input
                                                        value={row.location} onChange={(e) => updateRow(row.id, 'location', e.target.value)}
                                                        placeholder="Location" style={{ width: '80px', padding: 6, fontSize: '0.9rem', border: '1px solid #E2E8F0', borderRadius: 4, boxSizing: 'border-box' }}
                                                    />
                                                </div>

                                                <input
                                                    value={row.partName} onChange={(e) => updateRow(row.id, 'partName', e.target.value)}
                                                    placeholder="PART NAME" style={{ width: '100%', marginBottom: 8, padding: 6, fontSize: '0.9rem', fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 4, boxSizing: 'border-box' }}
                                                />

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                    <input
                                                        value={row.modelNumber} onChange={(e) => updateRow(row.id, 'modelNumber', e.target.value)}
                                                        placeholder="Model" style={{ padding: 6, fontSize: '0.85rem', border: '1px solid #E2E8F0', borderRadius: 4, boxSizing: 'border-box' }}
                                                    />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <span style={{ fontSize: '0.75rem' }}>Qty:</span>
                                                        <input
                                                            type="number" min="1" value={row.qty} onChange={(e) => updateRow(row.id, 'qty', parseInt(e.target.value) || 1)}
                                                            style={{ width: '100%', padding: 6, fontSize: '0.85rem', border: '1px solid #E2E8F0', borderRadius: 4, boxSizing: 'border-box' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={addRow} style={{ marginTop: 16, width: '100%', padding: 10, background: '#EFF6FF', color: '#2563EB', border: '1px dashed #BFDBFE', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <Plus size={16} /> Add Another Label
                                    </button>
                                </div>
                            </div>

                            {/* RIGHT PANEL: PREVIEW */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#334155' }}>
                                {/* Toolbar */}
                                <div style={{ height: 60, background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        {/* Paper Settings */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRight: '1px solid #E2E8F0', paddingRight: 16 }}>
                                            <Settings size={16} color="#64748B" />
                                            <select value={paperSize} onChange={(e) => setPaperSize(e.target.value)} style={{ fontSize: '0.9rem', border: 'none', background: 'transparent', fontWeight: 500, cursor: 'pointer' }}>
                                                <option value="a4">A4 Paper</option>
                                            </select>
                                            <select value={orientation} onChange={(e) => setOrientation(e.target.value)} style={{ fontSize: '0.9rem', border: 'none', background: 'transparent', fontWeight: 500, cursor: 'pointer' }}>
                                                <option value="portrait">Portrait</option>
                                                <option value="landscape">Landscape</option>
                                            </select>
                                        </div>

                                        {/* Grid Layout */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRight: '1px solid #E2E8F0', paddingRight: 16 }}>
                                            <LayoutGrid size={16} color="#64748B" />
                                            <select value={layoutPreset} onChange={(e) => setLayoutPreset(e.target.value)} style={{ fontSize: '0.9rem', border: 'none', background: 'transparent', fontWeight: 500, cursor: 'pointer' }}>
                                                <option value="1x1">1 Label (Full Page)</option>
                                                <option value="1x2">2 Labels (Half Page)</option>
                                                <option value="2x2">4 Labels (Quarter Page/A6)</option>
                                            </select>
                                        </div>

                                        {/* Font Scale Control */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Type size={16} color="#64748B" />
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Size:</span>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="5.0"
                                                step="0.1"
                                                value={globalFontScale}
                                                onChange={(e) => setGlobalFontScale(parseFloat(e.target.value))}
                                                style={{ width: 80, accentColor: '#2563EB', cursor: 'pointer' }}
                                                title={`Font Scale: ${(globalFontScale * 100).toFixed(0)}%`}
                                            />
                                            <span style={{ fontSize: '0.8rem', width: 30, textAlign: 'right', fontWeight: 500 }}>{(globalFontScale * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F1F5F9', padding: '4px 8px', borderRadius: 6 }}>
                                            <ZoomOut size={14} style={{ cursor: 'pointer' }} onClick={() => setZoom(z => Math.max(20, z - 10))} />
                                            <span style={{ fontSize: '0.8rem', minWidth: 30, textAlign: 'center' }}>{zoom}%</span>
                                            <ZoomIn size={14} style={{ cursor: 'pointer' }} onClick={() => setZoom(z => Math.min(150, z + 10))} />
                                        </div>
                                        <button onClick={handlePrint} style={{ background: '#0F172A', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                            <Printer size={16} /> Print
                                        </button>
                                    </div>
                                </div>

                                {/* Preview Area */}
                                <div style={{ flex: 1, overflow: 'auto', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>

                                    {/* Map through generated pages */}
                                    <div id="print-container">
                                        {getPaginatedLabels().map((pageLabels, pageIdx) => (
                                            <div
                                                key={`page-${pageIdx}`}
                                                className="sheet"
                                                style={{
                                                    ...getLayoutStyles(),
                                                    transform: `scale(${zoom / 100})`, // Apply Zoom
                                                    transformOrigin: 'top center',
                                                    marginBottom: '40px' // Space between pages in preview
                                                }}
                                            >
                                                {pageLabels.map((labelInfo, idx) => (
                                                    <div key={idx} className="label-cell" style={{
                                                        width: '100%', height: '100%',
                                                        // Dashed lines handling if needed
                                                        borderRight: (layoutPreset === '2x2' && idx % 2 === 0) || (layoutPreset === '1x2' && orientation === 'landscape' && idx === 0) ? '1px dashed #ddd' : 'none',
                                                        borderBottom: (layoutPreset === '2x2' && idx < 2) || (layoutPreset === '1x2' && orientation === 'portrait' && idx === 0) ? '1px dashed #ddd' : 'none',
                                                        padding: '1mm' // Internal padding
                                                    }}>
                                                        <LabelRenderer
                                                            labelData={{ ...labelInfo, ...globalSettings }}
                                                            fontScale={globalFontScale}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
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

export default LabelPrintPlanner;
