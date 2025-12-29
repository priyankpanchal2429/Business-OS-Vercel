import { useState } from 'react';
import { Plus, Search, Clipboard } from 'lucide-react';
import JobCardList from '../components/JobCard/JobCardList';
import JobCardEditor from '../components/JobCard/JobCardEditor';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';

const JobCard = () => {

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // MOCK DATA - Realistic job cards matching reference format
    const [history, setHistory] = useState([
        {
            id: 101,
            jobNo: 'JC-24-001',
            jobDate: '2024-12-20',
            customerName: 'Heena Poultry Farm',
            plantName: 'Chaprashipura Plant',
            address: 'In Front of Circuit House, Chaprashipura, Amravati - 444602',
            phone: '+91 86690 26879 | +91 74986 89962',
            status: 'Completed',
            priority: 'Normal',
            orderDetails: [
                { id: 1, name: 'Grinder', model: '14" x 16"' },
                { id: 2, name: 'Grinder Elevator', model: '16\' Foot' },
                { id: 3, name: 'Ribbon Mixer', model: '500KG' },
                { id: 4, name: 'Mixer Elevator', model: '22\' Foot' },
                { id: 5, name: 'Store Tank', model: '500KG' }
            ],
            machines: [
                {
                    id: 'm1', type: 'Grinder', model: 'REG1416',
                    parts: [
                        { id: 'p1', guid: 'g1', name: 'Better Blade', model: '-', size: '140 X 50', qty: 40 },
                        { id: 'p2', guid: 'g2', name: 'Better Rod', model: '-', size: '13.5"', qty: 8 },
                        { id: 'p3', guid: 'g3', name: 'Bearing with Pedestal', model: '6308-2308', size: '-', qty: 2 },
                        { id: 'p4', guid: 'g4', name: 'Hopper', model: '-', size: '500KG', qty: 1 },
                        { id: 'p5', guid: 'g5', name: 'Motor HP & Book No', model: 'WGAM35373', size: '15HP 1440', qty: 1 }
                    ]
                },
                {
                    id: 'm2', type: 'Grinder Elevator', model: 'REGE16',
                    parts: [
                        { id: 'p6', guid: 'g6', name: 'Bearing Top', model: '207', size: '-', qty: 2 },
                        { id: 'p7', guid: 'g7', name: 'Bearing Bottom', model: '208', size: '-', qty: 2 },
                        { id: 'p8', guid: 'g8', name: 'Rubber Belt', model: '-', size: '40 Foot', qty: 1 },
                        { id: 'p9', guid: 'g9', name: 'Bucket', model: '-', size: '4"', qty: 42 }
                    ]
                }
            ]
        },
        {
            id: 102,
            jobNo: 'JC-24-105',
            jobDate: '2024-12-25',
            customerName: 'Steel India Ltd',
            plantName: 'Nagpur Plant',
            address: 'MIDC Industrial Area, Nagpur - 440001',
            phone: '+91 98765 43210',
            status: 'In Progress',
            priority: 'High',
            orderDetails: [
                { id: 1, name: 'CNC Router', model: 'X5 Pro' },
                { id: 2, name: 'Motor', model: '15HP 1440' }
            ],
            machines: [
                {
                    id: 'm2', type: 'CNC Router', model: 'X5',
                    parts: [
                        { id: 'p1', guid: 'g1', name: 'Spindle Motor', model: 'SM-500', size: '5HP', qty: 1 },
                        { id: 'p2', guid: 'g2', name: 'Ball Screw', model: 'BS-2010', size: '20mm', qty: 3 }
                    ]
                }
            ]
        },
        {
            id: 103,
            jobNo: 'JC-24-106',
            jobDate: '2024-12-26',
            customerName: 'Rajesh Engineering',
            plantName: 'Main Factory',
            address: 'Industrial Area, Pune - 411001',
            phone: '+91 77777 88888',
            status: 'Pending',
            priority: 'Normal',
            orderDetails: [
                { id: 1, name: 'Ribbon Mixer', model: '500KG' },
                { id: 2, name: 'Store Tank', model: '1000L' }
            ],
            machines: [
                {
                    id: 'm3', type: 'Ribbon Mixer', model: 'RERM500',
                    parts: [
                        { id: 'p1', guid: 'g1', name: 'Bearing with Pedestal', model: '211-213-208', size: '-', qty: 2 },
                        { id: 'p2', guid: 'g2', name: 'Motor HP & Book No', model: 'VKGM01068', size: '7.5HP 960', qty: 1 },
                        { id: 'p3', guid: 'g3', name: 'Motor Pully', model: '5-3-C', size: '5"', qty: 1 }
                    ]
                }
            ]
        },
        {
            id: 104,
            jobNo: 'JC-24-107',
            jobDate: '2024-12-26',
            customerName: 'Global Exports',
            plantName: 'Export Unit',
            address: 'SEZ Zone, Mumbai - 400001',
            phone: '+91 99999 00000',
            status: 'In Progress',
            priority: 'High',
            orderDetails: [
                { id: 1, name: 'Grinder', model: '20" x 20"' },
                { id: 2, name: 'Safety Net', model: 'Standard' }
            ],
            machines: [
                {
                    id: 'm4', type: 'Grinder', model: 'G-Pro',
                    parts: [
                        { id: 'p1', guid: 'g1', name: 'Grinder Blade', model: 'GB-100', size: '20"', qty: 20 },
                        { id: 'p2', guid: 'g2', name: 'Safety Net', model: 'SN-01', size: 'Standard', qty: 1 }
                    ]
                }
            ]
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

    // --- STATS ---
    const stats = {
        total: history.length,
        pending: history.filter(j => j.status === 'Pending').length,
        inProgress: history.filter(j => j.status === 'In Progress').length,
        completed: history.filter(j => j.status === 'Completed').length
    };

    // --- FILTER ---
    const filteredHistory = history.filter(j => {
        const matchesStatus = filterStatus === 'All' || j.status === filterStatus;
        const matchesSearch = (j.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (j.jobNo || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (isEditorOpen) {
        return <JobCardEditor initialData={currentJob} onSave={handleSave} onCancel={() => setIsEditorOpen(false)} />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Page Header */}
            <PageHeader
                title="Job Cards"
                subtitle="Track and manage manufacturing job orders."
                icon={Clipboard}
                actions={
                    <button
                        onClick={handleNewJob}
                        id="new-job-btn"
                        style={{
                            background: 'var(--color-accent)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-md)',
                            transition: 'transform 0.1s, box-shadow 0.2s',
                            fontSize: '0.95rem'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                    >
                        <Plus size={20} /> New Job Card
                    </button>
                }
            />

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
                <StatCard label="Total Jobs" value={stats.total} color="var(--color-text-primary)" />
                <StatCard label="Pending" value={stats.pending} color="#FF9500" />
                <StatCard label="In Progress" value={stats.inProgress} color="var(--color-accent)" />
                <StatCard label="Completed" value={stats.completed} color="var(--color-success)" />
            </div>

            {/* Filters & Table */}
            <Card style={{ padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Toolbar */}
                <div style={{
                    padding: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                    background: 'var(--color-background-subtle)'
                }}>
                    {/* Status Filter Pills */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        {['All', 'Pending', 'In Progress', 'Completed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: 20,
                                    border: 'none',
                                    background: filterStatus === status ? 'var(--color-text-primary)' : 'white',
                                    color: filterStatus === status ? 'white' : 'var(--color-text-primary)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative', width: 280 }}>
                        <Search size={16} style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--color-text-secondary)'
                        }} />
                        <input
                            type="text"
                            placeholder="Search by Job No or Customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 40px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.9rem',
                                outline: 'none',
                                transition: 'all 0.2s',
                                background: 'white'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </div>
                </div>

                {/* Job List */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <JobCardList history={filteredHistory} onEditJob={handleEditJob} onNewJob={handleNewJob} />
                </div>
            </Card>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ label, value, color }) => (
    <Card style={{ padding: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color }}>{value}</span>
            </div>
            <div>
                <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    {label}
                </div>
            </div>
        </div>
    </Card>
);

export default JobCard;
