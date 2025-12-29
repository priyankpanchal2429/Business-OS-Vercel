import { Truck, CheckCircle, Clock, ArrowRight, ArrowLeft } from 'lucide-react';

const COLUMNS = [
    { id: 'Pending', label: 'Pending', color: 'var(--color-text-secondary)', bg: 'var(--color-background-subtle)', icon: Clock },
    { id: 'In Progress', label: 'In Progress', color: 'var(--color-info)', bg: '#E0F2FE', icon: Truck },
    { id: 'Completed', label: 'Completed', color: 'var(--color-success)', bg: '#DCFCE7', icon: CheckCircle },
];

const JobCardKanban = ({ history, onEdit, onStatusChange }) => {

    // Group jobs by status
    const jobsByStatus = COLUMNS.reduce((acc, col) => {
        acc[col.id] = history.filter(job => job.status === col.id || (col.id === 'Pending' && !['In Progress', 'Quality Check', 'Completed'].includes(job.status)));
        return acc;
    }, {});

    const handleMove = (e, job, direction) => {
        e.stopPropagation();
        const statuses = COLUMNS.map(c => c.id);
        const currentIndex = statuses.indexOf(job.status) !== -1 ? statuses.indexOf(job.status) : 0;

        let newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < statuses.length) {
            onStatusChange(job.id, statuses[newIndex]);
        }
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--spacing-lg)',
            height: 'calc(100vh - 220px)', // Adjusted for header
            paddingBottom: 'var(--spacing-lg)'
        }}>
            {COLUMNS.map(col => {
                const isCompleted = col.id === 'Completed';
                return (
                    <div key={col.id} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        background: 'var(--color-background-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        overflow: 'hidden'
                    }}>

                        {/* Column Header */}
                        <div style={{
                            padding: 'var(--spacing-md)',
                            borderBottom: '1px solid var(--color-border)',
                            background: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)'
                        }}>
                            <div style={{
                                padding: 6,
                                borderRadius: 'var(--radius-sm)',
                                background: col.bg,
                                color: col.id === 'Pending' ? 'var(--color-text-secondary)' : col.color,
                                display: 'flex'
                            }}>
                                <col.icon size={16} />
                            </div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{col.label}</div>
                            <div style={{
                                marginLeft: 'auto',
                                background: 'var(--color-background-subtle)',
                                padding: '2px 8px',
                                borderRadius: 10,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--color-text-secondary)'
                            }}>
                                {jobsByStatus[col.id].length}
                            </div>
                        </div>

                        {/* Cards List */}
                        <div style={{
                            flex: 1,
                            padding: 'var(--spacing-md)',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-md)'
                        }}>
                            {jobsByStatus[col.id].map(job => (
                                <div
                                    key={job.id}
                                    style={{
                                        background: '#fff',
                                        padding: 'var(--spacing-md)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        boxShadow: 'var(--shadow-sm)',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                    }}
                                    onClick={() => onEdit(job)}
                                    className="hover:shadow-md hover:-translate-y-1" // Tailwind utility class usage simulation
                                >
                                    {/* Priority Badge */}
                                    {job.priority === 'High' && (
                                        <div style={{
                                            position: 'absolute', top: 12, right: 12,
                                            fontSize: '0.7rem', fontWeight: 700,
                                            color: 'var(--color-error)',
                                            background: '#FEF2F2',
                                            padding: '2px 8px', borderRadius: 'var(--radius-full)',
                                            border: '1px solid #FCA5A5'
                                        }}>
                                            URGENT
                                        </div>
                                    )}

                                    {/* Job ID */}
                                    <div style={{
                                        fontSize: '0.8rem', fontWeight: 700,
                                        color: 'var(--color-accent)',
                                        marginBottom: 4
                                    }}>
                                        {job.jobNo}
                                    </div>

                                    {/* Customer */}
                                    <div style={{
                                        fontWeight: 600,
                                        color: 'var(--color-text-primary)',
                                        marginBottom: 8,
                                        fontSize: '1rem',
                                        paddingRight: job.priority === 'High' ? 60 : 0
                                    }}>
                                        {job.customerName || 'Unknown Customer'}
                                    </div>

                                    {/* Details */}
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', gap: 4,
                                        fontSize: '0.85rem', color: 'var(--color-text-secondary)',
                                        marginBottom: 'var(--spacing-md)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Truck size={14} /> {job.machines?.[0]?.type || 'Machine'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Clock size={14} /> {job.jobDate}
                                        </div>
                                    </div>

                                    {/* Actions Footer */}
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        marginTop: 'auto', paddingTop: 'var(--spacing-sm)',
                                        borderTop: '1px solid var(--color-background-subtle)'
                                    }}>
                                        {/* Back Button */}
                                        <button
                                            onClick={(e) => handleMove(e, job, -1)}
                                            style={{
                                                visibility: col.id === 'Pending' ? 'hidden' : 'visible',
                                                padding: 6, borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--color-border)',
                                                background: 'var(--color-background)',
                                                color: 'var(--color-text-secondary)'
                                            }}
                                            title="Move Back"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>

                                        <span style={{
                                            fontSize: '0.7rem', fontWeight: 700,
                                            color: 'var(--color-text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            {isCompleted ? 'DONE' : 'MOVE'}
                                        </span>

                                        {/* Forward Button */}
                                        <button
                                            onClick={(e) => handleMove(e, job, 1)}
                                            style={{
                                                visibility: col.id === 'Completed' ? 'hidden' : 'visible',
                                                padding: 6, borderRadius: 'var(--radius-sm)',
                                                border: 'none',
                                                background: 'var(--color-accent)',
                                                color: '#fff',
                                                boxShadow: 'var(--shadow-sm)'
                                            }}
                                            title="Move Next"
                                        >
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {jobsByStatus[col.id].length === 0 && (
                                <div style={{
                                    padding: 'var(--spacing-xl)',
                                    textAlign: 'center',
                                    color: 'var(--color-text-secondary)',
                                    fontStyle: 'italic',
                                    fontSize: '0.9rem',
                                    opacity: 0.7
                                }}>
                                    No cards
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default JobCardKanban;
