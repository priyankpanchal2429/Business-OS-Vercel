import React, { forwardRef } from 'react';
import { Hexagon } from 'lucide-react';

const JobCardPrint = forwardRef(({ data }, ref) => {
    // Determine number of machines to decide on page breaks or spacing if needed.
    // For now, we follow the standard single-page-first approach.

    return (
        <div
            ref={ref}
            className="job-card-print"
            style={{
                width: '210mm',
                minHeight: '297mm',
                background: 'white',
                padding: '40px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', // Optional shadow for preview
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
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E293B', margin: 0, lineHeight: 1 }}>
                        {data.jobNo || 'JC-####-###'}
                    </h1>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8, minWidth: '200px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1E293B' }}>
                        {data.customerName || 'Customer Name'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: '#64748B' }}>
                            {data.plantName || 'Plant / Project'}
                        </span>
                        <span style={{ color: '#E2E8F0' }}>|</span>
                        <span style={{ fontSize: '0.9rem', color: '#64748B' }}>
                            {data.jobDate ? new Date(data.jobDate).toLocaleDateString('en-GB') : 'DD/MM/YYYY'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Order Details Grid (5 Cols) */}
            <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#1E293B', marginBottom: 12, letterSpacing: '0.05em' }}>Order Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                    {data.orderDetails && data.orderDetails.map((item, index) => (
                        <div key={index} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: 10 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', marginBottom: 4, minHeight: '1.2em' }}>
                                {item.name || ''}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748B', minHeight: '1em' }}>
                                {item.model || ''}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Machines List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: 1 }}>
                {data.machines.map((machine, mIndex) => (
                    <div key={machine.id || mIndex} style={{ breakInside: 'avoid' }}>
                        {/* Machine Title Bar - Deep Blue */}
                        <div style={{
                            background: '#2563EB',
                            borderRadius: '8px',
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 20,
                            color: 'white',
                            marginBottom: '10px',
                            // Print specific override to ensure background color prints
                            printColorAdjust: 'exact',
                            WebkitPrintColorAdjust: 'exact'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.9, textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Machine Name</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{machine.type || 'Machine Type'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.65rem', opacity: 0.9, textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Model No.</div>
                                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{machine.model || '-'}</div>
                            </div>
                        </div>

                        {/* Parts Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, width: '55%' }}>Part Name</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, width: '15%' }}>Model No</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, width: '15%' }}>Size</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, width: '15%' }}>QTY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {machine.parts.map((part, pIndex) => (
                                    <tr key={part.id || pIndex} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#334155' }}>
                                            {part.name}
                                        </td>
                                        <td style={{ padding: '8px 12px', color: '#64748B', textAlign: 'right' }}>
                                            {part.model}
                                        </td>
                                        <td style={{ padding: '8px 12px', color: '#64748B', textAlign: 'right' }}>
                                            {part.size}
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                                            {part.qty}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {/* 3. Footer */}
            <div style={{ marginTop: 'auto', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, background: '#1E3A8A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
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
                /* Print Specific Styles to ensure clean output */
                @media print {
                    @page { margin: 0; size: A4; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
});

export default JobCardPrint;
