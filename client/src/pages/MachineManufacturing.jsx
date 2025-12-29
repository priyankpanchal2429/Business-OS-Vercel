import React, { useState, useEffect, useRef } from 'react';
import {
    Factory, Plus, AlertCircle, CheckCircle2, Clock, Calendar,
    Printer, ArrowLeft, MoreHorizontal, TrendingUp, AlertTriangle,
    User, MapPin, ChevronRight, X, Trash2
} from 'lucide-react';

const MachineManufacturing = () => {
    // --- State ---
    const [machines, setMachines] = useState(() => {
        const saved = localStorage.getItem('manufacturing_machines');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Form State for Add/Edit
    const [formData, setFormData] = useState({
        name: '',
        model: '',
        customer: '',
        orderDate: '',
        startDate: '',
        deliveryDate: '',
        estimatedDays: '',
        supervisor: '',
        workers: ''
    });

    // Daily Update State
    const [dailyUpdate, setDailyUpdate] = useState({
        progress: '',
        remarks: ''
    });

    // --- Persist Data ---
    useEffect(() => {
        localStorage.setItem('manufacturing_machines', JSON.stringify(machines));
    }, [machines]);

    // --- Helpers ---
    const calculateDaysLeft = (deliveryDate) => {
        if (!deliveryDate) return 0;
        const today = new Date();
        const due = new Date(deliveryDate);
        const diffTime = due - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getStatusColor = (machine) => {
        const daysLeft = calculateDaysLeft(machine.deliveryDate);
        if (daysLeft < 0) return '#EF4444'; // Red - Delayed
        if (daysLeft < 5) return '#F59E0B'; // Orange - Risk
        return '#10B981'; // Green - On Track
    };

    const STAGES = [
        'Fabrication',
        'Assembly',
        'Electrical',
        'Testing',
        'Finishing / Dispatch'
    ];

    // --- Handlers ---
    const handleAddMachine = (e) => {
        e.preventDefault();
        const newMachine = {
            id: Date.now().toString(),
            ...formData,
            overallProgress: 0,
            currentStage: 'Fabrication',
            updates: [], // Audit trail
            createdAt: new Date().toISOString()
        };
        setMachines([newMachine, ...machines]);
        setShowAddModal(false);
        setFormData({
            name: '', model: '', customer: '', orderDate: '',
            startDate: '', deliveryDate: '', estimatedDays: '',
            supervisor: '', workers: ''
        });
    };

    const handleDailyUpdate = (e) => {
        e.preventDefault();
        if (!selectedMachine || !dailyUpdate.progress) return;

        const updatedMachines = machines.map(m => {
            if (m.id === selectedMachine.id) {
                const newProgress = Math.min(100, Math.max(0, parseInt(dailyUpdate.progress)));
                return {
                    ...m,
                    overallProgress: newProgress,
                    currentStage: dailyUpdate.stage || m.currentStage, // Update stage if selected
                    updates: [
                        {
                            date: new Date().toISOString(),
                            progress: newProgress,
                            stage: dailyUpdate.stage || m.currentStage,
                            remarks: dailyUpdate.remarks
                        },
                        ...m.updates
                    ]
                };
            }
            return m;
        });

        setMachines(updatedMachines);
        setSelectedMachine(updatedMachines.find(m => m.id === selectedMachine.id));
        setDailyUpdate({ progress: '', remarks: '', stage: '' }); // Reset
    };

    const handleDeleteMachine = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (!selectedMachine) return;
        const updated = machines.filter(m => m.id !== selectedMachine.id);
        setMachines(updated);
        setSelectedMachine(null);
        setShowDeleteConfirm(false);
    };

    // --- Components ---

    const ProgressBar = ({ percent }) => (
        <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
                width: `${percent}%`,
                height: '100%',
                background: percent >= 100 ? '#10B981' : 'var(--color-accent)',
                transition: 'width 0.5s ease'
            }} />
        </div>
    );

    // --- Views ---

    // 1. Worker Print View
    const PrintView = ({ machine }) => {
        const daysLeft = calculateDaysLeft(machine.deliveryDate);
        return (
            <div className="print-sheet print-only" style={{ display: 'none' }}>
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        .print-sheet, .print-sheet * { visibility: visible; }
                        .print-sheet { 
                            display: block !important;
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 100%; 
                            padding: 40px;
                            font-family: sans-serif;
                            color: black;
                        }
                        .no-print { display: none !important; }
                    }
                `}</style>
                <div style={{ border: '2px solid black', padding: 20 }}>
                    <div style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: 20, marginBottom: 20 }}>
                        <h1 style={{ margin: 0, textTransform: 'uppercase' }}>Daily Work Sheet</h1>
                        <p style={{ margin: '8px 0 0 0' }}>Machine Manufacturing Progress</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
                        <div>
                            <strong>Machine:</strong> <br />
                            <span style={{ fontSize: '1.2rem' }}>{machine.name}</span>
                        </div>
                        <div>
                            <strong>Model:</strong> <br />
                            <span style={{ fontSize: '1.2rem' }}>{machine.model}</span>
                        </div>
                        <div>
                            <strong>Current Stage:</strong> <br />
                            <span style={{ fontSize: '1.2rem' }}>{machine.currentStage}</span>
                        </div>
                        <div>
                            <strong>Progress:</strong> <br />
                            <span style={{ fontSize: '1.2rem' }}>{machine.overallProgress}%</span>
                        </div>
                    </div>

                    <div style={{ border: '1px solid black', padding: 15, marginBottom: 30 }}>
                        <h3 style={{ marginTop: 0 }}>Target & Deadlines</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                Delivery Date: <strong>{new Date(machine.deliveryDate).toLocaleDateString()}</strong>
                            </div>
                            <div>
                                Days Remaining: <strong>{daysLeft} days</strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 40 }}>
                        <h3>Today's Task Instructions:</h3>
                        <div style={{ borderBottom: '1px solid black', height: 40, marginBottom: 20 }}></div>
                        <div style={{ borderBottom: '1px solid black', height: 40, marginBottom: 20 }}></div>
                        <div style={{ borderBottom: '1px solid black', height: 40, marginBottom: 20 }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 100 }}>
                        <div>
                            <div style={{ borderTop: '1px solid black', width: 200, paddingTop: 8 }}>Worker Signature</div>
                        </div>
                        <div>
                            <div style={{ borderTop: '1px solid black', width: 200, paddingTop: 8 }}>Supervisor Signature</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // 2. Dashboard View
    if (!selectedMachine) {
        const stats = {
            total: machines.length,
            onTrack: machines.filter(m => calculateDaysLeft(m.deliveryDate) >= 5).length,
            delayed: machines.filter(m => calculateDaysLeft(m.deliveryDate) < 5).length
        };

        return (
            <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: '#1E293B' }}>Manufacturing Progress</h1>
                        <p style={{ color: '#64748B', marginTop: 4 }}>Track shop floor production and deadlines.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            background: '#1E293B', color: 'white', border: 'none',
                            padding: '12px 24px', borderRadius: 8, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'
                        }}
                    >
                        <Plus size={20} /> Add Machine
                    </button>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
                    <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: '#F1F5F9', p: 12, borderRadius: 8, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Factory size={24} color="#64748B" />
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1E293B' }}>{stats.total}</div>
                            <div style={{ color: '#64748B', fontSize: '0.9rem' }}>Active Machines</div>
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: '#ECFDF5', p: 12, borderRadius: 8, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={24} color="#10B981" />
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1E293B' }}>{stats.onTrack}</div>
                            <div style={{ color: '#64748B', fontSize: '0.9rem' }}>On Track</div>
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: '#FFF7ED', p: 12, borderRadius: 8, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertCircle size={24} color="#F59E0B" />
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1E293B' }}>{stats.delayed}</div>
                            <div style={{ color: '#64748B', fontSize: '0.9rem' }}>Delayed / At Risk</div>
                        </div>
                    </div>
                </div>

                {/* Machines Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
                    {machines.map(machine => {
                        const daysLeft = calculateDaysLeft(machine.deliveryDate);
                        const statusColor = getStatusColor(machine);

                        return (
                            <div key={machine.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <div style={{ padding: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1E293B' }}>{machine.name}</h3>
                                            <div style={{ color: '#64748B', fontSize: '0.9rem', marginTop: 4 }}>{machine.model}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: statusColor }}>{daysLeft}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Days Left</div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>
                                            <span>Progress</span>
                                            <span>{machine.overallProgress}%</span>
                                        </div>
                                        <ProgressBar percent={machine.overallProgress} />
                                    </div>

                                    <div style={{ display: 'flex', gap: 12, padding: '12px', background: '#F8FAFC', borderRadius: 8, fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <User size={14} color="#64748B" />
                                            <span style={{ color: '#64748B' }}>Supervisor:</span>
                                            <span style={{ fontWeight: 600 }}>{machine.supervisor || 'Unassigned'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px solid #E2E8F0', padding: '12px 24px', background: '#FAFAFA' }}>
                                    <button
                                        onClick={() => setSelectedMachine(machine)}
                                        style={{ width: '100%', padding: '10px', background: 'white', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                    >
                                        View Details <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Add Modal */}
                {showAddModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'white', padding: 32, borderRadius: 16, width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>New Machine Order</h2>
                            <form onSubmit={handleAddMachine} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <input required placeholder="Machine Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
                                <input required placeholder="Model Number" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} style={inputStyle} />
                                <input required placeholder="Customer Name" value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value })} style={inputStyle} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.9rem', fontWeight: 500 }}>
                                        Order Date
                                        <input required type="date" value={formData.orderDate} onChange={e => setFormData({ ...formData, orderDate: e.target.value })} style={inputStyle} />
                                    </label>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.9rem', fontWeight: 500 }}>
                                        Target Delivery
                                        <input required type="date" value={formData.deliveryDate} onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })} style={inputStyle} />
                                    </label>
                                </div>
                                <input required placeholder="Assigned Supervisor" value={formData.supervisor} onChange={e => setFormData({ ...formData, supervisor: e.target.value })} style={inputStyle} />
                                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                    <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                    <button type="submit" style={{ flex: 1, padding: 12, background: '#1E293B', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Create Order</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}


            </div>
        );
    }

    // 3. Detail View
    const daysLeft = calculateDaysLeft(selectedMachine.deliveryDate);
    const statusColor = getStatusColor(selectedMachine);

    return (
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
            <button onClick={() => setSelectedMachine(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontWeight: 600, marginBottom: 24 }}>
                <ArrowLeft size={20} /> Back to Dashboard
            </button>

            {/* Detail Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>

                {/* Left: Main Progress */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ background: 'white', borderRadius: 12, padding: 32, border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div>
                                <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#1E293B' }}>{selectedMachine.name}</h1>
                                <p style={{ fontSize: '1.1rem', color: '#64748B', marginTop: 8 }}>Model: {selectedMachine.model}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: statusColor, lineHeight: 1 }}>{daysLeft}</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginTop: 4 }}>Days Remaining</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 40 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'flex-end' }}>
                                <span style={{ fontWeight: 600, fontSize: '1.2rem' }}>Total Progress</span>
                                <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#1E293B' }}>{selectedMachine.overallProgress}%</span>
                            </div>
                            <div style={{ height: 16, background: '#F1F5F9', borderRadius: 8, overflow: 'hidden' }}>
                                <div style={{ width: `${selectedMachine.overallProgress}%`, height: '100%', background: statusColor, transition: 'width 0.5s ease' }} />
                            </div>
                        </div>

                        {/* Stages */}
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24 }}>Manufacturing Stages</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {STAGES.map((stage, i) => (
                                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#F8FAFC', borderRadius: 8 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: selectedMachine.currentStage === stage ? 'var(--color-accent)' : '#CBD5E1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{i + 1}</div>
                                    <div style={{ fontWeight: 600, color: '#1E293B', flex: 1 }}>{stage}</div>
                                    {selectedMachine.currentStage === stage && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', background: 'rgba(0,113,227,0.1)', padding: '4px 8px', borderRadius: 4 }}>Current Stage</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Audit Trail */}
                    <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24 }}>Progress History</h3>
                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                            {selectedMachine.updates.map((update, i) => (
                                <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#94A3B8', width: 90 }}>{new Date(update.date).toLocaleDateString()}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Progress Update: {update.progress}%</div>
                                        <div style={{ color: '#64748B' }}>{update.remarks || 'No remarks provided.'}</div>
                                    </div>
                                </div>
                            ))}
                            {selectedMachine.updates.length === 0 && <div style={{ color: '#94A3B8', fontStyle: 'italic' }}>No updates recorded yet.</div>}
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Daily Update Card */}
                    <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Clock size={20} color="#F59E0B" /> Daily Status Update
                        </h3>
                        <div style={{ background: '#FFF7ED', padding: 12, borderRadius: 8, fontSize: '0.9rem', color: '#B45309', marginBottom: 24 }}>
                            <strong>Action Required:</strong> Please update the progress at the end of each shift.
                        </div>
                        <form onSubmit={handleDailyUpdate}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Overall Completion %</label>
                            <input
                                type="number"
                                min="0" max="100"
                                placeholder="e.g. 45"
                                value={dailyUpdate.progress}
                                onChange={e => setDailyUpdate({ ...dailyUpdate, progress: e.target.value })}
                                style={{ ...inputStyle, marginBottom: 16 }}
                            />

                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Current Stage</label>
                            <select
                                value={dailyUpdate.stage}
                                onChange={e => setDailyUpdate({ ...dailyUpdate, stage: e.target.value })}
                                style={{ ...inputStyle, marginBottom: 16, cursor: 'pointer' }}
                            >
                                <option value="" disabled>Keep as {selectedMachine.currentStage}</option>
                                {STAGES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Remarks / Delays</label>
                            <textarea
                                placeholder="Any issues faced today?"
                                value={dailyUpdate.remarks}
                                onChange={e => setDailyUpdate({ ...dailyUpdate, remarks: e.target.value })}
                                style={{ ...inputStyle, minHeight: 80, marginBottom: 16 }}
                            />
                            <button type="submit" style={{ width: '100%', padding: 12, background: '#1E293B', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Update Status</button>
                        </form>
                    </div>

                    {/* Machine Details */}
                    <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24 }}>Project Details</h3>
                        <InfoRow label="Customer" value={selectedMachine.customer} />
                        <InfoRow label="Order Date" value={new Date(selectedMachine.orderDate).toLocaleDateString()} />
                        <InfoRow label="Delivery Target" value={new Date(selectedMachine.deliveryDate).toLocaleDateString()} />
                        <InfoRow label="Supervisor" value={selectedMachine.supervisor} />
                    </div>
                    {/* Delete Button */}
                    <button
                        onClick={handleDeleteMachine}
                        style={{ marginTop: 24, width: '100%', padding: 16, background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontWeight: 600, fontSize: '1rem' }}
                    >
                        <Trash2 size={20} /> Delete Project
                    </button>

                    {/* Worker Print */}
                    <button
                        onClick={() => window.print()}
                        style={{ padding: 16, background: 'white', border: '1px solid #CBD5E1', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontWeight: 600, fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                    >
                        <Printer size={20} /> Print Worker Sheet
                    </button>
                </div>
            </div>

            {/* Print View Component - Always Rendered but Hidden via CSS Media Queries */}
            <PrintView machine={selectedMachine} />

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: 32, borderRadius: 16, width: 400, textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <AlertTriangle size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: '#1E293B' }}>Delete Project?</h2>
                        <p style={{ color: '#64748B', marginBottom: 24, fontSize: '0.95rem' }}>
                            Are you sure you want to delete <span style={{ fontWeight: 700, color: '#1E293B' }}>{selectedMachine?.name}</span>? This action is permanent and cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                style={{ flex: 1, padding: 12, background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#64748B' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{ flex: 1, padding: 12, background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s'
};

const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
        <span style={{ color: '#64748B' }}>{label}</span>
        <span style={{ fontWeight: 600, color: '#1E293B' }}>{value}</span>
    </div>
);

export default MachineManufacturing;
