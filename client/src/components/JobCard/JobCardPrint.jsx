import { forwardRef } from 'react';

const JobCardPrint = forwardRef(function JobCardPrint({ data }, ref) {
    const headerBlue = '#0D3B8F';
    const accentBlue = '#2563EB';

    return (
        <div
            ref={ref}
            className="job-card-print"
            style={{
                width: '210mm',
                minHeight: '297mm',
                background: 'white',
                padding: '32px 40px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                position: 'relative',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            }}
        >
            {/* 1. Company Header - Fixed & Locked */}
            <img
                src="/rajesh-engineering-header.jpg"
                alt="Company Header"
                style={{
                    width: '100%',
                    borderRadius: 8,
                    marginBottom: 8
                }}
            />

            {/* 2. Job Card Title Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: headerBlue, margin: 0, letterSpacing: '-0.02em' }}>JOB CARD</h1>
                <div style={{
                    background: headerBlue,
                    color: 'white',
                    padding: '8px 20px',
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: '1rem'
                }}>{data.jobNo || 'JC-####-###'}</div>
            </div>

            {/* 3. Customer Information Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
                {/* Invoice To */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Customer Details</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6, color: '#1E293B' }}>{data.customerName || 'Customer Name'}</div>
                    <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: 4 }}>{data.plantName || 'Company / Farm Name'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 4 }}>{data.address || 'Address not provided'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>{data.phone || 'Phone not provided'}</div>
                </div>

                {/* Job Details */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Job Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase' }}>Job No.</div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: headerBlue }}>{data.jobNo}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase' }}>Date</div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{data.jobDate ? new Date(data.jobDate).toLocaleDateString('en-GB') : 'DD/MM/YYYY'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase' }}>Status</div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{data.status || 'Pending'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase' }}>Priority</div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{data.priority || 'Normal'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Order Details Grid */}
            {data.orderDetails && data.orderDetails.filter(o => o.name).length > 0 && (
                <div style={{ marginBottom: 8 }}>
                    <div style={{ background: headerBlue, color: 'white', padding: '10px 16px', fontWeight: 700, fontSize: '0.85rem', borderRadius: '8px 8px 0 0', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                        ORDER DETAILS
                    </div>
                    <div style={{ border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#E2E8F0' }}>
                            {data.orderDetails.filter(o => o.name).map((order, idx) => (
                                <div key={idx} style={{ background: 'white', padding: 12, textAlign: 'center' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: headerBlue, marginBottom: 4 }}>
                                        {idx + 1}. {order.name.toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>{order.model || '-'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Machines & Parts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                {data.machines && data.machines.map((machine, mIndex) => (
                    <div key={machine.id || mIndex} style={{ breakInside: 'avoid' }}>
                        {/* Machine Title Bar */}
                        <div style={{
                            background: accentBlue,
                            borderRadius: '8px 8px 0 0',
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 20,
                            color: 'white',
                            printColorAdjust: 'exact',
                            WebkitPrintColorAdjust: 'exact'
                        }}>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                {mIndex + 1}. {machine.type?.toUpperCase() || 'MACHINE'}
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.2)',
                                padding: '6px 14px',
                                borderRadius: 6,
                                fontWeight: 700,
                                fontSize: '0.9rem'
                            }}>
                                MODEL: {machine.model || 'N/A'}
                            </div>
                        </div>

                        {/* Parts Table */}
                        {machine.parts && machine.parts.length > 0 && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', border: '1px solid #E2E8F0', borderTop: 'none' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#1E293B', fontWeight: 700, width: '45%' }}>Part Name</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: '#1E293B', fontWeight: 700, width: '18%' }}>Model No.</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: '#1E293B', fontWeight: 700, width: '22%' }}>Specification / Size</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: '#1E293B', fontWeight: 700, width: '15%' }}>Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {machine.parts.filter(p => p.name).map((part, pIndex) => (
                                        <tr key={part.id || pIndex} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td style={{ padding: '10px 16px', fontWeight: 600, color: '#334155' }}>{part.name}</td>
                                            <td style={{ padding: '10px 16px', color: '#64748B', textAlign: 'center' }}>{part.model || '-'}</td>
                                            <td style={{ padding: '10px 16px', color: '#64748B', textAlign: 'center' }}>{part.size || '-'}</td>
                                            <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700 }}>{part.qty || 1}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                ))}
            </div>

            {/* 6. Signature Footer */}
            <div style={{ marginTop: 'auto', paddingTop: 40, borderTop: '1px solid #E2E8F0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #1E293B', height: 40, marginBottom: 8 }}></div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Prepared By</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #1E293B', height: 40, marginBottom: 8 }}></div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Checked By</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #1E293B', height: 40, marginBottom: 8 }}></div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Authorized Sign</div>
                    </div>
                </div>
            </div>

            <style>{`
                /* Print Specific Styles */
                @media print {
                    @page { margin: 10mm; size: A4; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .job-card-print { box-shadow: none; }
                }
            `}</style>
        </div>
    );
});

export default JobCardPrint;

