import { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Eye, Edit2, Printer, Download, X, Phone, MapPin, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const JobCardList = ({ history, onEditJob }) => {
    const [quickViewJob, setQuickViewJob] = useState(null);
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

    return (
        <>
            {/* Print Styles */}
            <style>{`
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
                                <span style={{
                                    padding: '6px 12px',
                                    borderRadius: 20,
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    ...getStatusStyle(job.status)
                                }}>
                                    {job.status}
                                </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                    {/* Quick View */}
                                    <ActionButton
                                        icon={Eye}
                                        label="Quick View"
                                        onClick={() => setQuickViewJob(job)}
                                        color="var(--color-text-secondary)"
                                    />
                                    {/* Edit */}
                                    <ActionButton
                                        icon={Edit2}
                                        label="Edit"
                                        onClick={() => onEditJob(job)}
                                        color="var(--color-accent)"
                                    />
                                    {/* Print */}
                                    <ActionButton
                                        icon={Printer}
                                        label="Print"
                                        onClick={() => handlePrint(job)}
                                        color="#8B5CF6"
                                    />
                                    {/* Download */}
                                    <ActionButton
                                        icon={Download}
                                        label="Download"
                                        onClick={() => handleDownloadPDF(job)}
                                        color="#10B981"
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

            {/* Quick View Modal - Using Portal to render at body level */}
            {quickViewJob && ReactDOM.createPortal(
                <div style={{
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
                        <div className="no-print" style={{
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

                        {/* Printable Job Card Content */}
                        <div ref={printRef} className="job-card-print-area" style={{ padding: 24 }}>
                            <JobCardPrintView job={quickViewJob} />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

// Action Button Component
const ActionButton = ({ icon: Icon, label, onClick, color }) => (
    <button
        onClick={onClick}
        title={label}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'white',
            cursor: 'pointer',
            color: color,
            transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
            e.currentTarget.style.background = color + '10';
            e.currentTarget.style.borderColor = color;
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
    >
        <Icon size={18} />
    </button>
);

// Job Card Print View - Matches Reference Design
const JobCardPrintView = ({ job }) => {
    const darkBlue = '#0D3B8F';

    return (
        <div style={{ fontFamily: 'Inter, sans-serif', color: '#1E293B' }}>
            {/* Company Header Banner - Using actual image */}
            <img
                src="/rajesh-engineering-header.jpg"
                alt="Rajesh Engineering"
                style={{
                    width: '100%',
                    borderRadius: 8,
                    marginBottom: 24
                }}
            />

            {/* Job Card Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: darkBlue, margin: 0 }}>JOB CARD</h1>
                <div style={{
                    background: darkBlue,
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: '0.95rem'
                }}>{job.jobNo}</div>
            </div>


            {/* Customer Info Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                {/* Invoice To */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice to.</div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>{job.customerName || job.customer || 'N/A'}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, color: '#64748B', fontSize: '0.9rem' }}>
                        <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{job.address || 'Address not provided'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: '0.9rem' }}>
                        <Phone size={14} />
                        <span>{job.phone || 'Phone not provided'}</span>
                    </div>
                </div>

                {/* Shipping To */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shipping to.</div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>{job.plantName || job.plant || job.customerName || 'Same as Invoice'}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, color: '#64748B', fontSize: '0.9rem' }}>
                        <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{job.shippingAddress || 'Same as Invoice'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: '0.9rem' }}>
                        <Phone size={14} />
                        <span>{job.shippingPhone || '-'}</span>
                    </div>
                </div>
            </div>

            {/* Job Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                <InfoBox label="Job No" value={job.jobNo} />
                <InfoBox label="Date" value={new Date(job.jobDate || job.date).toLocaleDateString('en-GB')} />
                <InfoBox label="Status" value={job.status} />
                <InfoBox label="Priority" value={job.priority || 'Normal'} />
            </div>

            {/* Order Details Grid */}
            {job.orderDetails && job.orderDetails.filter(o => o.name).length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <div style={{ background: headerBlue, color: 'white', padding: '10px 16px', fontWeight: 700, fontSize: '0.9rem', borderRadius: '8px 8px 0 0' }}>
                        ORDER DETAILS
                    </div>
                    <div style={{ border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: '#E2E8F0' }}>
                            {job.orderDetails.filter(o => o.name).map((order, idx) => (
                                <div key={idx} style={{ background: 'white', padding: 12, textAlign: 'center' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: headerBlue, marginBottom: 4 }}>
                                        {idx + 1}. {order.name.toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>{order.model || '-'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Machines & Parts */}
            {job.machines && job.machines.length > 0 && job.machines.map((machine, mIdx) => (
                <div key={machine.id || mIdx} style={{ marginBottom: 20 }}>
                    {/* Machine Header */}
                    <div style={{
                        background: headerBlue, color: 'white',
                        padding: '10px 16px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderRadius: '8px 8px 0 0'
                    }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            {mIdx + 1}. {machine.type?.toUpperCase() || 'MACHINE'}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            MODEL NO: {machine.model || 'N/A'}
                        </span>
                    </div>

                    {/* Parts Table */}
                    {machine.parts && machine.parts.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #E2E8F0', borderTop: 'none' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC' }}>
                                    <th style={{ padding: 10, textAlign: 'left', fontWeight: 700, fontSize: '0.8rem', color: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
                                        {machine.type?.toUpperCase() || 'MACHINE'} PARTS DETAILS
                                    </th>
                                    <th style={{ padding: 10, textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>MODEL NO.</th>
                                    <th style={{ padding: 10, textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>SIZE</th>
                                    <th style={{ padding: 10, textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>QUANTITY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {machine.parts.filter(p => p.name).map((part, pIdx) => (
                                    <tr key={part.guid || pIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: 10, fontSize: '0.9rem' }}>{part.name}</td>
                                        <td style={{ padding: 10, textAlign: 'center', fontSize: '0.9rem', color: '#64748B' }}>{part.model || '-'}</td>
                                        <td style={{ padding: 10, textAlign: 'center', fontSize: '0.9rem', color: '#64748B' }}>{part.size || '-'}</td>
                                        <td style={{ padding: 10, textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>{part.qty || 1}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ))}
        </div>
    );
};

// Info Box Component
const InfoBox = ({ label, value }) => (
    <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{value || '-'}</div>
    </div>
);

export default JobCardList;
