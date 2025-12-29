import { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Eye, Edit2, Printer, Download, X, FileText, Copy, MoreHorizontal, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JobCardPrint from './JobCardPrint';
import DeleteConfirmationModal from '../DeleteConfirmationModal';

const JobCardList = ({ history, onEditJob, onDuplicateJob, onDeleteJob, onStatusUpdate }) => {
    const [quickViewJob, setQuickViewJob] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });
    const printRef = useRef(null);

    // Status color mapping
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed':
                return { background: 'rgba(52, 199, 89, 0.15)', color: '#34C759' };
            case 'In Progress':
                return { background: 'rgba(0, 122, 255, 0.15)', color: '#007AFF' };
            case 'Pending':
                return { background: 'rgba(255, 149, 0, 0.15)', color: '#FF9500' };
            default:
                return { background: '#F1F5F9', color: '#64748B' };
        }
    };

    // Print handler
    const handlePrint = (job) => {
        setQuickViewJob(job);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    // Download PDF handler
    const handleDownloadPDF = async (job) => {
        setQuickViewJob(job);
        setTimeout(async () => {
            if (printRef.current) {
                try {
                    const canvas = await html2canvas(printRef.current, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff'
                    });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`${job.jobNo || 'JobCard'}.pdf`);
                } catch (err) {
                    console.error('PDF generation failed:', err);
                }
            }
            setQuickViewJob(null);
        }, 500);
    };

    const handleDeleteClick = (job) => {
        console.log('Delete Clicked for job:', job);
        setDeleteModal({ isOpen: true, item: job });
    };

    const handleConfirmDelete = () => {
        if (deleteModal.item && onDeleteJob) {
            onDeleteJob(deleteModal.item);
            setDeleteModal({ isOpen: false, item: null });
        }
    };

    return (
        <>
            {/* Print Styles */}
            <style>{`
                @media screen {
                    .print-only { display: none; }
                }
                @media print {
                    body * { visibility: hidden; }
                    .job-card-print-area, .job-card-print-area * { visibility: visible; }
                    .job-card-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* Job Cards Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'var(--color-background-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                    <tr>
                        <th style={{ padding: 16, color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job No</th>
                        <th style={{ padding: 16, color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                        <th style={{ padding: 16, color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</th>
                        <th style={{ padding: 16, color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plant</th>
                        <th style={{ padding: 16, color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                        <th style={{ padding: 16, color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map(job => (
                        <tr key={job.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-background-subtle)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: 16 }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{job.jobNo}</span>
                            </td>
                            <td style={{ padding: 16, color: 'var(--color-text-secondary)' }}>
                                {new Date(job.date || job.jobDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td style={{ padding: 16, fontWeight: 500 }}>{job.customer || job.customerName || '-'}</td>
                            <td style={{ padding: 16, color: 'var(--color-text-secondary)' }}>{job.plant || job.plantName || '-'}</td>
                            <td style={{ padding: 16 }}>
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <select
                                        value={job.status}
                                        onChange={(e) => onStatusUpdate && onStatusUpdate(job.id, e.target.value)}
                                        style={{
                                            appearance: 'none',
                                            padding: '6px 28px 6px 12px',
                                            borderRadius: 20,
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            border: 'none',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            ...getStatusStyle(job.status),
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right 8px center'
                                        }}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                                    {/* Primary: View */}
                                    <button
                                        onClick={() => setQuickViewJob(job)}
                                        title="Quick View"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '6px 12px',
                                            borderRadius: 6,
                                            border: '1px solid var(--color-border)',
                                            background: 'white',
                                            cursor: 'pointer',
                                            color: 'var(--color-text-primary)',
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.background = 'var(--color-background-subtle)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.background = 'white';
                                        }}
                                    >
                                        <Eye size={14} /> View
                                    </button>

                                    {/* Primary: Edit */}
                                    <button
                                        onClick={() => onEditJob(job)}
                                        title="Edit"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '6px 12px',
                                            borderRadius: 6,
                                            border: 'none',
                                            background: 'var(--color-accent)',
                                            cursor: 'pointer',
                                            color: 'white',
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.opacity = '0.9';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.opacity = '1';
                                        }}
                                    >
                                        <Edit2 size={14} /> Edit
                                    </button>

                                    {/* More Actions Dropdown */}
                                    <ActionDropdown
                                        job={job}
                                        onDuplicate={onDuplicateJob ? () => onDuplicateJob(job) : null}
                                        onPrint={() => handlePrint(job)}
                                        onDownload={() => handleDownloadPDF(job)}
                                        onDelete={onDeleteJob ? () => handleDeleteClick(job) : null}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                    {history.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                <FileText size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                                <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: 4 }}>No job cards found</div>
                                <div style={{ fontSize: '0.9rem' }}>Create a new job card to get started.</div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Quick View & Print Portal */}
            {quickViewJob && ReactDOM.createPortal(
                <>
                    {/* Screen Modal (Hidden on Print) */}
                    <div className="no-print" style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 24
                    }} onClick={() => setQuickViewJob(null)}>
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'white',
                                borderRadius: 16,
                                width: '100%',
                                maxWidth: 900,
                                maxHeight: '90vh',
                                overflow: 'auto',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '16px 24px',
                                borderBottom: '1px solid var(--color-border)',
                                background: 'var(--color-background-subtle)'
                            }}>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                                    Job Card Preview - {quickViewJob.jobNo}
                                </h2>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => handlePrint(quickViewJob)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '8px 16px', borderRadius: 8,
                                            border: '1px solid var(--color-border)',
                                            background: 'white', cursor: 'pointer',
                                            fontWeight: 500, fontSize: '0.9rem'
                                        }}
                                    >
                                        <Printer size={16} /> Print
                                    </button>
                                    <button
                                        onClick={() => handleDownloadPDF(quickViewJob)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '8px 16px', borderRadius: 8,
                                            border: 'none',
                                            background: 'var(--color-accent)', color: 'white',
                                            cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem'
                                        }}
                                    >
                                        <Download size={16} /> Download PDF
                                    </button>
                                    <button
                                        onClick={() => setQuickViewJob(null)}
                                        style={{
                                            padding: 8, borderRadius: 8,
                                            border: 'none', background: 'transparent',
                                            cursor: 'pointer', color: 'var(--color-text-secondary)'
                                        }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* View Only Content */}
                            <div style={{ padding: 24 }}>
                                <JobCardPrint data={quickViewJob} />
                            </div>
                        </div>
                    </div>

                    {/* Print Only Content (Hidden on Screen) */}
                    <div className="job-card-print-area print-only" style={{ padding: 24, background: 'white' }}>
                        <JobCardPrint ref={printRef} data={quickViewJob} />
                    </div>
                </>,
                document.body
            )}

            {/* Custom Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, item: null })}
                onConfirm={handleConfirmDelete}
                itemName={deleteModal.item?.jobNo}
                itemType="Job Card"
                message="Are you sure you want to delete this job card? This action cannot be undone."
            />
        </>
    );
};

// Action Dropdown Component for secondary actions - Using Portal
const ActionDropdown = ({ job, onDuplicate, onPrint, onDownload, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);

    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
        if (buttonRef.current && !buttonRef.current.contains(e.target)) {
            setIsOpen(false);
        }
    };

    // Update position when opening
    const handleToggle = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                left: rect.right - 160 // Align right edge
            });
        }
        setIsOpen(!isOpen);
    };

    // Add/remove event listener
    if (typeof window !== 'undefined' && isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                title="More Actions"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: '1px solid var(--color-border)',
                    background: isOpen ? 'var(--color-background-subtle)' : 'white',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                    if (!isOpen) e.currentTarget.style.background = 'var(--color-background-subtle)';
                }}
                onMouseOut={(e) => {
                    if (!isOpen) e.currentTarget.style.background = 'white';
                }}
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && ReactDOM.createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left,
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        minWidth: 160,
                        zIndex: 99999,
                        overflow: 'hidden'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {onDuplicate && (
                        <DropdownItem icon={Copy} label="Duplicate" onClick={() => { onDuplicate(); setIsOpen(false); }} />
                    )}
                    <DropdownItem icon={Printer} label="Print" onClick={() => { onPrint(); setIsOpen(false); }} />
                    <DropdownItem icon={Download} label="Download PDF" onClick={() => { onDownload(); setIsOpen(false); }} />
                    {onDelete && (
                        <>
                            <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />
                            <DropdownItem icon={Trash2} label="Delete" onClick={() => { onDelete(); setIsOpen(false); }} danger />
                        </>
                    )}
                </div>,
                document.body
            )}
        </>
    );
};

// Dropdown Item Component
const DropdownItem = ({ icon: Icon, label, onClick, danger }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '10px 14px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: danger ? '#EF4444' : 'var(--color-text-primary)',
            fontSize: '0.85rem',
            fontWeight: 500,
            textAlign: 'left',
            transition: 'background 0.15s'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = danger ? '#FEE2E2' : 'var(--color-background-subtle)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
        <Icon size={16} style={{ color: danger ? '#EF4444' : 'var(--color-text-secondary)' }} />
        {label}
    </button>
);

// Info Box Component
const InfoBox = ({ label, value }) => (
    <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{value || '-'}</div>
    </div>
);

export default JobCardList;

