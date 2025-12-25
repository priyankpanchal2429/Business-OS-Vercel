import React, { useState, useRef } from 'react';
import {
    Printer, Download, Save, Plus, Trash2, Copy, FileText,
    Search, ChevronLeft, Briefcase, Filter, MoreHorizontal,
    Hexagon
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const JobCard = () => {
    const [view, setView] = useState('list');
    const [history, setHistory] = useState([
        { id: 101, jobNo: 'JC-2024-001', date: '2024-12-20', customer: 'Acme Corp', plant: 'Plant A', status: 'Completed' },
    ]);

    // Initial Empty State for New Job
    const initialFormState = {
        id: '',
        jobNo: `JC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        jobDate: new Date().toISOString().split('T')[0],
        customerName: '',
        plantName: '',
        status: 'Draft',
        orderDetails: Array(5).fill(null).map((_, i) => ({ id: i, name: '', model: '' })),
        machines: [
            {
                id: Date.now(),
                type: '',
                model: '',
                parts: [
                    { id: Date.now() + 1, name: '', model: '', size: '', qty: 1 }
                ]
            }
        ]
    };

    const [formData, setFormData] = useState(initialFormState);
    const printRef = useRef();

    // --- Actions ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const updateOrderDetail = (index, field, value) => {
        setFormData(prev => {
            const newDetails = [...prev.orderDetails];
            newDetails[index] = { ...newDetails[index], [field]: value };
            return { ...prev, orderDetails: newDetails };
        });
    };

    const addOrderDetailRow = () => {
        setFormData(prev => ({
            ...prev,
            orderDetails: [...prev.orderDetails, ...Array(5).fill(null).map((_, i) => ({ id: Date.now() + i, name: '', model: '' }))]
        }));
    };

    // Machine Actions
    const addMachine = () => {
        setFormData(prev => ({
            ...prev,
            machines: [
                ...prev.machines,
                {
                    id: Date.now(),
                    type: '',
                    model: '',
                    parts: [{ id: Date.now() + 1, name: '', model: '', size: '', qty: 1 }]
                }
            ]
        }));
    };

    const updateMachine = (machineId, field, value) => {
        setFormData(prev => ({
            ...prev,
            machines: prev.machines.map(m => m.id === machineId ? { ...m, [field]: value } : m)
        }));
    };

    const removeMachine = (machineId) => {
        if (formData.machines.length > 1) {
            setFormData(prev => ({
                ...prev,
                machines: prev.machines.filter(m => m.id !== machineId)
            }));
        }
    };

    // Part Actions
    const addPart = (machineId) => {
        setFormData(prev => ({
            ...prev,
            machines: prev.machines.map(m =>
                m.id === machineId
                    ? { ...m, parts: [...m.parts, { id: Date.now(), name: '', model: '', size: '', qty: 1 }] }
                    : m
            )
        }));
    };

    const updatePart = (machineId, partId, field, value) => {
        setFormData(prev => ({
            ...prev,
            machines: prev.machines.map(m =>
                m.id === machineId
                    ? { ...m, parts: m.parts.map(p => p.id === partId ? { ...p, [field]: value } : p) }
                    : m
            )
        }));
    };

    const removePart = (machineId, partId) => {
        setFormData(prev => ({
            ...prev,
            machines: prev.machines.map(m =>
                m.id === machineId
                    ? { ...m, parts: m.parts.length > 1 ? m.parts.filter(p => p.id !== partId) : m.parts }
                    : m
            )
        }));
    };

    const handleSave = () => {
        // Mock Save logic
        const newRecord = { ...formData, id: formData.id || Date.now() };
        setHistory(prev => [newRecord, ...prev.filter(p => p.id !== newRecord.id)]);
        setView('list');
    };

    const handleNewJob = () => {
        setFormData(initialFormState);
        setView('edit');
    };

    const handleEdit = (record) => {
        const fullRecord = record.machines ? { ...record, orderDetails: record.orderDetails || initialFormState.orderDetails } : {
            ...record,
            machines: initialFormState.machines,
            orderDetails: initialFormState.orderDetails
        };
        setFormData(fullRecord);
        setView('edit');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        const element = printRef.current;
        if (!element) return;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`JobCard_${formData.jobNo}.pdf`);
    };

    // --- Render ---
    if (view === 'list') {
        return (
            <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Briefcase size={28} color="#2563EB" /> Job Cards
                        </h1>
                        <p style={{ color: '#64748B' }}>Manage manufacturing jobs usage tracking.</p>
                    </div>
                    <button onClick={handleNewJob} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                        <Plus size={18} /> New Job Card
                    </button>
                </div>

                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: 16, color: '#64748B', fontWeight: 600 }}>Job No</th>
                                <th style={{ padding: 16, color: '#64748B', fontWeight: 600 }}>Date</th>
                                <th style={{ padding: 16, color: '#64748B', fontWeight: 600 }}>Customer / Plant</th>
                                <th style={{ padding: 16, color: '#64748B', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: 16, color: '#64748B', fontWeight: 600 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(job => (
                                <tr key={job.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: 16, fontWeight: 600 }}>{job.jobNo}</td>
                                    <td style={{ padding: 16, color: '#64748B' }}>{new Date(job.date).toLocaleDateString('en-GB')}</td>
                                    <td style={{ padding: 16 }}>{job.customer} <span style={{ color: '#94A3B8' }}>• {job.plant}</span></td>
                                    <td style={{ padding: 16 }}><span style={{ padding: '4px 8px', borderRadius: 4, background: '#F1F5F9', fontSize: '0.85rem' }}>{job.status}</span></td>
                                    <td style={{ padding: 16 }}><button onClick={() => handleEdit(job)} style={{ color: '#2563EB', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Open</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // --- EDITOR / PRINT VIEW ---
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8FAFC' }}>
            {/* Sticky Toolbar */}
            <div style={{ padding: '16px 24px', background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => setView('list')} style={{ background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 8, padding: 8, cursor: 'pointer' }}>
                        <ChevronLeft size={20} color="#64748B" />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{formData.jobNo}</h2>
                        <span style={{ fontSize: '0.85rem', color: '#64748B' }}>{formData.status} • {formData.machines.length} Machines</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'white', border: '1px solid #CBD5E1', borderRadius: 8, color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
                        <Printer size={18} /> Print
                    </button>
                    <button onClick={handleDownloadPDF} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'white', border: '1px solid #CBD5E1', borderRadius: 8, color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
                        <Download size={18} /> PDF
                    </button>
                    <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                        <Save size={18} /> Save
                    </button>
                </div>
            </div>

            {/* Scrollable Canvas */}
            <div style={{ flex: 1, overflow: 'auto', padding: '40px', display: 'flex', justifyContent: 'center' }}>
                <div
                    ref={printRef}
                    className="job-card-print"
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        background: 'white',
                        padding: '40px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        position: 'relative'
                    }}
                >
                    {/* 1. Header Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: 20 }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Job Card</div>
                            <input
                                name="jobNo"
                                value={formData.jobNo}
                                onChange={handleInputChange}
                                style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E293B', margin: 0, lineHeight: 1, border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                            />
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8, minWidth: '200px' }}>
                            <input
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleInputChange}
                                placeholder="Customer Name"
                                style={{ textAlign: 'right', fontSize: '1.2rem', fontWeight: 700, color: '#1E293B', border: 'none', background: 'transparent', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
                                <input
                                    name="plantName"
                                    value={formData.plantName}
                                    onChange={handleInputChange}
                                    placeholder="Plant / Project"
                                    style={{ textAlign: 'right', fontSize: '0.9rem', color: '#64748B', border: 'none', background: 'transparent', width: '150px' }}
                                />
                                <span style={{ color: '#E2E8F0' }}>|</span>
                                <div style={{ position: 'relative', minWidth: '90px' }}>
                                    {/* Visible Formatted Text */}
                                    <span style={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: 0,
                                        transform: 'translateY(-50%)',
                                        fontSize: '0.9rem',
                                        color: '#64748B',
                                        pointerEvents: 'none',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {formData.jobDate ? new Date(formData.jobDate).toLocaleDateString('en-GB') : 'DD/MM/YYYY'}
                                    </span>

                                    {/* Invisible Click Target */}
                                    <input
                                        type="date"
                                        name="jobDate"
                                        value={formData.jobDate}
                                        onChange={handleInputChange}
                                        style={{
                                            opacity: 0,
                                            position: 'relative',
                                            zIndex: 10,
                                            width: '100%',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem' // Match size to ensure alignment
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Order Details Grid (5 Cols) */}
                    <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#1E293B', marginBottom: 12, letterSpacing: '0.05em' }}>Order Details</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                            {formData.orderDetails && formData.orderDetails.map((item, index) => (
                                <div key={index} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <input
                                        value={item.name}
                                        onChange={(e) => updateOrderDetail(index, 'name', e.target.value)}
                                        placeholder="Machine Name"
                                        style={{ width: '100%', fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', border: 'none', marginBottom: 4, outline: 'none', background: 'transparent' }}
                                    />
                                    <input
                                        value={item.model}
                                        onChange={(e) => updateOrderDetail(index, 'model', e.target.value)}
                                        placeholder="Model / Serial"
                                        style={{ width: '100%', fontSize: '0.8rem', color: '#64748B', border: 'none', outline: 'none', background: 'transparent' }}
                                    />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addOrderDetailRow}
                            className="print:hidden"
                            style={{ marginTop: 12, fontSize: '0.8rem', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                            <Plus size={14} /> Add Rows
                        </button>
                    </div>

                    {/* 3. Machines List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {formData.machines.map((machine, mIndex) => (
                            <div key={machine.id} style={{ breakInside: 'avoid' }}>
                                {/* Machine Title Bar - Deep Blue */}
                                <div style={{
                                    background: '#2563EB',
                                    borderRadius: '8px',
                                    padding: '12px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 20,
                                    color: 'white',
                                    marginBottom: '10px',
                                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 3 }}>
                                        <label style={{ fontSize: '0.65rem', opacity: 0.9, textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Machine Name</label>
                                        <input
                                            className="white-placeholder"
                                            value={machine.type}
                                            onChange={(e) => updateMachine(machine.id, 'type', e.target.value)}
                                            placeholder="e.g. Grinder"
                                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.1rem', fontWeight: 700, width: '100%', outline: 'none', padding: 0 }}
                                        />
                                    </div>
                                    <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.3)' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'flex-end' }}>
                                        <label style={{ fontSize: '0.65rem', opacity: 0.9, textTransform: 'uppercase', fontWeight: 600, marginBottom: 2, width: '100%', textAlign: 'right' }}>Model No.</label>
                                        <input
                                            className="white-placeholder"
                                            value={machine.model}
                                            onChange={(e) => updateMachine(machine.id, 'model', e.target.value)}
                                            placeholder="e.g. REG"
                                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1rem', fontWeight: 600, width: '100%', outline: 'none', padding: 0, textAlign: 'right' }}
                                        />
                                    </div>

                                    {/* Remove Machine Action (Hidden in print) */}
                                    <button
                                        onClick={() => removeMachine(machine.id)}
                                        className="print:hidden"
                                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: 6, cursor: 'pointer', color: 'white', marginLeft: 'auto' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Parts Table */}
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, width: '55%' }}>Part Name</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, width: '15%' }}>Model No</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, width: '15%' }}>Size</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, width: '15%' }}>QTY</th>
                                            <th className="print:hidden" style={{ width: 40 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {machine.parts.map((part) => (
                                            <tr key={part.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                <td style={{ padding: '8px 4px' }}>
                                                    <input
                                                        value={part.name}
                                                        onChange={(e) => updatePart(machine.id, part.id, 'name', e.target.value)}
                                                        placeholder="Part Name"
                                                        style={{ width: '100%', padding: '4px 8px', border: 'none', fontWeight: 600, color: '#334155', outline: 'none' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px 4px' }}>
                                                    <input
                                                        value={part.model}
                                                        onChange={(e) => updatePart(machine.id, part.id, 'model', e.target.value)}
                                                        placeholder="Model"
                                                        style={{ width: '100%', padding: '4px 8px', border: 'none', color: '#64748B', outline: 'none', textAlign: 'right' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px 4px' }}>
                                                    <input
                                                        value={part.size}
                                                        onChange={(e) => updatePart(machine.id, part.id, 'size', e.target.value)}
                                                        placeholder="Size"
                                                        style={{ width: '100%', padding: '4px 8px', border: 'none', color: '#64748B', outline: 'none', textAlign: 'right' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px 4px' }}>
                                                    <input
                                                        value={part.qty}
                                                        onChange={(e) => updatePart(machine.id, part.id, 'qty', e.target.value)}
                                                        style={{ width: '100%', padding: '4px 12px', border: 'none', textAlign: 'right', fontWeight: 600, outline: 'none' }}
                                                    />
                                                </td>
                                                <td className="print:hidden" style={{ textAlign: 'right' }}>
                                                    <button onClick={() => removePart(machine.id, part.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button
                                    onClick={() => addPart(machine.id)}
                                    className="print:hidden"
                                    style={{ marginTop: 8, fontSize: '0.8rem', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                    <Plus size={14} /> Add Part
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Machine Button (Hidden in Print) */}
                    <div className="print:hidden" style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                        <button
                            onClick={addMachine}
                            style={{ padding: '12px 24px', background: 'white', border: '1px dashed #CBD5E1', borderRadius: 8, color: '#64748B', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <Plus size={18} /> Add Another Machine Section
                        </button>
                    </div>

                    {/* 3. Footer */}
                    <div style={{ marginTop: 'auto', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, background: '#1E3A8A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <Hexagon size={20} fill="#1E3A8A" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B' }}>BusinessOS</div>
                                <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Engineering</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                            {new Date().toLocaleDateString('en-GB')}
                        </div>
                    </div>

                    <style>{`
                        .white-placeholder::placeholder {
                            color: rgba(255, 255, 255, 0.7) !important;
                            opacity: 1;
                        }
                            .show-on-print { display: block !important; }
                        }
                        @media print {
                            @page { margin: 0; size: A4; }
                            body { -webkit-print-color-adjust: exact; background: white; }
                            aside, nav, .print\\:hidden, button { display: none !important; }
                            .job-card-print {
                                box-shadow: none !important;
                                margin: 0 !important;
                                padding: 20px 40px !important;
                                width: 100% !important;
                                position: absolute; left: 0; top: 0;
                            }
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

export default JobCard;
