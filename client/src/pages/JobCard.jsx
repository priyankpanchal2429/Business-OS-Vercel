import React, { useState } from 'react';
import { Plus, LayoutGrid, List, Search, AlertCircle, CheckCircle, Clock, CheckSquare } from 'lucide-react';
import JobCardList from '../components/JobCard/JobCardList';
import JobCardEditor from '../components/JobCard/JobCardEditor';


const JobCard = () => {

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // MOCK DATA
    const [history, setHistory] = useState([
        {
            id: 101, jobNo: 'JC-24-001', jobDate: '2024-12-20',
            customerName: 'Acme Corp', status: 'Completed', priority: 'Normal',
            machines: [{ id: 'm1', type: 'Lathe', model: 'L-200' }],
            orderDetails: []
        },
        {
            id: 102, jobNo: 'JC-24-105', jobDate: '2024-12-25',
            customerName: 'Steel India Ltd', status: 'In Progress', priority: 'High',
            machines: [{ id: 'm2', type: 'CNC Router', model: 'X5' }],
            orderDetails: []
        },
        {
            id: 103, jobNo: 'JC-24-106', jobDate: '2024-12-26',
            customerName: 'Rajesh Eng', status: 'Pending', priority: 'Normal',
            machines: [{ id: 'm3', type: 'Mixer', model: 'M-100' }],
            orderDetails: []
        },
        {
            id: 104, jobNo: 'JC-24-107', jobDate: '2024-12-26',
            customerName: 'Global Exports', status: 'Quality Check', priority: 'High',
            machines: [{ id: 'm4', type: 'Grinder', model: 'G-Pro' }],
            orderDetails: []
        },
    ]);

    const initialFormState = {
        id: '', jobNo: `JC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        jobDate: new Date().toISOString().split('T')[0], customerName: '', plantName: '', status: 'Pending', priority: 'Normal',
        orderDetails: Array(5).fill(null).map((_, i) => ({ id: i, name: '', model: '' })),
        machines: [{ id: `m-${Date.now()}`, type: '', model: '', parts: [{ id: `p-${Date.now()}`, guid: `g-${Date.now()}`, name: '', model: '', size: '', qty: 1 }] }]
    };

    const [currentJob, setCurrentJob] = useState(initialFormState);

    // --- ACTIONS ---
    const handleNewJob = () => {
        setCurrentJob(initialFormState);
        setIsEditorOpen(true);
    };

    const handleEditJob = (job) => {
        setCurrentJob({ ...initialFormState, ...job });
        setIsEditorOpen(true);
    };

    const handleSave = (savedData) => {
        const newRecord = { ...savedData, id: savedData.id || Date.now() };
        setHistory(prev => {
            const idx = prev.findIndex(p => p.id === newRecord.id);
            if (idx >= 0) {
                const newArr = [...prev];
                newArr[idx] = newRecord;
                return newArr;
            }
            return [newRecord, ...prev];
        });
        setIsEditorOpen(false);
    };

    const handleStatusChange = (id, newStatus) => {
        setHistory(prev => prev.map(job => job.id === id ? { ...job, status: newStatus } : job));
    };

    // --- STATS ---
    const stats = {
        active: history.filter(j => ['Pending', 'In Progress'].includes(j.status)).length,
        urgent: history.filter(j => j.priority === 'High' && j.status !== 'Completed').length,
        qc: history.filter(j => j.status === 'Quality Check').length,
        total: history.length
    };

    // --- FILTER ---
    const filteredHistory = history.filter(j =>
        (j.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j.jobNo || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isEditorOpen) {
        return <JobCardEditor initialData={currentJob} onSave={handleSave} onCancel={() => setIsEditorOpen(false)} />;
    }

    return (
        <div style={{ maxWidth: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* 1. Header Section */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                marginBottom: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-md)',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>Production Hub</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Track, manage, and deliver manufacturing orders.</p>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <StatBadge icon={Clock} label="Active" value={stats.active} color="var(--color-info)" />
                    <StatBadge icon={AlertCircle} label="Urgent" value={stats.urgent} color="var(--color-error)" />
                    <StatBadge icon={CheckSquare} label="Quality Check" value={stats.qc} color="var(--color-warning)" />
                </div>
            </div>

            {/* 2. Controls Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>


                {/* Search & Action */}
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search by Job No or Customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: '10px 12px 10px 40px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                width: 280,
                                fontSize: '0.9rem',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </div>

                    <button
                        onClick={handleNewJob}
                        style={{
                            background: 'var(--color-accent)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 8,
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-md)',
                            transition: 'transform 0.1s'
                        }}
                        id="new-job-btn"
                    >
                        <Plus size={20} /> New Job
                    </button>
                </div>
            </div>

            {/* 3. Main Views */}
            <div style={{ flex: 1 }}>
                <JobCardList history={filteredHistory} onEditJob={handleEditJob} onNewJob={handleNewJob} />
            </div>
        </div>
    );
};

// Components
const StatBadge = ({ icon: Icon, label, value, color }) => (
    <div style={{
        background: '#fff',
        padding: '10px 20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: 'var(--shadow-sm)',
        minWidth: 140
    }}>
        <div style={{
            padding: 8,
            borderRadius: '50%',
            background: color,
            color: '#fff', // White icon on colored bg for better contrast
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.9
        }}>
            <Icon size={18} strokeWidth={2.5} />
        </div>
        <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1, marginBottom: 2 }}>{value}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        </div>
    </div>
);

const ViewButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            background: active ? 'var(--color-background-subtle)' : 'transparent',
            color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '0.9rem',
            transition: 'all 0.2s'
        }}
    >
        <Icon size={18} strokeWidth={active ? 2.5 : 2} /> {label}
    </button>
);

export default JobCard;
