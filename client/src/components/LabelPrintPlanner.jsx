import React, { useState, useRef, useEffect } from 'react';
import { Printer, X, Download, Save, Copy, RotateCcw, Tag, Settings, Type, Plus, Trash2, Copy as CopyIcon, RefreshCw, LayoutGrid, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import LabelRenderer from './LabelRenderer';

const LabelPrintPlanner = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState('single'); // 'single' or 'batch'

    // Single Mode State
    const [labelData, setLabelData] = useState({
        companyName: 'Rajesh Engineering',
        customerName: '',
        plantName: '',
        partName: '',
        modelNumber: '',
        mfgDate: new Date().toISOString().split('T')[0],
        location: '',
        motorHP: '',
        voltage: '',
        phase: '',
        rpm: '',
        panelType: '',
        capacity: ''
    });
    const [showTechDetails, setShowTechDetails] = useState(false);
    const [labelSize, setLabelSize] = useState('a4');
    const [orientation, setOrientation] = useState('landscape');
    const [partNameSize, setPartNameSize] = useState(120);

    // Batch Mode State
    const [batchRows, setBatchRows] = useState([
        { id: 1, companyName: 'Rajesh Engineering', customerName: '', plantName: '', partName: '', modelNumber: '', location: '', mfgDate: new Date().toISOString().split('T')[0], qty: 1 }
    ]);
    const [batchPreviewMode, setBatchPreviewMode] = useState('table'); // 'table' or 'sheet'
    const [batchSheetSize, setBatchSheetSize] = useState('a4');
    const [batchSheetOrientation, setBatchSheetOrientation] = useState('portrait'); // 'portrait', 'landscape'
    const [batchLabelSize, setBatchLabelSize] = useState('a6'); // 'a4', 'a5', 'a6', 'sticker'
    const [batchPartNameSize, setBatchPartNameSize] = useState(120); // Global font size for batch

    const previewRef = useRef(null);
    const batchSheetRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLabelData(prev => ({ ...prev, [name]: value }));
    };

    // --- Batch Helpers ---
    const addBatchRow = () => {
        const lastRow = batchRows[batchRows.length - 1];
        setBatchRows([...batchRows, {
            ...lastRow,
            id: Date.now(),
            partName: '',
            modelNumber: '',
            qty: 1
        }]);
    };

    const updateBatchRow = (id, field, value) => {
        setBatchRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const deleteBatchRow = (id) => {
        if (batchRows.length > 1) setBatchRows(prev => prev.filter(row => row.id !== id));
    };

    const duplicateBatchRow = (row) => {
        setBatchRows([...batchRows, { ...row, id: Date.now() }]);
    };

    // --- Grid Calculation Helper ---
    const getBatchGridStyles = () => {
        // Dimensions in MM
        const A4_SHORT = 210;
        const A4_LONG = 297;

        const isPortrait = batchSheetOrientation === 'portrait';
        const sheetWidth = isPortrait ? A4_SHORT : A4_LONG;
        const sheetHeight = isPortrait ? A4_LONG : A4_SHORT;

        let styles = {
            width: `${sheetWidth}mm`,
            minHeight: `${sheetHeight}mm`,
            display: 'grid',
            boxSizing: 'border-box'
        };

        switch (batchLabelSize) {
            case 'a4':
                // 1 per page
                styles.gridTemplateColumns = '1fr';
                styles.gridTemplateRows = '1fr';
                styles.orientation = isPortrait ? 'portrait' : 'landscape'; // Match sheet
                break;
            case 'a5':
                // A5 is half of A4.
                if (isPortrait) {
                    // A4 Portrait (210 wide) -> A5s are usually Landscape (210 wide x 148 high) stacked 2 high.
                    styles.gridTemplateColumns = '1fr';
                    styles.gridTemplateRows = '1fr 1fr';
                    styles.orientation = 'landscape';
                } else {
                    // A4 Landscape (297 wide) -> A5s are Portrait (148 wide x 210 high) side-by-side.
                    styles.gridTemplateColumns = '1fr 1fr';
                    styles.gridTemplateRows = '1fr';
                    styles.orientation = 'portrait';
                }
                break;
            case 'a6':
                // A6 is quarter of A4.
                // Works same for Port/Land, just 2x2 grid.
                styles.gridTemplateColumns = '1fr 1fr';
                styles.gridTemplateRows = '1fr 1fr';
                styles.orientation = isPortrait ? 'portrait' : 'landscape'; // Default logic
                break;
            case 'sticker':
                // 3x5 grid approx
                styles.gridTemplateColumns = 'repeat(3, 1fr)';
                styles.gridTemplateRows = 'repeat(5, 1fr)';
                styles.orientation = 'landscape';
                break;
            default:
                styles.gridTemplateColumns = '1fr';
                styles.gridTemplateRows = '1fr';
        }
        return styles;
    };

    // --- Print & Export Logic ---
    const handlePrint = () => {
        const targetId = mode === 'single' ? 'label-preview-area' : 'batch-sheet-preview-container';
        const content = document.getElementById(targetId);
        if (!content) return;

        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Print Label</title>');
        printWindow.document.write(`<style>
            body { margin: 0; }
            @media print { 
                @page { margin: 0; size: auto; }
                body { -webkit-print-color-adjust: exact; }
            }
            #batch-sheet-preview {
                page-break-after: always;
            }
        </style></head><body>`);
        printWindow.document.write(content.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const handleDownloadPDF = async () => {
        const element = mode === 'single' ? previewRef.current : batchSheetRef.current;
        if (!element) return;

        // Capture scale
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true
        });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF({
            orientation: mode === 'single' ? orientation : batchSheetOrientation,
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        if (mode === 'single') {
            const availWidth = pageWidth;
            const availHeight = pageHeight;
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const scaleFactor = Math.min(availWidth / imgWidth, availHeight / imgHeight);

            const finalWidth = imgWidth * scaleFactor;
            const finalHeight = imgHeight * scaleFactor;
            const xOffset = (pageWidth - finalWidth) / 2;
            const yOffset = (pageHeight - finalHeight) / 2;

            pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
        } else {
            // Batch: Match PDF page to Sheet Size settings
            pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        }

        pdf.save(mode === 'single' ? `Label_${labelData.partName || 'Part'}.pdf` : 'Batch_Sheet.pdf');
    };

    // --- Styles ---
    const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.9rem', background: '#F8FAFC' };
    const labelLabelStyle = { fontSize: '0.8rem', fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' };
    const gridSettings = getBatchGridStyles();

    return (
        <>
            {/* Card View */}
            <div style={{
                background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0',
                overflow: 'hidden', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.3s ease',
                cursor: 'pointer', ':hover': { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }
            }} onClick={() => setIsOpen(true)}>
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Tag size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Label Print</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Industrial Labels & Batch Builder</p>
                    </div>
                </div>
            </div>

            {/* Modal View */}
            {isOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: 'white', borderRadius: 16, width: '100%', maxWidth: '1400px', height: '90vh',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 8, background: '#EFF6FF', borderRadius: 8 }}><Printer size={20} color="#2563EB" /></div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Label Print Studio</h2>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                                        {mode === 'single' ? 'Generate & Print Single Label' : 'Batch Builder & Sheet Optimization'}
                                    </p>
                                </div>
                            </div>

                            {/* Mode Toggles */}
                            <div style={{ display: 'flex', background: '#F1F5F9', padding: 4, borderRadius: 8 }}>
                                <button onClick={() => setMode('single')} style={{ border: 'none', padding: '6px 16px', borderRadius: 6, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', background: mode === 'single' ? 'white' : 'transparent', color: mode === 'single' ? '#1E293B' : '#64748B', boxShadow: mode === 'single' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>Single Label</button>
                                <button onClick={() => setMode('batch')} style={{ border: 'none', padding: '6px 16px', borderRadius: 6, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', background: mode === 'batch' ? 'white' : 'transparent', color: mode === 'batch' ? '#1E293B' : '#64748B', boxShadow: mode === 'batch' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>Batch / Sheet</button>
                            </div>

                            <button onClick={() => setIsOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={20} color="#64748B" />
                            </button>
                        </div>

                        {mode === 'single' ? (
                            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                                {/* Left Panel: Controls (Single) */}
                                <div style={{ width: '350px', padding: '24px', overflowY: 'auto', borderRight: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                                    {/* Layout Settings */}
                                    <div style={{ marginBottom: 24, padding: 16, background: 'white', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Settings size={16} /> Layout Settings
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                            <div>
                                                <label style={labelLabelStyle}>Size</label>
                                                <select value={labelSize} onChange={(e) => setLabelSize(e.target.value)} style={{ ...inputStyle, background: 'white', padding: '8px' }}>
                                                    <option value="a4">A4</option>
                                                    <option value="a5">A5</option>
                                                    <option value="a6">A6</option>
                                                    <option value="sticker">Sticker</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={labelLabelStyle}>Orientation</label>
                                                <select value={orientation} onChange={(e) => setOrientation(e.target.value)} style={{ ...inputStyle, background: 'white', padding: '8px' }}>
                                                    <option value="landscape">Landscape</option>
                                                    <option value="portrait">Portrait</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Content Inputs */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#334155' }}>Label Content</h3>
                                        <div>
                                            <label style={labelLabelStyle}>Company Header</label>
                                            <input name="companyName" value={labelData.companyName} onChange={handleInputChange} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelLabelStyle}>Customer Name *</label>
                                            <input name="customerName" value={labelData.customerName} onChange={handleInputChange} style={{ ...inputStyle, borderColor: !labelData.customerName ? '#FCA5A5' : '#E2E8F0' }} placeholder="Required" />
                                        </div>
                                        <div>
                                            <label style={labelLabelStyle}>Plant / Project *</label>
                                            <input name="plantName" value={labelData.plantName} onChange={handleInputChange} style={{ ...inputStyle, borderColor: !labelData.plantName ? '#FCA5A5' : '#E2E8F0' }} placeholder="Required" />
                                        </div>
                                        <div>
                                            <label style={labelLabelStyle}>Location / Site</label>
                                            <input name="location" value={labelData.location} onChange={handleInputChange} style={inputStyle} placeholder="e.g. Pump Room 1" />
                                        </div>
                                        <div style={{ background: '#EFF6FF', padding: 12, borderRadius: 8, border: '1px solid #BFDBFE' }}>
                                            <label style={{ ...labelLabelStyle, color: '#1E40AF' }}>PART NAME (Main Display)</label>
                                            <input name="partName" value={labelData.partName} onChange={handleInputChange} style={{ ...inputStyle, background: 'white', fontSize: '1rem', fontWeight: 600 }} placeholder="e.g. HYDRAULIC PUMP" />
                                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Type size={14} color="#1E40AF" />
                                                <input type="range" min="50" max="1500" value={partNameSize} onChange={(e) => setPartNameSize(Number(e.target.value))} style={{ flex: 1, accentColor: '#2563EB' }} />
                                                <span style={{ fontSize: '0.75rem', color: '#1E40AF', width: 30 }}>{partNameSize}%</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={labelLabelStyle}>Model No.</label>
                                            <input name="modelNumber" value={labelData.modelNumber} onChange={handleInputChange} style={inputStyle} />
                                        </div>
                                        <div style={{ marginTop: 12 }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                                                <input type="checkbox" checked={showTechDetails} onChange={(e) => setShowTechDetails(e.target.checked)} />
                                                Include Technical Specs
                                            </label>
                                        </div>
                                        {showTechDetails && (
                                            <div style={{ padding: 12, background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                <div><label style={labelLabelStyle}>HP / kW</label><input name="motorHP" value={labelData.motorHP} onChange={handleInputChange} style={inputStyle} /></div>
                                                <div><label style={labelLabelStyle}>Voltage</label><input name="voltage" value={labelData.voltage} onChange={handleInputChange} style={inputStyle} /></div>
                                                <div><label style={labelLabelStyle}>RPM</label><input name="rpm" value={labelData.rpm} onChange={handleInputChange} style={inputStyle} /></div>
                                                <div><label style={labelLabelStyle}>Phase</label><input name="phase" value={labelData.phase} onChange={handleInputChange} style={inputStyle} /></div>
                                                <div style={{ gridColumn: 'span 2' }}><label style={labelLabelStyle}>Panel Type</label><input name="panelType" value={labelData.panelType} onChange={handleInputChange} style={inputStyle} /></div>
                                                <div style={{ gridColumn: 'span 2' }}><label style={labelLabelStyle}>Date</label><input type="date" name="mfgDate" value={labelData.mfgDate} onChange={handleInputChange} style={inputStyle} /></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Right Panel: Preview (Single) */}
                                <div style={{ flex: 1, padding: '40px', background: '#F1F5F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
                                    <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                                        <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#1E293B', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                                            <Printer size={18} /> Print Label
                                        </button>
                                        <button onClick={handleDownloadPDF} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'white', color: '#1E293B', border: '1px solid #CBD5E1', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                                            <Download size={18} /> Save PDF
                                        </button>
                                    </div>
                                    <div style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: 0, background: 'white' }}>
                                        <div id="label-preview-area" ref={previewRef}>
                                            <LabelRenderer
                                                labelData={labelData}
                                                labelSize={labelSize}
                                                orientation={orientation}
                                                showTechDetails={showTechDetails}
                                                forcedPartNameSize={partNameSize}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 16, fontSize: '0.8rem', color: '#64748B' }}>Preview Mode • {labelSize.toUpperCase()} • {orientation.toUpperCase()}</div>
                                </div>
                            </div>
                        ) : (
                            // --- BATCH MODE UI ---
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>
                                {/* Toolbar with Enhanced Controls */}
                                <div style={{ padding: '16px 24px', background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        {/* View Toggles */}
                                        <div style={{ display: 'flex', background: '#F1F5F9', padding: 2, borderRadius: 6 }}>
                                            <button onClick={() => setBatchPreviewMode('table')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 4, border: 'none', background: batchPreviewMode === 'table' ? 'white' : 'transparent', color: batchPreviewMode === 'table' ? '#2563EB' : '#64748B', boxShadow: batchPreviewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', fontWeight: 500, cursor: 'pointer' }}><LayoutGrid size={14} /> Table</button>
                                            <button onClick={() => setBatchPreviewMode('sheet')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 4, border: 'none', background: batchPreviewMode === 'sheet' ? 'white' : 'transparent', color: batchPreviewMode === 'sheet' ? '#2563EB' : '#64748B', boxShadow: batchPreviewMode === 'sheet' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', fontWeight: 500, cursor: 'pointer' }}><FileText size={14} /> Sheet</button>
                                        </div>

                                        <div style={{ width: 1, height: 24, background: '#E2E8F0' }} />

                                        {/* Configuration Dropdowns (Visible in Both views, but most relevant for Sheet) */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <label style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>Sheet:</label>
                                                <select value={batchSheetSize} onChange={(e) => setBatchSheetSize(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                    <option value="a4">A4</option>
                                                </select>
                                                <select value={batchSheetOrientation} onChange={(e) => setBatchSheetOrientation(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                    <option value="portrait">Portrait</option>
                                                    <option value="landscape">Landscape</option>
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <label style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>Labels:</label>
                                                <select value={batchLabelSize} onChange={(e) => setBatchLabelSize(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                    <option value="a4">1x A4 (Full)</option>
                                                    <option value="a5">2x A5 (Half)</option>
                                                    <option value="a6">4x A6 (Quarter)</option>
                                                    <option value="sticker">Stickers</option>
                                                </select>
                                            </div>

                                            {/* Font Slider for Batch */}
                                            <div style={{ width: 1, height: 24, background: '#E2E8F0' }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Type size={14} color="#64748B" />
                                                <input type="range" min="50" max="1500" value={batchPartNameSize} onChange={(e) => setBatchPartNameSize(Number(e.target.value))} style={{ width: 80, accentColor: '#2563EB' }} title="Part Name Font Size" />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 12 }}>
                                        {batchPreviewMode === 'table' && (
                                            <button onClick={addBatchRow} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1E40AF', fontWeight: 600, cursor: 'pointer' }}><Plus size={16} /> Add Row</button>
                                        )}
                                        {batchPreviewMode === 'sheet' && (
                                            <button onClick={handleDownloadPDF} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#1E293B', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}><Download size={16} /> Export Sheet PDF</button>
                                        )}
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div id="batch-sheet-preview-container" style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', justifyContent: 'center', background: '#E2E8F0' }}>
                                    {batchPreviewMode === 'table' ? (
                                        <div style={{ width: '100%', maxWidth: '1200px', background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', height: 'fit-content' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                <thead>
                                                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                                                        <th style={{ padding: 12, width: 40 }}>#</th>
                                                        <th style={{ padding: 12 }}>Customer / Plant</th>
                                                        <th style={{ padding: 12, width: '25%' }}>Part Name</th>
                                                        <th style={{ padding: 12 }}>Model No. / Location</th>
                                                        <th style={{ padding: 12, width: 80 }}>Qty</th>
                                                        <th style={{ padding: 12, width: 100 }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {batchRows.map((row, index) => (
                                                        <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                            <td style={{ padding: 12, color: '#94A3B8' }}>{index + 1}</td>
                                                            <td style={{ padding: 12 }}>
                                                                <input value={row.customerName} onChange={(e) => updateBatchRow(row.id, 'customerName', e.target.value)} placeholder="Customer Name" style={{ width: '100%', padding: 6, marginBottom: 4, borderRadius: 4, border: '1px solid #E2E8F0' }} />
                                                                <input value={row.plantName} onChange={(e) => updateBatchRow(row.id, 'plantName', e.target.value)} placeholder="Plant / Project" style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #E2E8F0' }} />
                                                            </td>
                                                            <td style={{ padding: 12 }}>
                                                                <input value={row.partName} onChange={(e) => updateBatchRow(row.id, 'partName', e.target.value)} placeholder="PART NAME" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #E2E8F0', fontWeight: 600 }} />
                                                            </td>
                                                            <td style={{ padding: 12 }}>
                                                                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                                                    <input value={row.modelNumber} onChange={(e) => updateBatchRow(row.id, 'modelNumber', e.target.value)} placeholder="Model No." style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #E2E8F0' }} />
                                                                </div>
                                                                <div style={{ display: 'flex', gap: 4 }}>
                                                                    <input value={row.location} onChange={(e) => updateBatchRow(row.id, 'location', e.target.value)} placeholder="Location" style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #E2E8F0' }} />
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: 12 }}>
                                                                <input type="number" min="1" value={row.qty} onChange={(e) => updateBatchRow(row.id, 'qty', parseInt(e.target.value) || 1)} style={{ width: 60, padding: 6, borderRadius: 4, border: '1px solid #E2E8F0' }} />
                                                            </td>
                                                            <td style={{ padding: 12 }}>
                                                                <div style={{ display: 'flex', gap: 8 }}>
                                                                    <button onClick={() => duplicateBatchRow(row)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: 4 }} title="Duplicate"><CopyIcon size={16} /></button>
                                                                    <button onClick={() => deleteBatchRow(row.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#F87171', padding: 4 }} title="Delete"><Trash2 size={16} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        // SHEET PREVIEW WITH GRID LOGIC
                                        <div
                                            id="batch-sheet-preview"
                                            ref={batchSheetRef}
                                            style={{
                                                background: 'white',
                                                // Grid Settings applied here
                                                ...gridSettings,
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                border: 'none',
                                            }}
                                        >
                                            {/* Render Expanded Labels based on Quantity */}
                                            {batchRows.flatMap(row =>
                                                Array(row.qty).fill(row).map((r, i) => (
                                                    <div key={`${r.id}-${i}`} style={{ width: '100%', height: '100%', overflow: 'hidden', border: '1px dashed #E2E8F0' }}>
                                                        <LabelRenderer
                                                            labelData={r}
                                                            labelSize={batchLabelSize}
                                                            orientation={gridSettings.orientation}
                                                            showTechDetails={false}
                                                            forcedPartNameSize={batchPartNameSize}
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default LabelPrintPlanner;
