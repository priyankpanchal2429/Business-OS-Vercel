import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Printer, Save, ChevronLeft, Plus,
    Trash2, GripVertical, Download, Eye
} from 'lucide-react';
import JobCardPrint from './JobCardPrint';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Sortable Item Components ---

const SortableMachineItem = ({ machine, updateMachine, removeMachine, activeId, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: machine.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginBottom: '24px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div style={{
                background: '#F8FAFC',
                padding: '12px 16px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 12
            }}>
                <div {...attributes} {...listeners} style={{ cursor: 'grab', color: '#94A3B8' }}>
                    <GripVertical size={20} />
                </div>
                <div style={{ flex: 1, display: 'flex', gap: 16 }}>
                    <input
                        value={machine.type}
                        onChange={(e) => updateMachine(machine.id, 'type', e.target.value)}
                        placeholder="Machine Name (e.g. Lathe)"
                        style={{
                            flex: 2,
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            fontSize: '1rem',
                            fontWeight: 600
                        }}
                    />
                    <input
                        value={machine.model}
                        onChange={(e) => updateMachine(machine.id, 'model', e.target.value)}
                        placeholder="Model / Serial No."
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            fontSize: '1rem'
                        }}
                    />
                </div>
                <button
                    onClick={() => removeMachine(machine.id)}
                    style={{
                        padding: 8,
                        color: '#EF4444',
                        background: '#FEF2F2',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer'
                    }}
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div style={{ padding: '16px' }}>
                {children}
            </div>
        </div>
    );
};

const SortablePartItem = ({ part, updatePart, removePart }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: part.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'grid',
        gridTemplateColumns: '40px 2fr 1fr 1fr 80px 40px',
        gap: 12,
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #F1F5F9',
        background: 'white'
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div {...attributes} {...listeners} style={{ cursor: 'grab', color: '#CBD5E1', display: 'flex', alignItems: 'center' }}>
                <GripVertical size={16} />
            </div>
            <input
                value={part.name}
                onChange={(e) => updatePart(part.guid, 'name', e.target.value)}
                placeholder="Part Name"
                style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 600, outline: 'none', fontSize: '0.9rem', color: '#334155' }}
            />
            <input
                value={part.model}
                onChange={(e) => updatePart(part.guid, 'model', e.target.value)}
                placeholder="Model"
                style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'right', outline: 'none', color: '#64748B', fontSize: '0.9rem' }}
            />
            <input
                value={part.size}
                onChange={(e) => updatePart(part.guid, 'size', e.target.value)}
                placeholder="Size"
                style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'right', outline: 'none', color: '#64748B', fontSize: '0.9rem' }}
            />
            <input
                value={part.qty}
                onChange={(e) => updatePart(part.guid, 'qty', e.target.value)}
                placeholder="0"
                type="number"
                style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 4, padding: '4px', textAlign: 'center', outline: 'none', fontWeight: 600, fontSize: '0.9rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={() => removePart(part.guid)}
                    style={{ border: 'none', background: 'white', cursor: 'pointer', color: '#EF4444', padding: 6, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Remove Part"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}


// --- Main Editor Component ---

const JobCardEditor = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState(initialData);
    const [showPreview, setShowPreview] = useState(false);
    const printRef = React.useRef();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // -- Handlers --

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

    // Machine DnD Wrappers
    const handleDragEndMachines = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setFormData((prev) => {
                const oldIndex = prev.machines.findIndex((m) => m.id === active.id);
                const newIndex = prev.machines.findIndex((m) => m.id === over.id);
                return {
                    ...prev,
                    machines: arrayMove(prev.machines, oldIndex, newIndex),
                };
            });
        }
    };

    // Part DnD Wrapper needs to know which machine it belongs to.
    // Simplifying: We will render a SortableContext for EACH machine's parts.
    // We need a specific handler per machine or a smart global one. 
    // Let's go with a specific handler factory for simplicity/robustness.

    const onDragEndParts = (machineId) => (event) => {
        const { active, over } = event;
        if (!over) return;
        if (active.id !== over.id) {
            setFormData(prev => ({
                ...prev,
                machines: prev.machines.map(m => {
                    if (m.id !== machineId) return m;
                    const oldIndex = m.parts.findIndex(p => p.id === active.id);
                    const newIndex = m.parts.findIndex(p => p.id === over.id);
                    return { ...m, parts: arrayMove(m.parts, oldIndex, newIndex) };
                })
            }));
        }
    }


    // CRUD
    const addMachine = () => {
        setFormData(prev => ({
            ...prev,
            machines: [
                ...prev.machines,
                {
                    id: `m-${Date.now()}`,
                    type: '',
                    model: '',
                    parts: [{
                        id: `p-${Date.now()}`,
                        guid: `g-${Date.now()}`,
                        name: '',
                        model: '',
                        size: '',
                        qty: 1
                    }]
                }
            ]
        }));
    };

    const updateMachine = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            machines: prev.machines.map(m => m.id === id ? { ...m, [field]: value } : m)
        }));
    }

    const removeMachine = (id) => {
        setFormData(prev => ({
            ...prev,
            machines: prev.machines.filter(m => m.id !== id)
        }));
    }

    const addPart = (machineId) => {
        setFormData(prev => ({
            ...prev,
            machines: prev.machines.map(m =>
                m.id === machineId
                    ? {
                        ...m,
                        parts: [
                            ...m.parts,
                            {
                                id: `p-${Date.now()}`,
                                guid: `g-${Date.now()}`,
                                name: '',
                                model: '',
                                size: '',
                                qty: 1
                            }
                        ]
                    }
                    : m
            )
        }));
    }

    const updatePart = (machineId, partGuid, field, value) => {
        setFormData(prev => ({
            ...prev,
            machines: prev.machines.map(m =>
                m.id === machineId
                    ? { ...m, parts: m.parts.map(p => p.guid === partGuid ? { ...p, [field]: value } : p) }
                    : m
            )
        }));
    }

    const removePart = (machineId, partGuid) => {
        setFormData(prev => ({
            ...prev,
            machines: prev.machines.map(m =>
                m.id === machineId
                    ? { ...m, parts: m.parts.filter(p => p.guid !== partGuid) }
                    : m
            )
        }));
    }

    // Print & PDF
    const handlePrint = () => {
        // We need to print ONLY the JobCardPrint component.
        // The easiest way is to use the native print, but we need to ensure 
        // the Editor is hidden and the Print component is visible in CSS.
        // However, in our architecture, we might just rely on the 'showPreview' mode 
        // effectively being the print view, OR we mount the component hidden.

        // Better approach: temporarily mount a full screen print view or open a new window.
        // Or simpler: Use standard window.print() but use CSS to hide .editor-ui and show .print-ui
        window.print();
    };


    const handleDownloadPDF = async () => {
        const element = printRef.current;
        if (!element) return;

        // Temporarily ensure it's visible for capture if hidden
        const wasHidden = element.style.display === 'none';
        if (wasHidden) {
            element.style.display = 'block';
            element.style.position = 'absolute';
            element.style.left = '-9999px';
        }

        const canvas = await html2canvas(element, { scale: 2, useCORS: true });

        if (wasHidden) {
            element.style.display = 'none';
            element.style.position = '';
            element.style.left = '';
        }

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`JobCard_${formData.jobNo}.pdf`);
    };


    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F1F5F9' }}>
            {/* Toolbar */}
            <div className="print:hidden" style={{
                padding: '16px 24px',
                background: 'white',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <button onClick={onCancel} style={{ background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 8, padding: 8, cursor: 'pointer' }}>
                        <ChevronLeft size={20} color="#64748B" />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{formData.jobNo}</h2>
                        <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Editing Mode</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: showPreview ? '#EFF6FF' : 'white', border: showPreview ? '1px solid #2563EB' : '1px solid #CBD5E1', borderRadius: 8, color: showPreview ? '#2563EB' : '#334155', fontWeight: 600, cursor: 'pointer' }}
                    >
                        <Eye size={18} /> {showPreview ? 'Edit Data' : 'Preview'}
                    </button>
                    <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'white', border: '1px solid #CBD5E1', borderRadius: 8, color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
                        <Printer size={18} /> Print
                    </button>
                    <button onClick={handleDownloadPDF} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'white', border: '1px solid #CBD5E1', borderRadius: 8, color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
                        <Download size={18} /> PDF
                    </button>
                    <button onClick={() => onSave(formData)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                        <Save size={18} /> Save
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

                {/* Editor Panel */}
                <div className="print:hidden" style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '32px',
                    display: showPreview ? 'none' : 'block',
                    maxWidth: '1000px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    {/* General Info Card */}
                    <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '1rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                            General Information
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 6 }}>Job No</label>
                                <input name="jobNo" value={formData.jobNo} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #CBD5E1', fontWeight: 600 }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 6 }}>Date</label>
                                <input type="date" name="jobDate" value={formData.jobDate} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #CBD5E1' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 6 }}>Customer Name</label>
                                <input name="customerName" value={formData.customerName} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #CBD5E1' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 6 }}>Plant / Project</label>
                                <input name="plantName" value={formData.plantName} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #CBD5E1' }} />
                            </div>
                        </div>

                        {/* Order Details Mini-Grid */}
                        <div>
                            <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 6 }}>Order Details</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                                {formData.orderDetails && formData.orderDetails.map((item, index) => (
                                    <div key={index} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 8 }}>
                                        <input
                                            value={item.name}
                                            onChange={(e) => updateOrderDetail(index, 'name', e.target.value)}
                                            placeholder="Name"
                                            style={{ width: '100%', fontSize: '0.85rem', fontWeight: 600, border: 'none', marginBottom: 4, background: 'transparent' }}
                                        />
                                        <input
                                            value={item.model}
                                            onChange={(e) => updateOrderDetail(index, 'model', e.target.value)}
                                            placeholder="Model"
                                            style={{ width: '100%', fontSize: '0.8rem', color: '#64748B', border: 'none', background: 'transparent' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Machines Draggable List */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#1E293B' }}>Machines & Parts</h3>
                            <button onClick={addMachine} style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Plus size={16} /> Add Machine
                            </button>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEndMachines}
                        >
                            <SortableContext
                                items={formData.machines.map(m => m.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {formData.machines.map(machine => (
                                    <SortableMachineItem
                                        key={machine.id}
                                        machine={machine}
                                        activeId={null}
                                        updateMachine={updateMachine}
                                        removeMachine={removeMachine}
                                    >
                                        {/* Nested Parts List */}
                                        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                                            {/* Table Header */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1fr 80px 40px', gap: 12, padding: '8px 12px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                                                <div></div>
                                                <div>Part Name</div>
                                                <div style={{ textAlign: 'right' }}>Model</div>
                                                <div style={{ textAlign: 'right' }}>Size</div>
                                                <div style={{ textAlign: 'right' }}>Qty</div>
                                                <div></div>
                                            </div>

                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={onDragEndParts(machine.id)}
                                            >
                                                <SortableContext
                                                    items={machine.parts.map(p => p.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        {machine.parts.map(part => (
                                                            <SortablePartItem
                                                                key={part.id}
                                                                part={part}
                                                                updatePart={(guid, field, val) => updatePart(machine.id, guid, field, val)}
                                                                removePart={(guid) => removePart(machine.id, guid)}
                                                            />
                                                        ))}
                                                        {machine.parts.length === 0 && (
                                                            <div style={{ padding: 20, textAlign: 'center', color: '#CBD5E1', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                                                No parts added.
                                                            </div>
                                                        )}
                                                    </div>
                                                </SortableContext>
                                            </DndContext>

                                            {/* Footer Add Button */}
                                            <div style={{ padding: '8px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                                                <button
                                                    onClick={() => addPart(machine.id)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px dashed #CBD5E1',
                                                        background: 'white',
                                                        color: '#2563EB',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        borderRadius: 6,
                                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6
                                                    }}
                                                >
                                                    <Plus size={16} /> Add Part
                                                </button>
                                            </div>
                                        </div>
                                    </SortableMachineItem>
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>

                </div>

                {/* Preview Panel - Visible when showPreview is true OR when printing */}
                <div
                    className={showPreview ? '' : 'hidden-on-screen'} // We use a class to hide it on screen but allow print if needed
                    style={{
                        flex: showPreview ? 1 : undefined,
                        display: showPreview ? 'flex' : undefined,
                        justifyContent: 'center',
                        background: '#525252',
                        padding: '40px',
                        overflowY: 'auto',
                        // If hidden, hide it visually but keep it in DOM for PDF generation references if necessary
                        ...(showPreview ? {} : { position: 'absolute', top: 0, left: '-9999px', width: '210mm' })
                    }}
                >
                    <div className="print-container">
                        <JobCardPrint ref={printRef} data={formData} />
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    .hidden-on-screen { position: static !important; left: auto !important; display: block !important; }
                    .print-container { display: block !important; width: 100%; }
                    body { margin: 0; background: white; }
                }
            `}</style>
        </div>
    );
};

export default JobCardEditor;
